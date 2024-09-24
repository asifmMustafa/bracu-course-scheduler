from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Course(Base):
    __tablename__ = "courses"

    code = Column(String, primary_key=True)

    sections = relationship("Section", back_populates="course")


class Faculty(Base):
    __tablename__ = "faculties"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True)

    sections = relationship("Section", back_populates="faculty")


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, autoincrement=True)
    course_code = Column(String, ForeignKey("courses.code"))
    faculty_id = Column(Integer, ForeignKey("faculties.id"))
    section_number = Column(String)

    course = relationship("Course", back_populates="sections")
    faculty = relationship("Faculty", back_populates="sections")
    class_sessions = relationship("ClassSession", back_populates="section")


class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("sections.id"))
    day = Column(String)
    start_time = Column(String)  # For simplicity, storing time as string
    end_time = Column(String)
    room = Column(String)

    section = relationship("Section", back_populates="class_sessions")
