import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createAuthStoreMock,
  setMockAuthState,
  resetMockAuthState,
} from '../../test/mocks/auth-store.mock';
import { setupMsw } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import { projectsApi } from '../projects.api';

setupMsw();

describe('projectsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('list returns parsed project data', async () => {
    const projects = [{ id: 'p1', name: 'Project A', ownerId: 'u1' }];
    server.use(
      http.get('/api/projects', () =>
        HttpResponse.json({ success: true, data: projects, error: null }),
      ),
    );

    const result = await projectsApi.list();
    expect(result.data).toEqual(projects);
  });

  it('get returns single project', async () => {
    const project = { id: 'proj-1', name: 'Test', ownerId: 'u1' };
    server.use(
      http.get('/api/projects/proj-1', () =>
        HttpResponse.json({ success: true, data: project, error: null }),
      ),
    );

    const result = await projectsApi.get('proj-1');
    expect(result.data?.id).toBe('proj-1');
  });

  it('create sends POST with input and returns project', async () => {
    let capturedBody: any = null;
    server.use(
      http.post('/api/projects', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { id: 'new-proj', name: 'Test' },
          error: null,
        });
      }),
    );

    const result = await projectsApi.create({ name: 'Test' } as any);
    expect(capturedBody).toEqual({ name: 'Test' });
    expect(result.data?.id).toBe('new-proj');
  });

  it('update sends PATCH with input', async () => {
    let capturedBody: any = null;
    server.use(
      http.patch('/api/projects/proj-1', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { id: 'proj-1', name: 'Updated' },
          error: null,
        });
      }),
    );

    await projectsApi.update('proj-1', { name: 'Updated' } as any);
    expect(capturedBody).toEqual({ name: 'Updated' });
  });

  it('delete sends DELETE request', async () => {
    let wasCalled = false;
    server.use(
      http.delete('/api/projects/proj-1', () => {
        wasCalled = true;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    await projectsApi.delete('proj-1');
    expect(wasCalled).toBe(true);
  });

  it('listCollaborators returns collaborator list', async () => {
    const collabs = [
      { userId: 'u1', role: 'owner' },
      { userId: 'u2', role: 'member' },
    ];
    server.use(
      http.get('/api/projects/proj-1/collaborators', () =>
        HttpResponse.json({ success: true, data: collabs, error: null }),
      ),
    );

    const result = await projectsApi.listCollaborators('proj-1');
    expect(result.data).toHaveLength(2);
  });

  it('removeCollaborator sends DELETE with userId', async () => {
    let wasCalled = false;
    server.use(
      http.delete('/api/projects/proj-1/collaborators/user-1', () => {
        wasCalled = true;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    await projectsApi.removeCollaborator('proj-1', 'user-1');
    expect(wasCalled).toBe(true);
  });

  it('setMyDirectory sends PATCH with localDirectory', async () => {
    let capturedBody: any = null;
    server.use(
      http.patch('/api/projects/proj-1/my-directory', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    await projectsApi.setMyDirectory('proj-1', '/path/to/dir');
    expect(capturedBody).toEqual({ localDirectory: '/path/to/dir' });
  });

  it('joinByCode sends POST with code', async () => {
    let capturedBody: any = null;
    server.use(
      http.post('/api/projects/join', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({
          success: true,
          data: { id: 'proj-1', name: 'Joined Project' },
          error: null,
        });
      }),
    );

    const result = await projectsApi.joinByCode('ABC123');
    expect(capturedBody).toEqual({ code: 'ABC123' });
    expect(result.data?.name).toBe('Joined Project');
  });

  it('throws on 404', async () => {
    server.use(
      http.get('/api/projects/nonexistent', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );

    await expect(projectsApi.get('nonexistent')).rejects.toThrow('Not found');
  });

  it('throws on success:false response', async () => {
    server.use(
      http.get('/api/projects', () =>
        HttpResponse.json({ success: false, data: null, error: 'Forbidden' }),
      ),
    );

    await expect(projectsApi.list()).rejects.toThrow('Forbidden');
  });
});
