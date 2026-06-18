from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import encode, decode, InvalidTokenError
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from app.config import get_settings

settings = get_settings()

# Password hashing — truncate_error=False silences the bcrypt 72-byte limit warning
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

# Security scheme
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt. Truncates to 72 bytes (bcrypt limit)."""
    return pwd_context.hash(password[:72])


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash. Truncates to 72 bytes to match hashing."""
    return pwd_context.verify(plain_password[:72], hashed_password)


def create_token(user_id: str, secret: str, expires_in_minutes: int) -> str:
    """Create a JWT token."""
    payload = {
        "userId": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes),
        "iat": datetime.now(timezone.utc)
    }
    return encode(payload, secret, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: str) -> str:
    """Create an access token."""
    return create_token(user_id, settings.JWT_SECRET, settings.ACCESS_TOKEN_EXPIRE_MINUTES)


def create_refresh_token(user_id: str) -> str:
    """Create a refresh token."""
    return create_token(user_id, settings.JWT_REFRESH_SECRET, settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60)


def verify_token(token: str, secret: str) -> dict:
    """Verify and decode a JWT token."""
    try:
        payload = decode(token, secret, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token."
        )


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Get the current user from the authorization header."""
    token = credentials.credentials
    payload = verify_token(token, settings.JWT_SECRET)
    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization required."
        )
    return user_id
