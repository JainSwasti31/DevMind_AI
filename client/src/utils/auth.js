const API_BASE_URL = 'https://devmind-ai-2fa9.onrender.com/api';

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
}

export async function registerUser(name, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return response.json();
}

export async function logoutUser(refreshToken) {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: refreshToken }),
    });
  } catch {
    // Best-effort logout — ignore network errors
  }
}

export function buildAuthHeaders(accessToken) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export function authFetch(input, init = {}, accessToken = null) {
  return fetch(input, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...buildAuthHeaders(accessToken),
    },
  });
}
