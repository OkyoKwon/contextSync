import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createAuthStoreMock,
  setMockAuthState,
  resetMockAuthState,
} from '../../test/mocks/auth-store.mock';
import { renderHookWithProviders, waitFor, setupMsw } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import {
  useGenerateJoinCode,
  useRegenerateJoinCode,
  useDeleteJoinCode,
  useJoinProject,
} from '../use-join-project';

setupMsw();

describe('useJoinProject hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'tok', currentProjectId: 'p1' });
  });

  describe('useGenerateJoinCode', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useGenerateJoinCode('p1'));
      expect(result.current.mutate).toBeDefined();
    });

    it('calls POST /projects/:id/join-code on mutate', async () => {
      server.use(
        http.post('/api/projects/p1/join-code', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'p1', name: 'Project', joinCode: 'ABC123' },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useGenerateJoinCode('p1'));
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('handles error response', async () => {
      server.use(
        http.post('/api/projects/p1/join-code', () =>
          HttpResponse.json({ success: false, data: null, error: 'Forbidden' }, { status: 403 }),
        ),
      );

      const { result } = renderHookWithProviders(() => useGenerateJoinCode('p1'));
      result.current.mutate();
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useRegenerateJoinCode', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useRegenerateJoinCode('p1'));
      expect(result.current.mutate).toBeDefined();
    });

    it('calls POST /projects/:id/join-code/regenerate on mutate', async () => {
      server.use(
        http.post('/api/projects/p1/join-code/regenerate', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'p1', name: 'Project', joinCode: 'NEW456' },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useRegenerateJoinCode('p1'));
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useDeleteJoinCode', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useDeleteJoinCode('p1'));
      expect(result.current.mutate).toBeDefined();
    });

    it('calls DELETE /projects/:id/join-code on mutate', async () => {
      server.use(
        http.delete('/api/projects/p1/join-code', () =>
          HttpResponse.json({ success: true, data: null, error: null }),
        ),
      );

      const { result } = renderHookWithProviders(() => useDeleteJoinCode('p1'));
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useJoinProject', () => {
    it('returns mutate function', () => {
      const { result } = renderHookWithProviders(() => useJoinProject());
      expect(result.current.mutate).toBeDefined();
    });

    it('calls POST /projects/join on mutate', async () => {
      server.use(
        http.post('/api/projects/join', () =>
          HttpResponse.json({
            success: true,
            data: { id: 'p2', name: 'Joined Project' },
            error: null,
          }),
        ),
      );

      const { result } = renderHookWithProviders(() => useJoinProject());
      result.current.mutate('JOIN-CODE');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('handles invalid join code error', async () => {
      server.use(
        http.post('/api/projects/join', () =>
          HttpResponse.json(
            { success: false, data: null, error: 'Invalid join code' },
            { status: 404 },
          ),
        ),
      );

      const { result } = renderHookWithProviders(() => useJoinProject());
      result.current.mutate('INVALID');
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
