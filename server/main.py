from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import Base
from database import engine

from routes import course_router, schedule_router, update_database_router

app = FastAPI()

Base.metadata.create_all(bind=engine)

origins = [
    "https://bracu-course-schedule.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(course_router)
app.include_router(schedule_router)
# app.include_router(update_database_router)
