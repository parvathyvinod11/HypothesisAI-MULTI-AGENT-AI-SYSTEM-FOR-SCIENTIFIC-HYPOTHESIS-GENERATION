from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.config import UPLOADS_DIR
from backend.models.database import get_db
from backend.models.orm_models import Project, Paper, User, Hypothesis, Connection
from backend.models.schemas import ProjectCreate, ProjectOut
from backend.api.auth import get_current_user_optional
from backend.demo_data.generate_demo_pdfs import generate_sample_research_pdfs
from backend.agents.pipeline import ResearchPipeline

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("", response_model=List[ProjectOut])
def get_projects(
    scope: Optional[str] = None,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    if user:
        if scope == "demo":
            projects = db.query(Project).filter(Project.user_id == None).order_by(Project.created_at.desc()).all()
        elif scope == "all":
            projects = db.query(Project).filter(
                (Project.user_id == user.id) | (Project.user_id == None)
            ).order_by(Project.created_at.desc()).all()
        else:
            # Default for logged in user: strictly reflect user's own workspace projects
            projects = db.query(Project).filter(Project.user_id == user.id).order_by(Project.created_at.desc()).all()
    else:
        # Unauthenticated guest: show public / unassigned demo projects
        projects = db.query(Project).filter(Project.user_id == None).order_by(Project.created_at.desc()).all()

    results = []
    for p in projects:
        results.append(ProjectOut(
            id=p.id,
            title=p.title,
            research_topic=p.research_topic,
            research_question=p.research_question,
            research_area=p.research_area,
            status=p.status,
            user_id=p.user_id,
            is_owner=(user is not None and p.user_id == user.id) or (user is None and p.user_id is None),
            created_at=p.created_at,
            paper_count=len(p.papers),
            hypothesis_count=len(p.hypotheses),
            connection_count=len(p.connections)
        ))
    return results

@router.post("", response_model=ProjectOut)
def create_project(data: ProjectCreate, user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    project = Project(
        title=data.title,
        research_topic=data.research_topic,
        research_question=data.research_question,
        research_area=data.research_area,
        user_id=user.id if user else None,
        status="draft"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return ProjectOut(
        id=project.id,
        title=project.title,
        research_topic=project.research_topic,
        research_question=project.research_question,
        research_area=project.research_area,
        status=project.status,
        user_id=project.user_id,
        is_owner=True,
        created_at=project.created_at,
        paper_count=0,
        hypothesis_count=0,
        connection_count=0
    )

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    return ProjectOut(
        id=p.id,
        title=p.title,
        research_topic=p.research_topic,
        research_question=p.research_question,
        research_area=p.research_area,
        status=p.status,
        user_id=p.user_id,
        is_owner=(user is not None and p.user_id == user.id) or (user is None and p.user_id is None),
        created_at=p.created_at,
        paper_count=len(p.papers),
        hypothesis_count=len(p.hypotheses),
        connection_count=len(p.connections)
    )

@router.delete("/{project_id}")
def delete_project(project_id: int, user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Ownership verification
    if p.user_id is not None and user is not None and p.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this project")

    db.delete(p)
    db.commit()
    return {"message": "Project deleted"}

@router.post("/demo/init", response_model=ProjectOut)
def initialize_demo_project(user: Optional[User] = Depends(get_current_user_optional), db: Session = Depends(get_db)):
    """
    1-Click Instant Demo Creator:
    Generates sample PDFs, creates project for the active user (or public if guest), ingests papers, and executes the 4-agent pipeline.
    """
    target_user_id = user.id if user else None

    # Check if demo project already exists for this specific user
    demo_proj = db.query(Project).filter(
        Project.title == "Circadian Screen Exposure & Cognitive Dynamics",
        Project.user_id == target_user_id
    ).first()
    if demo_proj and demo_proj.status == "completed":
        return ProjectOut(
            id=demo_proj.id,
            title=demo_proj.title,
            research_topic=demo_proj.research_topic,
            research_question=demo_proj.research_question,
            research_area=demo_proj.research_area,
            status=demo_proj.status,
            user_id=demo_proj.user_id,
            is_owner=True,
            created_at=demo_proj.created_at,
            paper_count=len(demo_proj.papers),
            hypothesis_count=len(demo_proj.hypotheses),
            connection_count=len(demo_proj.connections)
        )

    # Generate sample PDFs
    demo_pdf_dir = UPLOADS_DIR / "demo"
    pdf_paths = generate_sample_research_pdfs(demo_pdf_dir)

    project = Project(
        title="Circadian Screen Exposure & Cognitive Dynamics",
        research_topic="Impact of Digital Screen Exposure on Sleep Quality and Next-Day Cognitive Performance",
        research_question="How does nocturnal blue-light exposure alter slow-wave sleep architecture, and what mechanistic pathway explains the subsequent degradation in prefrontal working memory?",
        research_area="Neurobiology & Cognitive Science",
        user_id=target_user_id,
        status="draft"
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Attach papers
    for p_path in pdf_paths:
        paper = Paper(
            project_id=project.id,
            title=p_path.stem.replace("_", " "),
            filename=p_path.name,
            file_path=str(p_path.resolve()),
            file_size_bytes=p_path.stat().st_size
        )
        db.add(paper)
    db.commit()

    # Run the full 4-agent pipeline
    pipeline = ResearchPipeline(db, project.id)
    pipeline.run()

    db.refresh(project)
    return ProjectOut(
        id=project.id,
        title=project.title,
        research_topic=project.research_topic,
        research_question=project.research_question,
        research_area=project.research_area,
        status=project.status,
        user_id=project.user_id,
        is_owner=True,
        created_at=project.created_at,
        paper_count=len(project.papers),
        hypothesis_count=len(project.hypotheses),
        connection_count=len(project.connections)
    )
