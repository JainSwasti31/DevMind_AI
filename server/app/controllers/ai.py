"""
AI Controller

Handles AI features: chat, explain, README generation, and bug suggestions.
Uses Google Gemini API with streaming responses.
"""

from fastapi import HTTPException, status
import google.generativeai as genai
from datetime import datetime
from app.models import Repository, ChatHistory, Message
from app.schemas.models import ChatRequest, ExplainRequest
from app.services.context_builder import build_context, build_full_context
from app.config import get_settings

settings = get_settings()

# Initialize Gemini client
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

MODEL_PRIMARY = 'gemini-2.5-flash'
MODEL_FALLBACK = 'gemini-2.0-flash'

SYSTEM_BASE = """You are DevMind AI, an expert software engineer assistant.
You answer questions about a user's code repository clearly and precisely.
When showing code, always use fenced code blocks with the language tag.
Be concise but thorough. If you are unsure, say so rather than guessing."""


def get_gen_ai(user_api_key: str = None):
    """Get GenerativeAI client - uses user's key if provided, otherwise server default."""
    if user_api_key and user_api_key.strip():
        genai.configure(api_key=user_api_key.strip())
    return genai


async def get_repo(repo_id: str, user_id: str) -> Repository:
    """Get a repository, checking authorization."""
    repo = Repository.objects(id=repo_id, user_id=user_id).first()
    
    if not repo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found."
        )
    
    return repo


async def chat(
    repo_id: str,
    user_id: str,
    request: ChatRequest,
    user_api_key: str = None
):
    """
    Stream a chat response using Gemini API.
    Yields: {"type": "delta", "content": str} or {"type": "done"} or {"type": "error", "message": str}
    """
    message_text = request.message
    
    if not message_text or not message_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="message is required."
        )
    
    repo = await get_repo(repo_id, user_id)
    
    # Get or create chat history
    history = ChatHistory.objects(user_id=user_id, repository_id=repo_id).first()
    
    if not history:
        history = ChatHistory(
            user_id=user_id,
            repository_id=repo_id,
            messages=[]
        )
        history.save()
    
    # Build context from repository
    code_context = build_context(repo.files, message_text)
    
    system_instruction = f"""{SYSTEM_BASE}

## Repository: {repo.name}
The following source files are the most relevant to the user's question:

{code_context}"""
    
    try:
        # Get recent messages (last 6)
        recent_messages = history.messages[-6:] if history.messages else []
        
        # Build chat history for Gemini
        gemini_history = []
        for msg in recent_messages:
            gemini_history.append({
                "role": "model" if msg.role == "assistant" else "user",
                "parts": [{"text": msg.content}]
            })
        
        # Initialize Gemini model
        client = get_gen_ai(user_api_key)
        model = client.GenerativeModel(
            model_name=MODEL_PRIMARY,
            system_instruction=system_instruction
        )
        
        # Start chat session
        chat_session = model.start_chat(history=gemini_history)
        
        # Stream response
        full_response = ""
        response = chat_session.send_message(
            message_text,
            stream=True,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2048
            )
        )
        
        for chunk in response:
            if chunk.text:
                full_response += chunk.text
                yield f'data: {{"type": "delta", "content": {repr(chunk.text)}}}\n\n'
        
        # Save messages to history
        history.messages.append(Message(role="user", content=message_text))
        history.messages.append(Message(role="assistant", content=full_response))
        
        # Limit chat history to 100 messages
        if len(history.messages) > 100:
            history.messages = history.messages[-100:]
        
        history.updated_at = datetime.utcnow()
        history.save()
        
        yield 'data: {"type": "done"}\n\n'
        
    except Exception as e:
        error_msg = gemini_error_message(e)
        yield f'data: {{"type": "error", "message": {repr(error_msg)}}}\n\n'


def gemini_error_message(err: Exception) -> str:
    """Format an error message from Gemini API."""
    err_str = str(err).lower()
    
    if "429" in err_str or "quota" in err_str:
        return "AI quota exceeded. Please wait a minute and try again."
    if "503" in err_str or "overloaded" in err_str:
        return "Gemini is temporarily overloaded. Please try again in a few seconds."
    if "401" in err_str or "authentication" in err_str:
        return "Invalid API key. Please check your Gemini API key."
    
    return err_str or "AI request failed."


