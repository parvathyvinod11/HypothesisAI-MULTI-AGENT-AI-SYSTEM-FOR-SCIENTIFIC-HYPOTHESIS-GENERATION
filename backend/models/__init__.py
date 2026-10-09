from backend.models.database import Base, engine, SessionLocal, get_db
from backend.models.orm_models import User, Project, Paper, Connection, Hypothesis

# Ensure tables exist
Base.metadata.create_all(bind=engine)
