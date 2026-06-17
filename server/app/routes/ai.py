"""
AI Routes
"""

from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from app.middleware.auth import get_current_user
from app.schemas.models import (
    ChatRequest,
    ExplainRequest,
    GenerateReadmeRequest,
    BugSuggestRequest,
    ChatHistoryResponse
)
from app.controllers import ai

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/{repo_id}/chat")
async def chat(
    repo_id: str,
    request: ChatRequest,
    user_id: str = Depends(get_current_user),
    x_user_api_key: str = Header(None)
):
    """Chat with the codebase — streaming SSE response."""
    async def event_generator():
        async for event in ai.chat(repo_id, user_id, request, x_user_api_key):
            yield event
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/{repo_id}/explain")
async def explain(
    repo_id: str,
    request: ExplainRequest,
    user_id: str = Depends(get_current_user),
    x_user_api_key: str = Header(None)
):
    """Explain a specific code snippet."""
    return await ai.explain(repo_id, user_id, request, x_user_api_key)


@router.post("/{repo_id}/readme")
async def generate_readme(
    repo_id: str,
    request: GenerateReadmeRequest,
    user_id: str = Depends(get_current_user),
    x_user_api_key: str = Header(None)
):
    """Generate a README for the repository."""
    return await ai.generate_readme(
        repo_id,
        user_id,
        request.custom_prompt,
        x_user_api_key
    )


@router.post("/{repo_id}/bugs")
async def suggest_bugs(
    repo_id: str,
    request: BugSuggestRequest,
    user_id: str = Depends(get_current_user),
    x_user_api_key: str = Header(None)
):
    """Analyze code for bugs and suggest improvements."""
    return await ai.suggest_bugs(
        repo_id,
        user_id,
        request.custom_prompt,
        x_user_api_key
    )


@router.get("/{repo_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    repo_id: str,
    user_id: str = Depends(get_current_user)
):
    """Get chat history for a repository."""
    return await ai.get_chat_history(repo_id, user_id)


@router.delete("/{repo_id}/history")
async def clear_chat_history(
    repo_id: str,
    user_id: str = Depends(get_current_user)
):
    """Clear chat history for a repository."""
    return await ai.clear_chat_history(repo_id, user_id)
