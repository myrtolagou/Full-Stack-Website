import { BASE_URL as _BASE_URL } from '../config';
const BASE_URL = `${_BASE_URL}/api`;

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.message ?? `Request failed: ${response.status}`;
    throw new Error(message);
  }

  // 204 No Content — return null instead of trying to parse JSON
  if (response.status === 204) return null;

  return response.json();
}
