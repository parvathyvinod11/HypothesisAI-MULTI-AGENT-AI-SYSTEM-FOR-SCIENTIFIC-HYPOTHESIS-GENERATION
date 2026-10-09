from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    class Config:
        from_attributes = True

class TokenOut(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

# Projects
class ProjectCreate(BaseModel):
    title: str
    research_topic: str
    research_question: str
    research_area: str

class ProjectOut(BaseModel):
    id: int
    title: str
    research_topic: str
    research_question: str
    research_area: str
    status: str
    user_id: Optional[int] = None
    is_owner: Optional[bool] = True
    created_at: datetime
    paper_count: Optional[int] = 0
    hypothesis_count: Optional[int] = 0
    connection_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Papers
class PaperOut(BaseModel):
    id: int
    project_id: int
    title: str
    filename: str
    file_size_bytes: int
    abstract: Optional[str] = None
    key_findings: List[str] = []
    concepts: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

# Connections
class ConnectionOut(BaseModel):
    id: int
    project_id: int
    source_concept: str
    intermediate_concepts: List[str] = []
    target_concept: str
    relationship_type: str
    explanation: str
    significance: Optional[str] = None
    source_papers: List[str] = []

    class Config:
        from_attributes = True

# Hypotheses
class HypothesisOut(BaseModel):
    id: int
    project_id: int
    title: str
    statement: str
    rationale: str
    independent_var: str
    dependent_var: str
    expected_outcome: str
    supporting_evidence: List[str] = []
    supporting_papers: List[str] = []
    novelty_score: Optional[float] = None
    testability_score: Optional[float] = None
    plausibility_score: Optional[float] = None
    falsifiability_score: Optional[float] = None
    overall_score: Optional[float] = None
    critique: Optional[str] = None
    refinement_notes: Optional[str] = None
    refinement_count: int
    is_saved: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Analysis Workflow Progress
class AgentProgress(BaseModel):
    stage: str  # research, connection, hypothesis, critic, completed
    message: str
    progress_percent: int
    details: Optional[Dict[str, Any]] = None

# Graph
class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # paper, concept, finding, research_area
    data: Dict[str, Any]

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str  # RELATES_TO, AFFECTS, SUPPORTS, ASSOCIATED_WITH
    data: Optional[Dict[str, Any]] = None

class KnowledgeGraphData(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

# Research Copilot Chat
class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

class ChatSource(BaseModel):
    paper_id: Optional[int] = None
    paper_title: str
    page: Optional[int] = None
    excerpt: str
    similarity_score: Optional[float] = None

class ChatResponse(BaseModel):
    reply: str
    sources: List[ChatSource] = []

