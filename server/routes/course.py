from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import Course, Section, Faculty
from database import get_db

course_router = APIRouter(
    prefix="/api/courses",
    tags=["courses"]
)


@course_router.get("/")
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    return [{"code": course.code} for course in courses]


@course_router.get("/{course_code}/faculties")
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
