"""
Authentication Routes
"""

from fastapi import APIRouter
from app.schemas.models import UserCreate, UserLogin, TokenResponse, RefreshTokenRequest, LogoutRequest
from app.controllers import auth

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user."""
    return await auth.register(user_data)


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password."""
    return await auth.login(credentials)


@router.post("/refresh")
async def refresh(request: RefreshTokenRequest):
    """Refresh an access token."""
    return await auth.refresh_token(request.token)


@router.post("/logout")
async def logout(request: LogoutRequest):
    """Logout a user."""
    return await auth.logout(request.token)
