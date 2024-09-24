from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models import Base, Course, Faculty, Section, ClassSession
from database import get_db, engine
from schemas import ScheduleRequest
import pdfplumber
import pandas as pd
import io

app = FastAPI()

Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.get("/api/courses")
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    return [{"code": course.code} for course in courses]


@app.get("/api/courses/{course_code}/faculties")
def get_faculties(course_code: str, db: Session = Depends(get_db)):
    sections = db.query(Section).filter(
        Section.course_code == course_code).all()
    faculty_set = set()
    for section in sections:
        faculty = db.query(Faculty).filter(
            Faculty.id == section.faculty_id).first()
        if faculty:
            faculty_set.add(faculty.name)
    return list(faculty_set)


@app.post("/api/schedules")
def get_schedules(request: ScheduleRequest, db: Session = Depends(get_db)):
    from itertools import product

    # Fetch sections for each selected course
    course_sections = {}
    for course_code in request.courses:
        query = db.query(Section).join(ClassSession).filter(
            Section.course_code == course_code)
        # Apply faculty preference if any
        preferred_faculty = request.preferences.get(course_code)
        if preferred_faculty:
            faculty = db.query(Faculty).filter(
                Faculty.name == preferred_faculty).first()
            if faculty:
                query = query.filter(Section.faculty_id == faculty.id)
            else:
                # Preferred faculty not found for this course
                raise HTTPException(
                    status_code=400,
                    detail=f"Preferred faculty '{
                        preferred_faculty}' not found for course '{course_code}'."
                )
        sections = query.all()
        if not sections:
            # No sections found for this course
            raise HTTPException(
                status_code=400,
                detail=f"No available sections found for course '{
                    course_code}'."
            )
        course_sections[course_code] = sections

    # Ensure all courses are included
    if set(course_sections.keys()) != set(request.courses):
        missing_courses = set(request.courses) - set(course_sections.keys())
        raise HTTPException(
            status_code=400,
            detail=f"No available sections found for courses: {
                ', '.join(missing_courses)}."
        )

    # Generate all possible combinations
    all_combinations = list(product(*course_sections.values()))
    valid_schedules = []

    for combination in all_combinations:
        schedule_conflict = False
        time_slots = []
        for section in combination:
            class_sessions = db.query(ClassSession).filter(
                ClassSession.section_id == section.id).all()
            for session in class_sessions:
                if session.day in request.unavailable_days:
                    schedule_conflict = True
                    break
                session_time = {
                    'day': session.day,
                    'start_time': session.start_time,
                    'end_time': session.end_time
                }
                if any(is_time_conflict(session_time, ts) for ts in time_slots):
                    schedule_conflict = True
                    break
                time_slots.append(session_time)
            if schedule_conflict:
                break
        if not schedule_conflict:
            # Build schedule response
            schedule = []
            for section in combination:
                section_info = {
                    'course_code': section.course_code,
                    'section_number': section.section_number,
                    'faculty': section.faculty.name,
                    'classes': []
                }
                class_sessions = db.query(ClassSession).filter(
                    ClassSession.section_id == section.id).all()
                for session in class_sessions:
                    class_info = {
                        'day': session.day,
                        'start_time': session.start_time,
                        'end_time': session.end_time,
                        'room': session.room
                    }
                    section_info['classes'].append(class_info)
                schedule.append(section_info)
            valid_schedules.append(schedule)

    return valid_schedules


def is_time_conflict(session1, session2):
    if session1['day'] != session2['day']:
        return False
    from datetime import datetime

    fmt = '%I:%M %p'
    start1 = datetime.strptime(session1['start_time'], fmt)
    end1 = datetime.strptime(session1['end_time'], fmt)
    start2 = datetime.strptime(session2['start_time'], fmt)
    end2 = datetime.strptime(session2['end_time'], fmt)

    latest_start = max(start1, start2)
    earliest_end = min(end1, end2)
    delta = (earliest_end - latest_start).total_seconds()
    return delta > 0  # Returns True if there is an overlap


