from typing import Dict, List
from io import BytesIO
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="SkillGraph AI", description="Career skill-gap analysis and learning-roadmap API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

ROLE_SKILLS: Dict[str, Dict[str, int]] = {
    "AI Engineer": {"Python": 5, "Machine Learning": 4, "Deep Learning": 4, "SQL": 3, "Statistics": 4, "Git": 3, "Data Structures": 3, "APIs": 3},
    "Data Analyst": {"SQL": 5, "Excel": 4, "Python": 3, "Statistics": 4, "Data Visualization": 4, "Business Communication": 3, "Git": 2},
    "Full Stack Developer": {"HTML/CSS": 4, "JavaScript": 5, "React": 4, "Backend APIs": 4, "SQL": 3, "Git": 3, "Testing": 3},
    "Data Scientist": {"Python": 5, "Statistics": 5, "Machine Learning": 4, "SQL": 4, "Data Visualization": 3, "Experiment Design": 3, "Git": 2},
    "Cybersecurity Analyst": {"Networking": 4, "Linux": 4, "Security Fundamentals": 5, "Python": 3, "SIEM Tools": 3, "Incident Response": 4, "Risk Assessment": 3},
    "Cloud Engineer": {"Linux": 4, "Networking": 4, "Cloud Fundamentals": 5, "Docker": 4, "CI/CD": 3, "Infrastructure as Code": 3, "Python": 3},
}
HOURS_PER_LEVEL = {"Python": 18, "Machine Learning": 28, "Deep Learning": 30, "SQL": 16, "Statistics": 22, "Git": 8, "Data Structures": 22, "APIs": 14, "Excel": 12, "Data Visualization": 18, "Business Communication": 10, "HTML/CSS": 14, "JavaScript": 26, "React": 22, "Backend APIs": 22, "Testing": 16, "Experiment Design": 14, "Networking": 22, "Linux": 18, "Security Fundamentals": 24, "SIEM Tools": 20, "Incident Response": 20, "Risk Assessment": 16, "Cloud Fundamentals": 22, "Docker": 18, "CI/CD": 18, "Infrastructure as Code": 20}

class AnalyzeRequest(BaseModel):
    role: str
    experience: str = "Beginner"
    skills: Dict[str, int] = Field(default_factory=dict)

class SkillItem(BaseModel):
    name: str
    level: int = Field(ge=1, le=5)

class AnalyzeResponse(BaseModel):
    role: str
    readiness: int
    total_skills: int
    ready_skills: int
    gaps: List[dict]
    roadmap: List[dict]
    chart: List[dict]
    total_hours: int

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SkillGraph AI"}

@app.get("/api/roles")
def roles():
    return {"roles": list(ROLE_SKILLS.keys()), "role_skills": ROLE_SKILLS}

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    if payload.role not in ROLE_SKILLS:
        raise HTTPException(status_code=400, detail="Please choose a supported career role.")
    target = ROLE_SKILLS[payload.role]
    rows, gaps, chart = [], [], []
    earned = possible = ready_count = total_hours = 0
    for name, required in target.items():
        current = max(0, min(5, int(payload.skills.get(name, 0))))
        possible += required
        earned += min(current, required)
        if current >= required:
            ready_count += 1
        deficit = max(0, required - current)
        hours = deficit * HOURS_PER_LEVEL.get(name, 16)
        chart.append({"skill": name, "current": current, "required": required})
        if deficit:
            gaps.append({"skill": name, "current": current, "required": required, "gap": deficit, "hours": hours, "priority": "High" if deficit >= 3 else "Medium" if deficit == 2 else "Low"})
    gaps.sort(key=lambda item: (-item["gap"], -item["hours"], item["skill"]))
    total_hours = sum(item["hours"] for item in gaps)
    roadmap = []
    for idx, gap in enumerate(gaps):
        phase = "Phase 1 — Foundations" if idx < 2 else "Phase 2 — Core Skills" if idx < 4 else "Phase 3 — Practice & Projects"
        if not roadmap or roadmap[-1]["phase"] != phase:
            roadmap.append({"phase": phase, "items": []})
        roadmap[-1]["items"].append({"skill": gap["skill"], "hours": gap["hours"], "priority": gap["priority"], "suggestion": f"Study {gap['skill']} fundamentals, practice with guided exercises, then build a small project."})
    readiness = round((earned / possible) * 100) if possible else 0
    return AnalyzeResponse(role=payload.role, readiness=readiness, total_skills=len(target), ready_skills=ready_count, gaps=gaps, roadmap=roadmap, chart=chart, total_hours=total_hours)


@app.post("/api/report/pdf")
def report_pdf(payload: AnalyzeRequest):
    # Run same analysis to keep report consistent with dashboard.
    result = analyze(payload)
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
    except ImportError:
        raise HTTPException(status_code=500, detail="PDF module missing. Install backend requirements.")
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 54
    pdf.setTitle("SkillGraph AI Career Readiness Report")
    pdf.setFont("Helvetica-Bold", 18); pdf.drawString(48, y, "SkillGraph AI — Career Readiness Report"); y -= 32
    pdf.setFont("Helvetica", 11); pdf.drawString(48, y, f"Target role: {result.role}"); y -= 18
    pdf.drawString(48, y, f"Readiness score: {result.readiness}%  |  Skills ready: {result.ready_skills}/{result.total_skills}"); y -= 18
    pdf.drawString(48, y, f"Estimated learning effort: {result.total_hours} hours"); y -= 28
    pdf.setFont("Helvetica-Bold", 13); pdf.drawString(48, y, "Prioritized skill gaps"); y -= 20
    pdf.setFont("Helvetica", 10)
    for item in result.gaps:
        line = f"{item['skill']}: current {item['current']}/5, target {item['required']}/5, gap {item['gap']} ({item['priority']}, approx. {item['hours']} hrs)"
        if y < 70: pdf.showPage(); y = height - 50
        pdf.drawString(48, y, line[:110]); y -= 16
    if result.roadmap:
        y -= 12; pdf.setFont("Helvetica-Bold", 13); pdf.drawString(48, y, "Suggested roadmap"); y -= 20; pdf.setFont("Helvetica", 10)
        for phase in result.roadmap:
            if y < 80: pdf.showPage(); y = height - 50
            pdf.setFont("Helvetica-Bold", 11); pdf.drawString(48, y, phase["phase"]); y -= 16; pdf.setFont("Helvetica", 10)
            for item in phase["items"]:
                if y < 60: pdf.showPage(); y = height - 50
                pdf.drawString(60, y, f"- {item['skill']} ({item['hours']} hrs)"); y -= 14
    pdf.save(); buffer.seek(0)
    from fastapi.responses import StreamingResponse
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=skillgraph-career-report.pdf"})
