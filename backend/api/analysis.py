from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.orm_models import Project, Connection, Hypothesis
from backend.models.schemas import ConnectionOut, HypothesisOut
from backend.agents.pipeline import ResearchPipeline

router = APIRouter(prefix="/api/projects/{project_id}/analysis", tags=["analysis"])

def run_background_pipeline(project_id: int):
    from backend.models.database import SessionLocal
    db = SessionLocal()
    try:
        pipeline = ResearchPipeline(db, project_id)
        pipeline.run()
    finally:
        db.close()

@router.post("/start")
def start_analysis(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.papers:
        raise HTTPException(status_code=400, detail="Please upload research papers before running analysis.")

    # Run synchronously or async
    pipeline = ResearchPipeline(db, project_id)
    result = pipeline.run()
    return {"message": "Analysis completed successfully", "result": result}

@router.get("/status")
def get_analysis_status(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return {
        "status": project.status,
        "paper_count": len(project.papers),
        "connection_count": len(project.connections),
        "hypothesis_count": len(project.hypotheses)
    }

@router.get("/connections", response_model=List[ConnectionOut])
def get_discovered_connections(project_id: int, db: Session = Depends(get_db)):
    connections = db.query(Connection).filter(Connection.project_id == project_id).all()
    return connections
