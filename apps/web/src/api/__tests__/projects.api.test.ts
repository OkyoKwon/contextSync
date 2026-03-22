import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    post: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    patch: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

import { projectsApi } from '../projects.api';
import { api } from '../client';

describe('projectsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list calls GET /projects', async () => {
    await projectsApi.list();
    expect(api.get).toHaveBeenCalledWith('/projects');
  });

  it('get calls GET /projects/:id', async () => {
    await projectsApi.get('proj-1');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1');
  });

  it('create calls POST /projects', async () => {
    const input = { name: 'Test', description: 'desc' };
    await projectsApi.create(input as any);
    expect(api.post).toHaveBeenCalledWith('/projects', input);
  });

  it('update calls PATCH /projects/:id', async () => {
    await projectsApi.update('proj-1', { name: 'Updated' } as any);
    expect(api.patch).toHaveBeenCalledWith('/projects/proj-1', { name: 'Updated' });
  });

  it('delete calls DELETE /projects/:id', async () => {
    await projectsApi.delete('proj-1');
    expect(api.delete).toHaveBeenCalledWith('/projects/proj-1');
  });

  it('listCollaborators calls GET /projects/:id/collaborators', async () => {
    await projectsApi.listCollaborators('proj-1');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/collaborators');
  });

  it('removeCollaborator calls DELETE', async () => {
    await projectsApi.removeCollaborator('proj-1', 'user-1');
    expect(api.delete).toHaveBeenCalledWith('/projects/proj-1/collaborators/user-1');
  });

  it('setMyDirectory calls PATCH', async () => {
    await projectsApi.setMyDirectory('proj-1', '/path/to/dir');
    expect(api.patch).toHaveBeenCalledWith('/projects/proj-1/my-directory', {
      localDirectory: '/path/to/dir',
    });
  });

  it('joinByCode calls POST /projects/join', async () => {
    await projectsApi.joinByCode('ABC123');
    expect(api.post).toHaveBeenCalledWith('/projects/join', { code: 'ABC123' });
  });
});
