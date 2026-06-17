from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── User Schemas ────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    token: str


class LogoutRequest(BaseModel):
    token: Optional[str] = None


# ─── File Schemas ───────────────────────────────────────────────────────────

class FileResponse(BaseModel):
    path: str
    language: str
    lineCount: int
    size: int
    content: str


# ─── Repository Schemas ──────────────────────────────────────────────────────

class RepositoryMetadata(BaseModel):
    owner: Optional[str] = None
    repo: Optional[str] = None
    branch: Optional[str] = None
    stars: Optional[int] = None
    description: Optional[str] = None
    language: Optional[str] = None
    url: Optional[str] = None


class RepositoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    files: List[Dict[str, Any]] = []
    meta: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RepositoryListResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    file_count: Optional[int] = None

    class Config:
        from_attributes = True


class GitHubImportRequest(BaseModel):
    github_url: str


# ─── Message Schemas ────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    role: str
    content: str


class ChatHistoryResponse(BaseModel):
    id: str
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


# ─── AI Request Schemas ─────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str


class ExplainRequest(BaseModel):
    code: str
    file_path: Optional[str] = None
    symbol: Optional[str] = None


class GenerateReadmeRequest(BaseModel):
    custom_prompt: Optional[str] = None


class BugSuggestRequest(BaseModel):
    custom_prompt: Optional[str] = None


# ─── Error Response ────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str
    message: str
