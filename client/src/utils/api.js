import { authFetch } from './auth.js';

export const API_BASE_URL = 'http://localhost:5000/api';

const getAccessToken = () => localStorage.getItem('devmindai_accessToken');
const getRefreshToken = () => localStorage.getItem('devmindai_refreshToken');

/**
 * Authenticated fetch with automatic access-token refresh on 401.
 * On a second 401, clears auth storage and reloads to force login.
 */
async function apiFetch(input, init = {}) {
  let response = await authFetch(input, init, getAccessToken());

  if (response.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await authFetch(input, init, getAccessToken());
    } else {
      // Refresh failed — clear auth and bounce to login
      localStorage.removeItem('devmindai_accessToken');
      localStorage.removeItem('devmindai_refreshToken');
      localStorage.removeItem('devmindai_user');
      window.location.href = '/auth';
      return response;
    }
  }

  return response;
}

async function tryRefresh() {
  const token = getRefreshToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem('devmindai_accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('devmindai_refreshToken', data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Repository API ──────────────────────────────────────────────────────────

export async function uploadRepository(formData) {
  const response = await apiFetch(`${API_BASE_URL}/repos/upload`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function fetchRepositories() {
  const response = await apiFetch(`${API_BASE_URL}/repos`);
  return response.json();
}

export async function fetchRepository(repoId) {
  const response = await apiFetch(`${API_BASE_URL}/repos/${repoId}`);
  return response.json();
}

export async function deleteRepository(repoId) {
  const response = await apiFetch(`${API_BASE_URL}/repos/${repoId}`, { method: 'DELETE' });
  return response.json();
}

export async function importFromGitHub(githubUrl) {
  const response = await apiFetch(`${API_BASE_URL}/repos/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ githubUrl }),
  });
  return response.json();
}

// ─── AI API ─────────────────────────────────────────────────────────────────

/** Get user-provided Gemini key from localStorage, if any */
function getUserApiKey() {
  return localStorage.getItem('devmindai_user_gemini_key') || '';
}

/** Build headers that include the user's own API key if set */
function aiHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const userKey = getUserApiKey();
  if (userKey) headers['X-User-API-Key'] = userKey;
  return headers;
}

/**
 * Open an SSE stream for chat.
 * Returns an EventSource-like object (actually a ReadableStream reader).
 * onDelta(text) is called for each token, onDone() when complete, onError(msg) on error.
 */
export function streamChat(repoId, message, { onDelta, onDone, onError }) {
  const controller = new AbortController();

  const run = async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/ai/${repoId}/chat`, {
        method: 'POST',
        headers: aiHeaders(),
        body: JSON.stringify({ message }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        onError(err.message || 'AI request failed.');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw);
            if (event.type === 'delta') onDelta(event.content);
            else if (event.type === 'done') onDone();
            else if (event.type === 'error') onError(event.message);
          } catch {
            // Malformed SSE event — skip
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') onError(err.message || 'Connection error.');
    }
  };

  run();
  return controller; // caller can call controller.abort() to cancel
}

export async function fetchChatHistory(repoId) {
  const response = await apiFetch(`${API_BASE_URL}/ai/${repoId}/history`);
  return response.json();
}

export async function clearChatHistory(repoId) {
  const response = await apiFetch(`${API_BASE_URL}/ai/${repoId}/history`, { method: 'DELETE' });
  return response.json();
}

export async function explainCode(repoId, { filePath, code, symbol }) {
  const response = await apiFetch(`${API_BASE_URL}/ai/${repoId}/explain`, {
    method: 'POST',
    headers: aiHeaders(),
    body: JSON.stringify({ filePath, code, symbol }),
  });
  return response.json();
}

export async function generateReadme(repoId) {
  const response = await apiFetch(`${API_BASE_URL}/ai/${repoId}/readme`, {
    method: 'POST',
    headers: aiHeaders(),
  });
  return response.json();
}

export async function suggestBugs(repoId, { filePath, code } = {}) {
  const response = await apiFetch(`${API_BASE_URL}/ai/${repoId}/bugs`, {
    method: 'POST',
    headers: aiHeaders(),
    body: JSON.stringify({ filePath, code }),
  });
  return response.json();
}
