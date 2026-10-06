async function request(endpoint, owner, options = {}) {
  const headers = new Headers(options.headers);
  headers.set('X-User-Id', owner);
  let response;
  try {
    response = await fetch(`/api${endpoint}`, { ...options, headers });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'Não foi possível concluir a operação.');
  }
  return response;
}

export async function listDocuments(owner, signal) {
  const response = await request('/documents', owner, { signal });
  return response.json();
}

export async function uploadDocument(file, owner, signal) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', owner, { method: 'POST', body, signal });
  return response.json();
}

export async function downloadDocument(id, owner, signal) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`, owner, { signal });
  return response.blob();
}