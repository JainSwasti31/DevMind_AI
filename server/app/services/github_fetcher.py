"""
GitHub Fetcher Service

Fetches the file tree and file contents of a public GitHub repository
using the GitHub REST API — no git binary required.
"""

import httpx
import re
from pathlib import Path
from typing import Optional, Dict, List, Any
from app.config import get_settings

settings = get_settings()

# Language map
EXTENSION_LANGUAGE_MAP = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.json': 'JSON',
    '.py': 'Python',
    '.java': 'Java',
    '.cs': 'C#',
    '.go': 'Go',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.md': 'Markdown',
    '.yaml': 'YAML',
    '.yml': 'YAML',
}

SUPPORTED_EXTENSIONS = set(EXTENSION_LANGUAGE_MAP.keys())

# Folders to skip
SKIP_DIRS = {
    'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
    'coverage', '.cache', '__pycache__', 'vendor', '.venv', 'venv',
    'out', '.output', 'target', '.egg-info', '.pytest_cache'
}


def get_language(file_path: str) -> str:
    """Get language from file extension."""
    ext = Path(file_path).suffix.lower()
    return EXTENSION_LANGUAGE_MAP.get(ext, 'Text')


def should_skip(file_path: str) -> bool:
    """Check if file should be skipped."""
    parts = file_path.split('/')
    return any(p in SKIP_DIRS for p in parts)


def parse_github_url(url: str) -> Optional[Dict[str, str]]:
    """
    Parse a GitHub URL into { owner, repo, branch?, subPath? }.
    Supports:
      https://github.com/owner/repo
      https://github.com/owner/repo.git
      https://github.com/owner/repo/tree/branch
      https://github.com/owner/repo/tree/branch/some/subpath
    """
    cleaned = url.strip().rstrip('.git')
    match = re.match(
        r'^https?://github\.com/([^/]+)/([^/]+)(?:/tree/([^/]+)(/.*))?',
        cleaned
    )
    if not match:
        return None
    return {
        'owner': match.group(1),
        'repo': match.group(2),
        'branch': match.group(3) or None,
        'subPath': match.group(4).lstrip('/') if match.group(4) else None,
    }


def make_headers() -> Dict[str, str]:
    """Create headers for GitHub API requests."""
    token = settings.GITHUB_TOKEN.strip() if settings.GITHUB_TOKEN else ''
    # Filter out placeholder values
    if token.lower().startswith(('your', 'ghp_placeholder')):
        token = ''
    
    headers = {'Accept': 'application/vnd.github+json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    return headers


async def fetch_github_repo(github_url: str) -> Dict[str, Any]:
    """
    Fetch all supported source files from a GitHub repository.
    
    Returns:
        {
            'repoName': str,
            'files': [{'path': str, 'language': str, 'lineCount': int, 'size': int, 'content': str}],
            'meta': {...}
        }
    """
    parsed = parse_github_url(github_url)
    if not parsed:
        raise ValueError('Invalid GitHub URL. Expected https://github.com/owner/repo')

    owner = parsed['owner']
    repo = parsed['repo']
    requested_branch = parsed.get('branch')

    async with httpx.AsyncClient(timeout=20.0) as client:
        # Get repo metadata + default branch
        try:
            response = await client.get(
                f'https://api.github.com/repos/{owner}/{repo}',
                headers=make_headers()
            )
            response.raise_for_status()
            repo_data = response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise ValueError(f'Repository "{owner}/{repo}" not found or is private.')
            if e.response.status_code == 403:
                raise ValueError('GitHub API rate limit exceeded. Add a GITHUB_TOKEN to .env.')
            raise ValueError(f'Failed to reach GitHub API: {e}')

        branch = requested_branch or repo_data.get('default_branch', 'main')
        
        # Get the full recursive file tree
        try:
            response = await client.get(
                f'https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1',
                headers=make_headers()
            )
            response.raise_for_status()
            tree_data = response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise ValueError(f'Branch "{branch}" not found in "{owner}/{repo}".')
            raise ValueError(f'Failed to fetch file tree: {e}')

        # Filter supported files
        files_to_fetch = []
        for item in tree_data.get('tree', []):
            if item['type'] != 'blob':
                continue
            file_path = item['path']
            if should_skip(file_path):
                continue
            ext = Path(file_path).suffix.lower()
            if ext in SUPPORTED_EXTENSIONS:
                files_to_fetch.append(file_path)

        # Limit to 300 files
        MAX_FILES = 300
        files_to_fetch = files_to_fetch[:MAX_FILES]

        # Fetch file contents in batches
        MAX_FILE_BYTES = 200 * 1024  # 200 KB per file
        BATCH_SIZE = 10
        files = []

        for i in range(0, len(files_to_fetch), BATCH_SIZE):
            batch = files_to_fetch[i:i + BATCH_SIZE]
            tasks = []
            
            for file_path in batch:
                try:
                    response = await client.get(
                        f'https://api.github.com/repos/{owner}/{repo}/contents/{file_path}?ref={branch}',
                        headers=make_headers()
                    )
                    response.raise_for_status()
                    file_data = response.json()
                    
                    if 'content' in file_data:
                        content = file_data['content']
                        # GitHub returns base64-encoded content
                        import base64
                        content = base64.b64decode(content).decode('utf-8', errors='ignore')
                        
                        if len(content) <= MAX_FILE_BYTES:
                            line_count = content.count('\n') + 1
                            files.append({
                                'path': file_path,
                                'language': get_language(file_path),
                                'lineCount': line_count,
                                'size': len(content),
                                'content': content
                            })
                except Exception as e:
                    print(f"Warning: Failed to fetch {file_path}: {e}")
                    continue

        return {
            'repoName': repo_data.get('name', repo),
            'files': files,
            'meta': {
                'owner': owner,
                'repo': repo,
                'branch': branch,
                'stars': repo_data.get('stargazers_count'),
                'description': repo_data.get('description'),
                'language': repo_data.get('language'),
                'url': f'https://github.com/{owner}/{repo}',
            }
        }
