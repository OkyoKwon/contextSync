import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../stores/locale.store', () => ({
  useLocaleStore: vi.fn((selector: (s: { locale: string }) => string) =>
    selector({ locale: 'en' }),
  ),
}));

import { useLocaleSync } from '../use-locale-sync';

describe('useLocaleSync', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sets lang attribute on document element', () => {
    const spy = vi.spyOn(document.documentElement, 'setAttribute');
    renderHook(() => useLocaleSync());
    expect(spy).toHaveBeenCalledWith('lang', 'en');
  });
});
