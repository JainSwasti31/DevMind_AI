/**
 * githubFetcher.js
 *
 * Fetches the file tree and file contents of a public GitHub repository
 * using the GitHub REST API — no git binary required.
 *
 * Strategy:
 *  1. Parse owner/repo from the URL.
 *  2. GET /repos/{owner}/{repo} to confirm it exists and get the default branch.
 *  3. GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1 to get the full tree.
 *  4. Filter to supported source-file extensions (skip node_modules, dist, etc.).
 *  5. Fetch each file's content in parallel batches (max 10 at a time).
 *  6. Return the same [{path, language, lineCount, size, content}] shape the rest
 *     of the pipeline expects.
 */

import axios from 'axios';
import path from 'path';
import { GITHUB_TOKEN } from '../config.js';

// ─── Language map (same as repoParser) ──────────────────────────────────────

const extensionLanguageMap = {
  '.js':   'JavaScript',
  '.jsx':  'JavaScript',
  '.ts':   'TypeScript',
  '.tsx':  'TypeScript',
  '.json': 'JSON',
  '.py':   'Python',
  '.java': 'Java',
  '.cs':   'C#',
  '.go':   'Go',
  '.rb':   'Ruby',
  '.php':  'PHP',
  '.html': 'HTML',
  '.css':  'CSS',
  '.scss': 'SCSS',
  '.md':   'Markdown',
  '.yaml': 'YAML',
  '.yml':  'YAML',
};

const supportedExtensions = new Set(Object.keys(extensionLanguageMap));

const getLanguage = (filePath) =>
  extensionLanguageMap[path.extname(filePath).toLowerCase()] || 'Text';

// ─── Folders to skip entirely ────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  'coverage', '.cache', '__pycache__', 'vendor', '.venv', 'venv',
  'out', '.output', 'target',
]);

function shouldSkip(filePath) {
  const parts = filePath.split('/');
  return parts.some((p) => SKIP_DIRS.has(p));
}

// ─── GitHub API client ───────────────────────────────────────────────────────

// Trim and ignore placeholder values
const TOKEN = GITHUB_TOKEN?.trim().replace(/^(your[_-]?token.*|ghp_placeholder.*)$/i, '') || '';

function makeHeaders() {
  const headers = { Accept: 'application/vnd.github+json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  return headers;
}

const ghApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: makeHeaders(),
  timeout: 20000,
});

// ─── URL parser ──────────────────────────────────────────────────────────────

/**
 * Parse a GitHub URL into { owner, repo, branch?, subPath? }.
 * Supports:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/tree/branch
 *   https://github.com/owner/repo/tree/branch/some/subpath
 */
export function parseGitHubUrl(url) {
  const cleaned = url.trim().replace(/\.git$/, '');
  const match = cleaned.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/([^/]+)(\/.*)?)?/
  );
  if (!match) return null;
  return {
    owner:   match[1],
    repo:    match[2],
    branch:  match[3] || null,
    subPath: match[4] ? match[4].replace(/^\//, '') : null,
  };
}

// ─── Main fetcher ─────────────────────────────────────────────────────────────

const MAX_FILES        = 300;
const MAX_FILE_BYTES   = 200 * 1024; // 200 KB per file
const BATCH_SIZE       = 10;         // parallel fetches at a time

/**
 * Fetch all supported source files from a GitHub repository.
 *
 * @param {string} githubUrl  Full GitHub URL (https://github.com/owner/repo)
 * @param {function} onProgress  Optional callback(fetched, total) for progress updates
 * @returns {{ repoName: string, files: Array, meta: object }}
 */
export async function fetchGitHubRepo(githubUrl, onProgress) {
  const parsed = parseGitHubUrl(githubUrl);
  if (!parsed) throw new Error('Invalid GitHub URL. Expected https://github.com/owner/repo');

  const { owner, repo, branch: requestedBranch, subPath } = parsed;

  // 1. Get repo metadata + default branch
  let repoMeta;
  try {
    const { data } = await ghApi.get(`/repos/${owner}/${repo}`);
    repoMeta = data;
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" not found or is private.`);
    }
    if (err.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Add a GITHUB_TOKEN to .env to increase the limit.');
    }
    throw new Error(`Failed to reach GitHub API: ${err.message}`);
  }

  const branch = requestedBranch || repoMeta.default_branch;

  // 2. Get the full recursive file tree
  let treeData;
  try {
    const { data } = await ghApi.get(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    );
    treeData = data;
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error(`Branch "${branch}" not found in "${owner}/${repo}".`);
    }
    throw new Error(`Failed to fetch file tree: ${err.message}`);
  }

  if (treeData.truncated) {
    console.warn(`[githubFetcher] Tree truncated for ${owner}/${repo} — very large repo`);
  }

  // 3. Filter to supported files
  const blobs = treeData.tree
    .filter((item) => {
      if (item.type !== 'blob') return false;
      if (shouldSkip(item.path)) return false;
      if (subPath && !item.path.startsWith(subPath)) return false;
      const ext = path.extname(item.path).toLowerCase();
      return supportedExtensions.has(ext);
    })
    .slice(0, MAX_FILES);

  if (blobs.length === 0) {
    throw new Error('No supported source files found in this repository.');
  }

  // 4. Fetch file contents in batches
  const files = [];
  let fetched = 0;

  for (let i = 0; i < blobs.length; i += BATCH_SIZE) {
    const batch = blobs.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((item) => fetchFileContent(owner, repo, item))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        files.push(result.value);
      }
    }

    fetched += batch.length;
    if (onProgress) onProgress(fetched, blobs.length);
  }

  return {
    repoName: repo,
    files,
    meta: {
      owner,
      repo,
      branch,
      stars: repoMeta.stargazers_count,
      description: repoMeta.description,
      language: repoMeta.language,
      url: repoMeta.html_url,
    },
  };
}

// ─── Fetch single file content ───────────────────────────────────────────────

async function fetchFileContent(owner, repo, item) {
  try {
    // Use the raw content endpoint — much faster than the contents API
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${item.path}`;
    const { data } = await axios.get(rawUrl, {
      responseType: 'text',
      timeout: 10000,
      maxContentLength: MAX_FILE_BYTES,
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    });

    const content = typeof data === 'string' ? data : String(data);
    const truncated = content.length > MAX_FILE_BYTES
      ? content.slice(0, MAX_FILE_BYTES) + '\n// [truncated]'
      : content;

    return {
      path:      item.path,
      language:  getLanguage(item.path),
      lineCount: truncated.split(/\r?\n/).length,
      size:      Buffer.byteLength(truncated, 'utf8'),
      content:   truncated,
    };
  } catch {
    // Skip files that can't be fetched (binary, too large, network error)
    return null;
  }
}
