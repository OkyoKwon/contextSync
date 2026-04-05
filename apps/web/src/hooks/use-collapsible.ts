import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCollapsibleOptions {
  readonly heightThreshold?: number;
}

interface UseCollapsibleResult {
  readonly contentRef: React.RefObject<HTMLDivElement | null>;
  readonly isCollapsed: boolean;
  readonly needsCollapse: boolean;
  readonly toggle: () => void;
}

export function useCollapsible({
  heightThreshold = 300,
}: UseCollapsibleOptions = {}): UseCollapsibleResult {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [needsCollapse, setNeedsCollapse] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      setNeedsCollapse(el.scrollHeight > heightThreshold);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [heightThreshold]);

  const toggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return { contentRef, isCollapsed, needsCollapse, toggle };
}
