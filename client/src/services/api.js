const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function api(path, options = {}) {
  const token = sessionStorage.getItem('fixnearme_token');
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Can’t reach FixNearMe right now. Check that the API is running and try again.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'Something went wrong. Please try again.');
    error.status = response.status;
    error.code = payload.error?.code;
    error.details = payload.error?.details || [];
    throw error;
  }
  return payload;
}

export const apiPath = baseUrl;
