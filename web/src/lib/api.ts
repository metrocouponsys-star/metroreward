export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class StampError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'StampError';
  }
}

const API_BASE = '/api';

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'same-origin',
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = (json as { error?: ApiError }).error;
    throw new StampError(
      err?.code ?? 'INTERNAL',
      err?.message ?? 'Something went wrong.',
      err?.details,
    );
  }

  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

