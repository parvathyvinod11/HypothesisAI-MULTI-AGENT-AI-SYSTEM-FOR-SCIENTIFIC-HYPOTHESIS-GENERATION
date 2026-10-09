import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from backend.models.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    research_topic = Column(String(255), nullable=False)
    research_question = Column(Text, nullable=False)
    research_area = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="draft")  # draft, analyzing, completed, failed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="projects")
    papers = relationship("Paper", back_populates="project", cascade="all, delete-orphan")
    hypotheses = relationship("Hypothesis", back_populates="project", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="project", cascade="all, delete-orphan")
    graph_data = Column(JSON, nullable=True)  # cached React Flow nodes/edges


class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    abstract = Column(Text, nullable=True)
    key_findings = Column(JSON, default=list)  # list of extracted key findings
    concepts = Column(JSON, default=list)      # list of extracted scientific concepts
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="papers")


class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    source_concept = Column(String(255), nullable=False)
    intermediate_concepts = Column(JSON, default=list)  # multi-hop paths
    target_concept = Column(String(255), nullable=False)
    relationship_type = Column(String(100), default="RELATES_TO")
    explanation = Column(Text, nullable=False)
    significance = Column(String(255), nullable=True)
    source_papers = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="connections")


class Hypothesis(Base):
    __tablename__ = "hypotheses"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    title = Column(String(255), nullable=False)
    statement = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    independent_var = Column(String(255), nullable=False)
    dependent_var = Column(String(255), nullable=False)
    expected_outcome = Column(Text, nullable=False)
    supporting_evidence = Column(JSON, default=list)
    supporting_papers = Column(JSON, default=list)

    # Critic evaluation scores (0-100) - None when evaluation is unavailable
    novelty_score = Column(Float, nullable=True, default=None)
    testability_score = Column(Float, nullable=True, default=None)
    plausibility_score = Column(Float, nullable=True, default=None)
    falsifiability_score = Column(Float, nullable=True, default=None)
    overall_score = Column(Float, nullable=True, default=None)
    critique = Column(Text, nullable=True)
    refinement_notes = Column(Text, nullable=True)
    refinement_count = Column(Integer, default=0)

    is_saved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    project = relationship("Project", back_populates="hypotheses")
