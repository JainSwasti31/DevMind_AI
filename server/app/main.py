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


# CORS middleware
allowed_origins = [
    'https://dev-mind-ai-sandy.vercel.app',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*'],
)

# Custom CORS for dynamic localhost
@app.middleware("http")
async def custom_cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    
    if origin:
        # Allow any localhost / 127.0.0.1 in development
        if any(origin.startswith(f"http://{host}") for host in ["localhost", "127.0.0.1"]):
            # Process request
            response = await call_next(request)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            return response
        
        # Allow any Vercel preview/production deployment
        if "vercel.app" in origin:
            response = await call_next(request)
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            return response
    
    return await call_next(request)


# Include routes
app.include_router(auth.router)
app.include_router(repo.router)
app.include_router(ai.router)


# Health check
@app.get("/")
async def health_check():
    return {"status": "DevMind AI backend running"}


# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)}
    )


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=True
    )
