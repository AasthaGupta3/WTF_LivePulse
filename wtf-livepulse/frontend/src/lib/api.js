const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  get:    (path)       => request('GET',   path),
  post:   (path, body) => request('POST',  path, body),
  patch:  (path, body) => request('PATCH', path, body),
  delete: (path)       => request('DELETE',path),
};
