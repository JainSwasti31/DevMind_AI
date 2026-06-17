"""
Repository Routes
"""

from fastapi import APIRouter, Depends, File, UploadFile, Form
from app.middleware.auth import get_current_user
from app.schemas.models import RepositoryResponse, GitHubImportRequest
from app.controllers import repo

router = APIRouter(prefix="/api/repos", tags=["repos"])


@router.post("/upload", response_model=RepositoryResponse)
async def upload_repository(
    file: UploadFile = File(...),
    name: str = Form(None),
    user_id: str = Depends(get_current_user)
):
    """Upload a ZIP file or source file."""
    return await repo.upload_repository(user_id, file, name)


@router.post("/import", response_model=RepositoryResponse)
async def import_from_github(
    request: GitHubImportRequest,
    user_id: str = Depends(get_current_user)
):
    """Import a repository from GitHub URL."""
    return await repo.import_from_github(user_id, request)


@router.get("/")
async def list_repositories(user_id: str = Depends(get_current_user)):
    """List all repositories for the current user."""
    repositories = await repo.list_repositories(user_id)
    return {"repositories": repositories}


@router.get("/{repo_id}", response_model=RepositoryResponse)
async def get_repository(
    repo_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get a specific repository."""
    return await repo.get_repository(repo_id, user_id)


@router.delete("/{repo_id}")
async def delete_repository(
    repo_id: str,
    user_id: str = Depends(get_current_user)
):
    """Delete a repository."""
    return await repo.delete_repository(repo_id, user_id)
