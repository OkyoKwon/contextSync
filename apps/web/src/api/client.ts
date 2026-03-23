import type { ApiResponse } from '@context-sync/shared';
import { useAuthStore } from '../stores/auth.store';
import { ApiError } from './api-error';

const BASE_URL = '/api';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) return false;

      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return false;

      const data = await response.json();
      if (data.success && data.data?.token) {
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setAuth(data.data.token, currentUser);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body != null && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && path !== '/auth/refresh') {
    const refreshed = await tryRefreshToken();

    if (refreshed) {
      const newToken = useAuthStore.getState().token;
      const retryHeaders = { ...headers };
      if (newToken) {
        retryHeaders['Authorization'] = `Bearer ${newToken}`;
      }
      const retryResponse = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: retryHeaders,
      });

      if (retryResponse.ok) {
        const data = (await retryResponse.json()) as ApiResponse<T>;
        if (!data.success && data.error) {
          throw new ApiError(data.error, retryResponse.status, data.data);
        }
        return data;
      }
    }

    useAuthStore.getState().logout();
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error ?? `Request failed (${response.status})`;
    throw new ApiError(message, response.status, errorBody?.data ?? null);
  }

  const data = (await response.json()) as ApiResponse<T>;

  if (!data.success && data.error) {
    throw new ApiError(data.error, response.status, data.data);
  }

  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  upload: <T>(path: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<T>(path, {
      method: 'POST',
      body: formData,
    });
  },
};
