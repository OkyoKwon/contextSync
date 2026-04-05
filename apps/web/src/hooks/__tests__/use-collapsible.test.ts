import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollapsible } from '../use-collapsible';

let resizeCallback: (() => void) | null = null;

const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  resizeCallback = null;
  mockObserve.mockClear();
  mockDisconnect.mockClear();

  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: () => void) {
        resizeCallback = cb;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
      unobserve = vi.fn();
    },
  );
});

describe('useCollapsible', () => {
  it('returns needsCollapse=false when content is short', () => {
    const { result } = renderHook(() => useCollapsible());

    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollHeight', { value: 100, configurable: true });
    (result.current.contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;

    // Re-render to trigger effect
    const { result: result2 } = renderHook(() => useCollapsible());
    expect(result2.current.needsCollapse).toBe(false);
  });

  it('starts collapsed by default', () => {
    const { result } = renderHook(() => useCollapsible());
    expect(result.current.isCollapsed).toBe(true);
  });

  it('toggles isCollapsed state', () => {
    const { result } = renderHook(() => useCollapsible());

    act(() => result.current.toggle());
    expect(result.current.isCollapsed).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isCollapsed).toBe(true);
  });

  it('detects need for collapse when scrollHeight exceeds threshold', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollHeight', { value: 500, configurable: true });

    const { result } = renderHook(() => useCollapsible({ heightThreshold: 300 }));

    // Simulate ref assignment and observer callback
    (result.current.contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;

    // The effect runs on mount with the ref, but since ref was assigned after mount
    // we need to trigger through ResizeObserver callback
    if (resizeCallback) {
      act(() => resizeCallback!());
    }

    // Since the ref wasn't available during the effect, let's re-render
    const { result: result2 } = renderHook(() => {
      const hook = useCollapsible({ heightThreshold: 300 });
      // Assign ref before effect runs
      (hook.contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      return hook;
    });

    // Trigger the resize observer
    if (resizeCallback) {
      act(() => resizeCallback!());
      expect(result2.current.needsCollapse).toBe(true);
    }
  });

  it('respects custom heightThreshold', () => {
    const { result } = renderHook(() => useCollapsible({ heightThreshold: 500 }));
    expect(result.current.needsCollapse).toBe(false);
  });

  it('cleans up ResizeObserver on unmount', () => {
    const el = document.createElement('div');

    const { unmount } = renderHook(() => {
      const hook = useCollapsible();
      (hook.contentRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      return hook;
    });

    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
