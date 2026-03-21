export interface KeyBinding {
  readonly key: string;
  readonly meta?: boolean;
  readonly ctrl?: boolean;
  readonly description: string;
  readonly action: () => void;
}

export function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

export function matchesBinding(e: KeyboardEvent, binding: KeyBinding): boolean {
  if (binding.meta && !e.metaKey) return false;
  if (binding.ctrl && !e.ctrlKey) return false;
  return e.key === binding.key || e.key === binding.key.toLowerCase();
}
