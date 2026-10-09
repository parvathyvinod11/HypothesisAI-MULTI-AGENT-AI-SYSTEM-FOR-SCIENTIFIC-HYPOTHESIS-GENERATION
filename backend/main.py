from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings, UPLOADS_DIR
from backend.models.database import engine, Base
from backend.api import auth, projects, papers, analysis, graph, hypotheses, chat

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Scientific Hypothesis Generator",
    description="Multi-agent AI platform analyzing scientific papers and discovering novel testable hypotheses",
    version="1.0.0"
)

# CORS setup for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(papers.router)
app.include_router(analysis.router)
app.include_router(graph.router)
app.include_router(hypotheses.router)
app.include_router(chat.router)

# Mount uploads directory for PDF previews
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Scientific Hypothesis Generator Backend",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
