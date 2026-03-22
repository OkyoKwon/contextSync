import { test as dbTest } from './db.fixture.js';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const API_BASE = process.env['TEST_API_BASE'] ?? 'http://localhost:3099/api';

interface LoginResult {
  readonly token: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly name: string;
  };
}

interface CreateProjectResult {
  readonly id: string;
  readonly name: string;
}

interface RawResponse {
  readonly status: number;
  readonly body: {
    readonly success: boolean;
    readonly data: unknown;
    readonly error: string | null;
    readonly meta?: {
      readonly total: number;
      readonly page: number;
      readonly limit: number;
      readonly totalPages: number;
    };
  };
}

interface ApiClient {
  get<T>(path: string, token?: string): Promise<T>;
  post<T>(path: string, body: unknown, token?: string): Promise<T>;
  patch<T>(path: string, body: unknown, token?: string): Promise<T>;
  del<T>(path: string, token?: string): Promise<T>;
  login(name: string, email: string): Promise<LoginResult>;
  autoLogin(): Promise<LoginResult>;
  upgrade(
    token: string,
    input: { name: string; email: string; autoUserId: string },
  ): Promise<LoginResult>;
  createProject(
    token: string,
    input: { name: string; description?: string },
  ): Promise<CreateProjectResult>;
  importSession(token: string, projectId: string, filePath: string): Promise<unknown>;
  uploadPrd(token: string, projectId: string, filePath: string, title?: string): Promise<unknown>;
  fetchRaw(method: string, path: string, body?: unknown, token?: string): Promise<RawResponse>;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = (await response.json()) as { success: boolean; data: T; error: string | null };

  if (!json.success) {
    throw new Error(`API ${method} ${path} failed: ${json.error}`);
  }

  return json.data;
}

async function fetchRaw(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<RawResponse> {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json: RawResponse['body'];
  try {
    json = (await response.json()) as RawResponse['body'];
  } catch {
    json = { success: false, data: null, error: `HTTP ${response.status}` };
  }
  return { status: response.status, body: json };
}

async function importSessionFile(
  token: string,
  projectId: string,
  filePath: string,
): Promise<unknown> {
  const fileContent = readFileSync(filePath);
  const fileName = basename(filePath);

  const formData = new FormData();
  formData.append('file', new Blob([fileContent]), fileName);

  const response = await fetch(`${API_BASE}/projects/${projectId}/sessions/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const json = (await response.json()) as { success: boolean; data: unknown; error: string | null };
  if (!json.success) {
    throw new Error(`Import session failed: ${json.error}`);
  }
  return json.data;
}

async function uploadPrdFile(
  token: string,
  projectId: string,
  filePath: string,
  title?: string,
): Promise<unknown> {
  const fileContent = readFileSync(filePath);
  const fileName = basename(filePath);

  const formData = new FormData();
  formData.append('file', new Blob([fileContent]), fileName);
  if (title) {
    formData.append('title', title);
  }

  const response = await fetch(`${API_BASE}/projects/${projectId}/prd/documents`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const json = (await response.json()) as { success: boolean; data: unknown; error: string | null };
  if (!json.success) {
    throw new Error(`Upload PRD failed: ${json.error}`);
  }
  return json.data;
}

function createApiClient(): ApiClient {
  return {
    get: <T>(path: string, token?: string) => request<T>('GET', path, undefined, token),
    post: <T>(path: string, body: unknown, token?: string) => request<T>('POST', path, body, token),
    patch: <T>(path: string, body: unknown, token?: string) =>
      request<T>('PATCH', path, body, token),
    del: <T>(path: string, token?: string) => request<T>('DELETE', path, undefined, token),
    login: (name: string, email: string) =>
      request<LoginResult>('POST', '/auth/login', { name, email }),
    autoLogin: () => request<LoginResult>('POST', '/auth/auto'),
    upgrade: (token: string, input: { name: string; email: string; autoUserId: string }) =>
      request<LoginResult>('POST', '/auth/upgrade', input, token),
    createProject: (token: string, input: { name: string; description?: string }) =>
      request<CreateProjectResult>('POST', '/projects', input, token),
    importSession: (token: string, projectId: string, filePath: string) =>
      importSessionFile(token, projectId, filePath),
    uploadPrd: (token: string, projectId: string, filePath: string, title?: string) =>
      uploadPrdFile(token, projectId, filePath, title),
    fetchRaw: (method: string, path: string, body?: unknown, token?: string) =>
      fetchRaw(method, path, body, token),
  };
}

export type { ApiClient, RawResponse, LoginResult, CreateProjectResult };

export interface ApiFixture {
  readonly apiClient: ApiClient;
}

export const test = dbTest.extend<ApiFixture>({
  apiClient: async ({}, use) => {
    await use(createApiClient());
  },
});
