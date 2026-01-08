from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from database import init_db
from routers import documents_router, workflows_router, chat_router
from config import settings

# Create upload and chroma directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)

app = FastAPI(
    title="GenAI Stack API",
    description="No-Code/Low-Code Workflow Builder Backend",
    version="1.0.0"
)

# CORS middleware - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when using wildcard origins
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(documents_router)
app.include_router(workflows_router)
app.include_router(chat_router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()


@app.get("/")
async def root():
    return {
        "message": "GenAI Stack API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