async def explain(
    repo_id: str,
    user_id: str,
    request: ExplainRequest,
    user_api_key: str = None
) -> dict:
    """Explain a specific code snippet."""
    if not request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="code is required."
        )
    
    repo = await get_repo(repo_id, user_id)
    
    # Truncate code to stay within free-tier limits
    MAX_CODE_CHARS = 6000
    code = request.code[:MAX_CODE_CHARS]
    if len(request.code) > MAX_CODE_CHARS:
        code += "\n// ... [truncated]"
    
    # Build prompt
    if request.symbol:
        prompt = f"""Explain the {request.symbol} in the following code from `{request.file_path or 'unknown'}`. 
Include: purpose, parameters/return values, side-effects, and any edge cases."""
    else:
        prompt = """Explain what the following code does. 
Include: purpose, how it works step by step, inputs/outputs, and any notable patterns or concerns."""
    
    full_prompt = f"""{prompt}

File: {request.file_path or 'unknown'}
```
{code}
```"""
    
    try:
        client = get_gen_ai(user_api_key)
        model = client.GenerativeModel(
            model_name=MODEL_PRIMARY,
            system_instruction=SYSTEM_BASE
        )
        
        response = model.generate_content(full_prompt)
        
        return {
            "explanation": response.text
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=gemini_error_message(e)
        )


async def generate_readme(
    repo_id: str,
    user_id: str,
    custom_prompt: str = None,
    user_api_key: str = None
) -> dict:
    """Generate a README for the repository."""
    repo = await get_repo(repo_id, user_id)
    
    # Build full context
    full_context = build_full_context(repo.files)
    
    prompt = custom_prompt or "Generate a comprehensive README.md for this repository."
    
    system_instruction = f"""{SYSTEM_BASE}

## Repository: {repo.name}
Here are the main source files:

{full_context}"""
    
    try:
        client = get_gen_ai(user_api_key)
        model = client.GenerativeModel(
            model_name=MODEL_PRIMARY,
            system_instruction=system_instruction
        )
        
        response = model.generate_content(prompt)
        
        return {
            "readme": response.text
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=gemini_error_message(e)
        )


async def suggest_bugs(
    repo_id: str,
    user_id: str,
    custom_prompt: str = None,
    user_api_key: str = None
) -> dict:
    """Analyze code for bugs and suggest improvements."""
    repo = await get_repo(repo_id, user_id)
    
    # Build full context
    full_context = build_full_context(repo.files)
    
    prompt = custom_prompt or """Review this code repository for:
1. Bugs and potential runtime errors
2. Security vulnerabilities
3. Performance issues
4. Code quality improvements

For each finding, provide severity (critical/high/medium/low) and actionable suggestions."""
    
    system_instruction = f"""{SYSTEM_BASE}

## Repository: {repo.name}
Here are the main source files to review:

{full_context}"""
    
    try:
        client = get_gen_ai(user_api_key)
        model = client.GenerativeModel(
            model_name=MODEL_PRIMARY,
            system_instruction=system_instruction
        )
        
        response = model.generate_content(prompt)
        
        return {
            "suggestions": response.text
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=gemini_error_message(e)
        )


async def get_chat_history(
    repo_id: str,
    user_id: str
) -> dict:
    """Get chat history for a repository."""
    repo = await get_repo(repo_id, user_id)
    
    history = ChatHistory.objects(user_id=user_id, repository_id=repo_id).first()
    
    if not history:
        return {"messages": []}
    
    return {
        "messages": [
            {"role": msg.role, "content": msg.content}
            for msg in history.messages
        ]
    }


async def clear_chat_history(
    repo_id: str,
    user_id: str
) -> dict:
    """Clear chat history for a repository."""
    repo = await get_repo(repo_id, user_id)
    
    history = ChatHistory.objects(user_id=user_id, repository_id=repo_id).first()
    
    if history:
        history.delete()
    
    return {"message": "Chat history cleared."}
