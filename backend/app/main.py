import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from backend.app.database.connection import engine, Base
from backend.app.models.entities import Experiment, PromptResult, Evaluation, WorkflowLog
from backend.app.routes.api import router as api_router

# Ensure tables exist upon application load
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Prompt Performance Comparison System API",
    description="Backend API for empirical comparison of Basic, Structured, and Example-Based prompting techniques.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Serve frontend build in production if available
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

dist_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if (dist_dir / "index.html").exists():
    if (dist_dir / "assets").exists():
        app.mount("/assets", StaticFiles(directory=dist_dir / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        if full_path.startswith("api") or full_path in ("docs", "redoc", "openapi.json"):
            return None
        file_path = dist_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(dist_dir / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "title": "Prompt Performance Comparison System API",
            "status": "online",
            "documentation": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)
