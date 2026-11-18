# SkillGraph AI — Skill Gap Analyzer & Career Roadmap

A full-stack career-readiness tool. Select a target role, rate your skills from 1–5, and receive a readiness score, prioritized skill gaps, and a phased learning roadmap.


## Features
- 6 built-in career role profiles (AI Engineer, Data Analyst, Full Stack Developer, Data Scientist, Cybersecurity Analyst, Cloud Engineer)
- Skills gap analysis and readiness score
- Prioritized gaps with estimated learning hours
- Roadmap grouped into phases
- Download a PDF report
- Responsive React dashboard with radar chart
- No external AI API key required (transparent, deterministic recommendations)

## Run locally
### Backend (Terminal 1)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
API: http://127.0.0.1:8000/docs

### Frontend (Terminal 2)
```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```
Open the local URL Vite prints (usually http://localhost:5173).

## Usage
1. Choose a target role and experience level.
2. Add/rate your skills (1 = beginner, 5 = advanced); skills can be added manually.
3. Click **Analyze my skill gaps**.
4. Review the score, chart, prioritized gaps, and roadmap; download the PDF report.

## Disclaimer
This is a learning-planning tool, not a hiring predictor. Role profiles and estimated hours are illustrative and should be reviewed against real job descriptions.
