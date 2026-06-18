"""
Repository Controller

Handles repository upload, listing, deletion, and GitHub import.
"""

from fastapi import HTTPException, status, UploadFile
from app.models import Repository, ChatHistory
from app.schemas.models import RepositoryResponse, RepositoryListResponse, GitHubImportRequest
from app.services.repo_parser import parse_upload
from app.services.github_fetcher import fetch_github_repo, parse_github_url
from datetime import datetime


async def upload_repository(user_id: str, file: UploadFile, repo_name: str = None) -> RepositoryResponse:
    """Upload and parse a repository (ZIP or single file)."""
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a ZIP archive or source file."
        )

    try:
        files = await parse_upload(file)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No supported source files were found in the upload."
        )

    MAX_FILES = 300
    files = files[:MAX_FILES]

    if not repo_name:
        repo_name = file.filename or "repository"
    repo_name = repo_name.replace('.zip', '')

    repository = Repository(
        name=repo_name,
        user_id=user_id,
        files=files,
        repo_meta={}
    )

    try:
        repository.save()
        return RepositoryResponse(
            id=repository.id,
            name=repository.name,
            description=repository.description,
            files=repository.files,
            meta=repository.repo_meta,
            created_at=repository.created_at,
            updated_at=repository.updated_at
        )
    except Exception as e:
        if "too large" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Repository is too large to store. Try uploading a smaller subset of files."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save repository."
        )


async def list_repositories(user_id: str) -> list:
    """List all repositories for a user."""
    repos = Repository.objects(user_id=user_id).order_by('-created_at')

    result = []
    for repo in repos:
        result.append(RepositoryListResponse(
            id=repo.id,
            name=repo.name,
            created_at=repo.created_at,
            updated_at=repo.updated_at,
            file_count=len(repo.files) if repo.files else 0
        ))

    return result


async def get_repository(repo_id: str, user_id: str) -> RepositoryResponse:
    """Get a specific repository."""
    repository = Repository.objects(id=repo_id, user_id=user_id).first()

    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found."
        )

    return RepositoryResponse(
        id=repository.id,
        name=repository.name,
        description=repository.description,
        files=repository.files,
        meta=repository.repo_meta,
        created_at=repository.created_at,
        updated_at=repository.updated_at
    )


async def delete_repository(repo_id: str, user_id: str) -> dict:
    """Delete a repository and its chat history."""
    repository = Repository.objects(id=repo_id, user_id=user_id).first()

    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found."
        )

    ChatHistory.objects(user_id=user_id, repository_id=repo_id).delete()
    repository.delete()

    return {"message": "Repository deleted."}


async def import_from_github(
    user_id: str,
    request: GitHubImportRequest
) -> RepositoryResponse:
    """Import a repository from GitHub."""
    github_url = request.github_url

    if not github_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="github_url is required."
        )

    parsed = parse_github_url(github_url)
    if not parsed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub URL. Expected https://github.com/owner/repo"
        )

    # Check for duplicate using repo_meta field
    repo_url = f"https://github.com/{parsed['owner']}/{parsed['repo']}"
    existing = Repository.objects(user_id=user_id, repo_meta__url=repo_url).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f'You have already imported "{existing.name}". Delete it first to re-import.'
        )

    try:
        result = await fetch_github_repo(github_url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

    if not result.get('files'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No supported source files were found in this repository."
        )

    repository = Repository(
        name=result['repoName'],
        user_id=user_id,
        description=result['meta'].get('description'),
        files=result['files'],
        repo_meta=result['meta']
    )

    try:
        repository.save()
        return RepositoryResponse(
            id=repository.id,
            name=repository.name,
            description=repository.description,
            files=repository.files,
            meta=repository.repo_meta,
            created_at=repository.created_at,
            updated_at=repository.updated_at
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save repository."
        )
