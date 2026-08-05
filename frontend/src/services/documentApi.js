const API_PREFIX = '/api';

function buildUrl(path) {
  return `${API_PREFIX}${path}`;
}

async function parseErrorResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.json();
    const message = payload?.error?.message || 'Falha na requisicao';
    throw new Error(message);
  }

  const text = await response.text();
  throw new Error(text || 'Falha na requisicao');
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), options);

  if (!response.ok) {
    await parseErrorResponse(response);
  }

  return response;
}

function extractFilename(contentDisposition, fallbackName) {
  if (!contentDisposition) {
    return fallbackName;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallbackName;
}

export async function uploadDocument({ file, owner }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('owner', owner);

  const response = await request('/upload', {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export async function listDocuments() {
  const response = await request('/documents');
  return response.json();
}

export async function downloadDocument({ id, fallbackName }) {
  const response = await request(`/documents/${id}/download`);
  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition');

  return {
    blob,
    filename: extractFilename(contentDisposition, fallbackName),
  };
}
