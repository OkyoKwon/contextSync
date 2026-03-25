import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../stores/theme.store', () => ({
  useThemeStore: vi.fn((selector: (s: { theme: string }) => string) => selector({ theme: 'dark' })),
}));

import { useThemeSync } from '../use-theme';

describe('useThemeSync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sets data-theme attribute on document element', () => {
    const spy = vi.spyOn(document.documentElement, 'setAttribute');
    renderHook(() => useThemeSync());
    expect(spy).toHaveBeenCalledWith('data-theme', 'dark');
  });
});
