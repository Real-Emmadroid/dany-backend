const API_URL_STORAGE_KEY = 'inventory_api_base_url';
const TOKEN_STORAGE_KEY = 'inventory_auth_token';

// Default is wired directly to this local Express backend: '/api'
export function getApiBaseUrl(): string {
  const stored = localStorage.getItem(API_URL_STORAGE_KEY);
  if (stored && stored.trim()) {
    return stored.trim();
  }
  return '/api';
}

export function setApiBaseUrl(url: string): void {
  const trimmed = url.trim();
  if (!trimmed || trimmed === '/api') {
    localStorage.removeItem(API_URL_STORAGE_KEY);
  } else {
    localStorage.setItem(API_URL_STORAGE_KEY, trimmed);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export class ApiError extends Error {
  statusCode: number;
  details?: Array<{ path: string; message: string }>;

  constructor(message: string, statusCode: number, details?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null as unknown as T;
  }

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const text = await response.text();
    data = { error: text || response.statusText };
  }

  if (!response.ok) {
    const errorMessage = data?.error || `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status, data?.details);
  }

  return data as T;
}
