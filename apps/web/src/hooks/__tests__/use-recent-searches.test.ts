import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '../../test/test-utils';
import { renderHookWithProviders } from '../../test/test-utils';
import { useRecentSearches } from '../use-recent-searches';

describe('useRecentSearches', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty searches', () => {
    const { result } = renderHookWithProviders(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);
  });

  it('addSearch adds a search term', () => {
    const { result } = renderHookWithProviders(() => useRecentSearches());
    act(() => result.current.addSearch('test query'));
    expect(result.current.searches).toEqual(['test query']);
  });

  it('addSearch deduplicates and moves to front', () => {
    const { result } = renderHookWithProviders(() => useRecentSearches());
    act(() => {
      result.current.addSearch('first');
      result.current.addSearch('second');
      result.current.addSearch('first');
    });
    expect(result.current.searches).toEqual(['first', 'second']);
  });

  it('limits to MAX_RECENT (5) entries', () => {
    const { result } = renderHookWithProviders(() => useRecentSearches());
    act(() => {
      for (let i = 1; i <= 7; i++) {
        result.current.addSearch(`search ${i}`);
      }
    });
    expect(result.current.searches).toHaveLength(5);
    expect(result.current.searches[0]).toBe('search 7');
  });

  it('ignores empty/whitespace-only queries', () => {
    const { result } = renderHookWithProviders(() => useRecentSearches());
    act(() => {
      result.current.addSearch('');
      result.current.addSearch('   ');
    });
    expect(result.current.searches).toEqual([]);
  });

  it('clearSearches removes all and clears localStorage', () => {
    const { result } = renderHookWithProviders(() => useRecentSearches());
    act(() => result.current.addSearch('test'));
    act(() => result.current.clearSearches());
    expect(result.current.searches).toEqual([]);
    expect(localStorage.getItem('context-sync-recent-searches')).toBeNull();
  });

  it('persists to localStorage', () => {
    const { result } = renderHookWithProviders(() => useRecentSearches());
    act(() => result.current.addSearch('persisted'));
    const stored = JSON.parse(localStorage.getItem('context-sync-recent-searches')!);
    expect(stored).toEqual(['persisted']);
  });

  it('recovers from broken JSON in localStorage', () => {
    localStorage.setItem('context-sync-recent-searches', 'not-json');
    const { result } = renderHookWithProviders(() => useRecentSearches());
    expect(result.current.searches).toEqual([]);
  });
});
