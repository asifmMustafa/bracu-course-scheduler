# BracU Course Scheduler

An application to generate all possible conflict-free course schedules for Brac University students.

BracU Course Scheduler streamlines the course advising process by automatically generating all possible schedules without time clashes. Instead of manually checking the [Class Schedule PDF](https://www.bracu.ac.bd/class-schedule-spring-2024) published by BracU or using trial and error on USIS, this tool allows you to select your desired courses and view all feasible schedules instantly.

Tech stack:

- Frontend: React app created with Vite, Tailwind CSS
- Backend: FastAPI
- Database: PostgreSQL (CockroachDB Cloud)
- Containerization: Docker

The client is hosted on Netlify, server docker image is hosted on Render and database on CockroachDB Cloud.

## Installation

Clone the repo:

```bash
git clone https://github.com/asifmMustafa/bracu-course-scheduler.git
cd bracu-course-scheduler
```

Client:

```bash
cd client
touch .env
npm i
```

Add VITE_SERVER_BASE_URL=http://localhost:8000 to client/.env

Server: _(Prerequisite - You need to have Docker running)_

```bash
cd ..
cd server
touch .env
```

Add DATABASE_URL for your postgresql db to server/.env

Build the docker image and start:

```bash
docker-compose up --build
```

You will have to download the pdf from BracU's website and update your database.

Uncomment /client/src/App.jsx line 11 and /server/main.py line 26

Start the client:

```bash
cd ..
cd client
npm run dev
```

Go to http://localhost:5173/update and upload the pdf
