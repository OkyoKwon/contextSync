import { useEffect } from 'react';
import type { KeyBinding } from '../lib/keyboard';
import { isInputElement, matchesBinding } from '../lib/keyboard';

export function useKeyboardShortcuts(bindings: readonly KeyBinding[]) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Allow Escape everywhere
      if (e.key === 'Escape') return;

      for (const binding of bindings) {
        if (matchesBinding(e, binding)) {
          // For meta/ctrl shortcuts, always fire. For plain keys, skip if in input
          if (!binding.meta && !binding.ctrl && isInputElement(e.target)) {
            continue;
          }
          e.preventDefault();
          binding.action();
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bindings]);
}
