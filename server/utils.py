from fastapi import HTTPException
from sqlalchemy.orm import Session
from models import ClassSession, Section, Faculty, Course
import pandas as pd
from datetime import datetime


def is_time_conflict(session1, session2):
    if session1['day'] != session2['day']:
        return False
    fmt = '%I:%M %p'
    start1 = datetime.strptime(session1['start_time'], fmt)
    end1 = datetime.strptime(session1['end_time'], fmt)
    start2 = datetime.strptime(session2['start_time'], fmt)
    end2 = datetime.strptime(session2['end_time'], fmt)

    latest_start = max(start1, start2)
    earliest_end = min(end1, end2)
    delta = (earliest_end - latest_start).total_seconds()
    return delta > 0  # Returns True if there is an overlap


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