@app.post("/api/update-database")
def update_database(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type")

    try:
        pdf_bytes = file.file.read()
        pdf_file = io.BytesIO(pdf_bytes)

        with pdfplumber.open(pdf_file) as pdf:
            all_tables = []
            print("Extracting data...")
            for page_num, page in enumerate(pdf.pages, start=1):
                tables = page.extract_tables()
                for table in tables:
                    if len(table) < 2:
                        continue  # Skip empty tables
                    # Assuming first row is header
                    df = pd.DataFrame(table[1:], columns=table[0])
                    all_tables.append(df)
        # Combine all dataframes
        print("Combining data...")
        if not all_tables:
            raise HTTPException(
                status_code=400, detail="No tables found in PDF")
        data = pd.concat(all_tables, ignore_index=True)
        # Clean and process data
        data = data.rename(columns=lambda x: x.strip())
        data = data.dropna(subset=['Course'])
        # Process data and store in database
        print("Writing to db...")
        update_database_with_dataframe(data, db)
        return {"message": "Database updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def update_database_with_dataframe(df: pd.DataFrame, db: Session):
    try:
        print("Starting database update...")
        # Start a transaction
        with db.begin():
            print("Clearing existing data...")
            # Clear existing data
            db.query(ClassSession).delete()
            db.query(Section).delete()
            db.query(Faculty).delete()
            db.query(Course).delete()
            db.flush()
            print("Existing data cleared.")

            total_rows = df.shape[0]
            print(f"Total rows to process: {total_rows}")

            # Clean DataFrame
            print("Cleaning data...")
            df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
            print("Data cleaned.")

            # Process Courses
            print("Processing courses...")
            course_codes = df['Course'].unique()
            print(f"Found {len(course_codes)} unique courses.")
            courses = [Course(code=code) for code in course_codes]
            db.bulk_save_objects(courses)
            db.flush()
            print("Courses saved to database.")

            # Build course mapping
            course_map = {
                course.code: course for course in db.query(Course).all()}
            print("Course mapping created.")

            # Process Faculties
            print("Processing faculties...")
            faculty_names = df['Faculty'].unique()
            print(f"Found {len(faculty_names)} unique faculties.")
            faculties = [Faculty(name=name) for name in faculty_names]
            db.bulk_save_objects(faculties)
            db.flush()
            print("Faculties saved to database.")

            # Build faculty mapping
            faculty_map = {
                faculty.name: faculty for faculty in db.query(Faculty).all()}
            print("Faculty mapping created.")

            # Process Sections
            print("Processing sections...")
            sections_df = df[['Course', 'Faculty',
                              'Section']].drop_duplicates()
            print(f"Found {sections_df.shape[0]} unique sections.")
            sections = []
            for idx, row in sections_df.iterrows():
                course_code = row['Course']
                faculty_name = row['Faculty']
                section_number = row['Section']
                section = Section(
                    course_code=course_code,
                    faculty_id=faculty_map[faculty_name].id,
                    section_number=section_number
                )
                sections.append(section)
            db.bulk_save_objects(sections)
            db.flush()
            print("Sections saved to database.")

            # Build section mapping
            section_map = {}
            for section in db.query(Section).all():
                key = (section.course_code, section.faculty_id,
                       section.section_number)
                section_map[key] = section
            print("Section mapping created.")

            # Process ClassSessions
            print("Processing class sessions...")
            class_sessions = []
            for idx, row in df.iterrows():
                print(row)
                course_code = row['Course']
                faculty_name = row['Faculty']
                section_number = row['Section']
                day = row['Day']
                start_time = row['Start time']
                end_time = row['End time']
                room = row['Room']

                section_key = (
                    course_code, faculty_map[faculty_name].id, section_number)
                if section_key not in section_map:
                    print(f"Warning: Section {
                          section_key} not found in section_map.")
                    continue
                section = section_map[section_key]

                class_session = ClassSession(
                    section_id=section.id,
                    day=day,
                    start_time=start_time,
                    end_time=end_time,
                    room=room
                )
                class_sessions.append(class_session)
            print(f"Prepared {len(class_sessions)} class sessions.")
            db.bulk_save_objects(class_sessions)
            db.flush()
            print("Class sessions saved to database.")

            # Commit transaction
            db.commit()
        print("Database updated successfully.")
    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))
