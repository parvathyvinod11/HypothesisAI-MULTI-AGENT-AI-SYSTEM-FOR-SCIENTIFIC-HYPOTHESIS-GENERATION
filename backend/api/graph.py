from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.orm_models import Project
from backend.models.schemas import KnowledgeGraphData

router = APIRouter(prefix="/api/projects/{project_id}/graph", tags=["graph"])

@router.get("", response_model=KnowledgeGraphData)
def get_project_graph(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.graph_data:
        # Return empty graph with at least the research area
        return {
            "nodes": [
                {
                    "id": "area_root",
                    "type": "custom",
                    "position": {"x": 400, "y": 300},
                    "data": {
                        "label": project.research_area or "Research Topic",
                        "category": "Research Area",
                        "nodeType": "research_area",
                        "bgColor": "#fef3c7",
                        "borderColor": "#f59e0b",
                        "textColor": "#78350f"
                    }
                }
            ],
            "edges": []
        }

    return project.graph_data
