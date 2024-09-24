from typing import List, Dict
from pydantic import BaseModel


class ScheduleRequest(BaseModel):
    courses: List[str]
    preferences: Dict[str, str]  # course_code: preferred_faculty_name
    unavailable_days: List[str]
