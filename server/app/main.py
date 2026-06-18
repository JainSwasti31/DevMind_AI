"""
DevMind AI - Main FastAPI Application
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from app.config import get_settings
from app.database import init_db, close_db
from app.routes import auth, repo, ai

# Configuration
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="DevMind AI",
    description="AI-powered code intelligence platform",
    version="1.0.0"
)


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    init_db()


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    close_db()


# CORS — allow Vercel frontend and all localhost origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'https://dev-mind-ai-sandy.vercel.app',
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4173',
    ],
    allow_origin_regex=r'https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+',
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*'],
)


# Include routes
app.include_router(auth.router)
app.include_router(repo.router)
app.include_router(ai.router)


# Health check
@app.get("/")
async def health_check():
    return {"status": "DevMind AI backend running"}


# Global error handler — include CORS header so browser can read the error
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin", "")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)},
        headers=headers,
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True
    )
