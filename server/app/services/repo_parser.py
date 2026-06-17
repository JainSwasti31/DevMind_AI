"""
Repository Parser Service

Handles parsing of uploaded ZIP files and individual source files.
"""

import io
import zipfile
from pathlib import Path
from typing import List, Dict, Any
from fastapi import UploadFile

# Language map (same as github_fetcher)
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


def parse_zip_buffer(buffer: bytes) -> List[Dict[str, Any]]:
    """
    Parse a ZIP file buffer and extract source files.
    
    Returns:
        List of file objects: [{'path': str, 'language': str, 'lineCount': int, 'size': int, 'content': str}]
    """
    files = []
    MAX_FILE_BYTES = 200 * 1024  # 200 KB per file
    
    try:
        with zipfile.ZipFile(io.BytesIO(buffer)) as zf:
            for file_info in zf.filelist:
                file_path = file_info.filename
                
                # Skip directories
                if file_path.endswith('/'):
                    continue
                
                # Skip unwanted files
                if should_skip(file_path):
                    continue
                
                # Check if file extension is supported
                ext = Path(file_path).suffix.lower()
                if ext not in SUPPORTED_EXTENSIONS:
                    continue
                
                # Read file content
                try:
                    content = zf.read(file_path).decode('utf-8', errors='ignore')
                except Exception as e:
                    print(f"Warning: Failed to read {file_path}: {e}")
                    continue
                
                # Skip files that are too large
                if len(content) > MAX_FILE_BYTES:
                    print(f"Warning: Skipping {file_path} (too large)")
                    continue
                
                # Calculate line count
                line_count = content.count('\n') + 1
                
                files.append({
                    'path': file_path.replace('\\', '/'),  # Normalize paths
                    'language': get_language(file_path),
                    'lineCount': line_count,
                    'size': len(content),
                    'content': content
                })
    except zipfile.BadZipFile:
        raise ValueError("Invalid ZIP file")
    
    return files


def parse_single_file(file_content: bytes, file_name: str) -> Dict[str, Any]:
    """
    Parse a single source file.
    
    Returns:
        File object: {'path': str, 'language': str, 'lineCount': int, 'size': int, 'content': str}
    """
    MAX_FILE_BYTES = 200 * 1024  # 200 KB per file
    
    # Check if file extension is supported
    ext = Path(file_name).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"File type not supported: {ext}")
    
    # Decode content
    try:
        content = file_content.decode('utf-8', errors='ignore')
    except Exception as e:
        raise ValueError(f"Failed to read file: {e}")
    
    # Check file size
    if len(content) > MAX_FILE_BYTES:
        raise ValueError("File is too large (max 200 KB)")
    
    # Calculate line count
    line_count = content.count('\n') + 1
    
    return {
        'path': file_name,
        'language': get_language(file_name),
        'lineCount': line_count,
        'size': len(content),
        'content': content
    }


async def parse_upload(file: UploadFile) -> List[Dict[str, Any]]:
    """
    Parse an uploaded file (ZIP or single source file).
    
    Returns:
        List of file objects
    """
    content = await file.read()
    file_name = file.filename or 'file'
    
    # Check if it's a ZIP file
    if file_name.lower().endswith('.zip'):
        return parse_zip_buffer(content)
    else:
        # Single file
        try:
            file_obj = parse_single_file(content, file_name)
            return [file_obj]
        except ValueError as e:
            raise ValueError(str(e))
