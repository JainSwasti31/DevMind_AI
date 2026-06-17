"""
Context Builder Service

Responsible for selecting the most relevant file chunks from a repository
to fit within a token budget before sending to the AI.
"""

import re
from typing import List, Dict, Any

# Configuration
CHUNK_LINES = 60
CHAT_TOKEN_BUDGET = 2000      # for per-query chat context
FULL_TOKEN_BUDGET = 3000      # for README / bug scan (whole repo)
AVG_CHARS_PER_TOKEN = 4


def chunk_file(file: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Split a file's content into line-bounded chunks.
    Each chunk carries its file path and start line for reference.
    """
    lines = file['content'].split('\n')
    chunks = []
    
    for i in range(0, len(lines), CHUNK_LINES):
        chunk_lines = lines[i:i + CHUNK_LINES]
        chunks.append({
            'path': file['path'],
            'language': file['language'],
            'startLine': i + 1,
            'text': '\n'.join(chunk_lines),
        })
    
    return chunks


def tokenize(text: str) -> List[str]:
    """
    Tokenize a string into lowercase words (simple whitespace + punct split).
    """
    # Split on whitespace and punctuation
    words = re.split(r'[\s\W]+', text.lower())
    return [w for w in words if w]


def score_chunk(chunk: Dict[str, Any], query_terms: List[str]) -> float:
    """
    Score a chunk against query terms using term-frequency overlap.
    Files that are source code (not JSON/YAML/Markdown) get a small bonus.
    """
    chunk_words = tokenize(chunk['text'] + ' ' + chunk['path'])
    word_set = set(chunk_words)
    
    score = 0.0
    for term in query_terms:
        if term in word_set:
            score += 1.0
        # Boost if the term appears in the file path
        if term in chunk['path'].lower():
            score += 2.0
    
    # Penalize very large lock files / generated files
    if 'package-lock' in chunk['path'] or 'yarn.lock' in chunk['path']:
        score -= 10.0
    
    return score


def build_context(files: List[Dict[str, Any]], query: str) -> str:
    """
    Build a context string from the repository files, ranked by relevance to the query.
    
    Args:
        files: Repository files array from database
        query: The user's query / question
        
    Returns:
        Formatted context block ready to embed in a prompt
    """
    query_terms = tokenize(query)
    all_chunks = []
    
    # Split all files into chunks
    for file in files:
        all_chunks.extend(chunk_file(file))
    
    # Score and sort chunks
    scored_chunks = []
    for chunk in all_chunks:
        score = score_chunk(chunk, query_terms)
        scored_chunks.append((chunk, score))
    
    scored_chunks.sort(key=lambda x: x[1], reverse=True)
    
    # Select chunks up to token budget
    selected = []
    used_chars = 0
    budget = CHAT_TOKEN_BUDGET * AVG_CHARS_PER_TOKEN
    
    for chunk, _ in scored_chunks:
        chunk_chars = len(chunk['text']) + len(chunk['path']) + 60
        if used_chars + chunk_chars > budget:
            continue
        selected.append(chunk)
        used_chars += chunk_chars
        if used_chars >= budget:
            break
    
    if not selected:
        return '(No relevant source files found.)'
    
    # Sort selected chunks by file path and line number
    selected.sort(key=lambda c: (c['path'], c['startLine']))
    
    # Format context
    context_parts = []
    for chunk in selected:
        context_parts.append(
            f"**File: `{chunk['path']}` (lines {chunk['startLine']}-{chunk['startLine'] + CHUNK_LINES - 1})**\n"
            f"```{chunk['language'].lower()}\n"
            f"{chunk['text']}\n"
            f"```\n"
        )
    
    return '\n'.join(context_parts)


def build_full_context(files: List[Dict[str, Any]], custom_instruction: str = '') -> str:
    """
    Build a context string with more files (for README/bug scan).
    Uses a larger token budget.
    """
    # For full context, we include more content
    all_chunks = []
    for file in files:
        all_chunks.extend(chunk_file(file))
    
    # Take top chunks by simple heuristic (source files first)
    def chunk_priority(chunk: Dict[str, Any]) -> tuple:
        language = chunk['language'].lower()
        # Prioritize: .py, .js, .ts, .java, .go > others > markdown/json
        if language in ['python', 'javascript', 'typescript', 'java', 'go', 'ruby', 'php']:
            priority = 0
        elif language in ['html', 'css', 'scss']:
            priority = 1
        else:
            priority = 2
        # Sort by priority, then by path
        return (priority, chunk['path'])
    
    all_chunks.sort(key=chunk_priority)
    
    # Select chunks up to larger budget
    selected = []
    used_chars = 0
    budget = FULL_TOKEN_BUDGET * AVG_CHARS_PER_TOKEN
    
    for chunk in all_chunks:
        chunk_chars = len(chunk['text']) + len(chunk['path']) + 60
        if used_chars + chunk_chars > budget:
            continue
        selected.append(chunk)
        used_chars += chunk_chars
        if used_chars >= budget:
            break
    
    if not selected:
        return '(No source files found.)'
    
    # Format context
    context_parts = []
    for chunk in selected:
        context_parts.append(
            f"**File: `{chunk['path']}`**\n"
            f"```{chunk['language'].lower()}\n"
            f"{chunk['text']}\n"
            f"```\n"
        )
    
    return '\n'.join(context_parts)
