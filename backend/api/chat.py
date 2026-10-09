from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.orm_models import Project
from backend.models.schemas import ChatRequest, ChatResponse, ChatSource
from backend.agents.copilot_agent import ResearchCopilotAgent

router = APIRouter(prefix="/api/projects", tags=["copilot-chat"])

@router.post("/{project_id}/chat", response_model=ChatResponse)
def chat_with_copilot(
    project_id: int,
    data: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Conversational Copilot AI Agent:
    Retrieves grounded evidence from uploaded papers via RAG and answers user queries.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not data.message or not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    history_list = [{"role": m.role, "content": m.content} for m in data.history]
    agent = ResearchCopilotAgent(db=db, project_id=project_id)
    result = agent.chat(user_message=data.message.strip(), history=history_list)

    sources_out = [
        ChatSource(
            paper_id=s.get("paper_id"),
            paper_title=s.get("paper_title", "Paper"),
            page=s.get("page"),
            excerpt=s.get("excerpt", ""),
            similarity_score=s.get("similarity_score")
        )
        for s in result.get("sources", [])
    ]

    return ChatResponse(
        reply=result.get("reply", "No response generated."),
        sources=sources_out
    )
