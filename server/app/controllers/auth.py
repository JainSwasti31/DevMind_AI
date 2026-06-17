"""
Authentication Controller

Handles user registration, login, token refresh, and logout.
"""

from fastapi import HTTPException, status
from app.models import User
from app.schemas.models import UserCreate, UserLogin, TokenResponse, UserResponse
from app.middleware.auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token
)
from app.config import get_settings

settings = get_settings()


async def register(user_data: UserCreate) -> TokenResponse:
    """Register a new user."""
    # Check if email already exists
    existing_user = User.objects(email=user_data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already in use."
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        name=user_data.name,
        email=user_data.email.lower(),
        password=hashed_password
    )
    
    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    user.refresh_token = refresh_token
    user.save()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(id=user.id, name=user.name, email=user.email)
    )


async def login(credentials: UserLogin) -> TokenResponse:
    """Login an existing user."""
    # Find user by email
    user = User.objects(email=credentials.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials."
        )
    
    # Generate new tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    user.refresh_token = refresh_token
    user.save()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(id=user.id, name=user.name, email=user.email)
    )


async def refresh_token(token: str) -> dict:
    """Refresh an access token using a refresh token."""
    # Verify refresh token
    try:
        payload = verify_token(token, settings.JWT_REFRESH_SECRET)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token."
        )
    
    user_id = payload.get("userId")
    user = User.objects(id=user_id).first()
    
    if not user or user.refresh_token != token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token."
        )
    
    # Generate new tokens
    access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id)
    
    user.refresh_token = new_refresh_token
    user.save()
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token
    }


async def logout(token: str) -> dict:
    """Logout a user by clearing their refresh token."""
    if token:
        try:
            payload = verify_token(token, settings.JWT_REFRESH_SECRET)
            user_id = payload.get("userId")
            user = User.objects(id=user_id).first()
            if user:
                user.refresh_token = None
                user.save()
        except:
            # Token already invalid — that's fine
            pass
    
    return {"message": "Logged out."}
