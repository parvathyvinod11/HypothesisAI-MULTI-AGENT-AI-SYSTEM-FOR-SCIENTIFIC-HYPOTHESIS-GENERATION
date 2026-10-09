import shutil
from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from backend.config import UPLOADS_DIR
from backend.models.database import get_db
from backend.models.orm_models import Project, Paper
from backend.models.schemas import PaperOut
from backend.rag.pdf_parser import PDFParser

router = APIRouter(prefix="/api/projects/{project_id}/papers", tags=["papers"])

@router.get("", response_model=List[PaperOut])
def list_papers(project_id: int, db: Session = Depends(get_db)):
    papers = db.query(Paper).filter(Paper.project_id == project_id).all()
    return papers

@router.post("/upload", response_model=List[PaperOut])
async def upload_papers(
    project_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    saved_papers = []
    project_upload_dir = UPLOADS_DIR / str(project_id)
    project_upload_dir.mkdir(parents=True, exist_ok=True)

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            continue

        file_dest = project_upload_dir / file.filename
        with open(file_dest, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Quick metadata parse
        abstract = ""
        try:
            meta = PDFParser.extract_text_and_metadata(str(file_dest))
            abstract = meta.get("abstract", "")
        except Exception:
            pass

        paper = Paper(
            project_id=project_id,
            title=Path(file.filename).stem.replace("_", " ").title(),
            filename=file.filename,
            file_path=str(file_dest.resolve()),
            file_size_bytes=file_dest.stat().st_size,
            abstract=abstract
        )
        db.add(paper)
        saved_papers.append(paper)

    db.commit()
    for p in saved_papers:
        db.refresh(p)

    return saved_papers
