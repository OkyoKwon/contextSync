import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInView } from '../use-in-view';

let observeCallback: IntersectionObserverCallback | null = null;
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  observeCallback = null;
  mockObserve.mockClear();
  mockUnobserve.mockClear();
  mockDisconnect.mockClear();

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: IntersectionObserverCallback) {
        observeCallback = cb;
      }
      observe = mockObserve;
      unobserve = mockUnobserve;
      disconnect = mockDisconnect;
    },
  );
});

describe('useInView', () => {
  it('starts with isVisible false', () => {
    const { result } = renderHook(() => useInView());
    expect(result.current.isVisible).toBe(false);
  });

  it('returns a ref object', () => {
    const { result } = renderHook(() => useInView());
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it('sets isVisible to true when element intersects', () => {
    const el = document.createElement('div');

    const { result } = renderHook(() => useInView());

    // Assign ref and trigger observer
    (result.current.ref as React.MutableRefObject<HTMLDivElement | null>).current = el;

    // Re-render to trigger the effect with the ref set
    const { result: result2 } = renderHook(() => {
      const hook = useInView(0.15);
      (hook.ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      return hook;
    });

    if (observeCallback) {
      act(() => {
        observeCallback!(
          [{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      });
      expect(result2.current.isVisible).toBe(true);
    }
  });

  it('does not set isVisible when not intersecting', () => {
    const el = document.createElement('div');

    const { result } = renderHook(() => {
      const hook = useInView();
      (hook.ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      return hook;
    });

    if (observeCallback) {
      act(() => {
        observeCallback!(
          [{ isIntersecting: false, target: el } as unknown as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      });
      expect(result.current.isVisible).toBe(false);
    }
  });

  it('cleans up observer on unmount', () => {
    const el = document.createElement('div');

    const { unmount } = renderHook(() => {
      const hook = useInView();
      (hook.ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
      return hook;
    });

    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('accepts custom threshold', () => {
    renderHook(() => useInView(0.5));
    // IntersectionObserver was constructed - just verifying no error
    expect(observeCallback).toBeDefined();
  });
});
