import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHookWithProviders } from '../../test/test-utils';

vi.mock('../../api/projects.api', () => ({
  projectsApi: {
    generateJoinCode: vi.fn(),
    regenerateJoinCode: vi.fn(),
    deleteJoinCode: vi.fn(),
    joinByCode: vi.fn(),
  },
}));

import {
  useGenerateJoinCode,
  useRegenerateJoinCode,
  useDeleteJoinCode,
  useJoinProject,
} from '../use-join-project';

describe('useJoinProject hooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('useGenerateJoinCode returns mutate', () => {
    const { result } = renderHookWithProviders(() => useGenerateJoinCode('p1'));
    expect(result.current.mutate).toBeDefined();
  });

  it('useRegenerateJoinCode returns mutate', () => {
    const { result } = renderHookWithProviders(() => useRegenerateJoinCode('p1'));
    expect(result.current.mutate).toBeDefined();
  });

  it('useDeleteJoinCode returns mutate', () => {
    const { result } = renderHookWithProviders(() => useDeleteJoinCode('p1'));
    expect(result.current.mutate).toBeDefined();
  });

  it('useJoinProject returns mutate', () => {
    const { result } = renderHookWithProviders(() => useJoinProject());
    expect(result.current.mutate).toBeDefined();
  });
});
