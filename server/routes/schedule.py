from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from itertools import product
from models import Section, ClassSession, Faculty
from database import get_db
from schemas import ScheduleRequest
from utils import is_time_conflict

schedule_router = APIRouter(
    prefix="/api/schedules",
    tags=["schedules"]
)


@schedule_router.post("/")
def get_schedules(request: ScheduleRequest, db: Session = Depends(get_db)):
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
