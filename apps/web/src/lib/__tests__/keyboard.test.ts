import { describe, it, expect } from 'vitest';
import { isInputElement, matchesBinding } from '../keyboard';
import type { KeyBinding } from '../keyboard';

describe('isInputElement', () => {
  it('returns false for null target', () => {
    expect(isInputElement(null)).toBe(false);
  });

  it('returns false for non-HTMLElement target', () => {
    const textNode = document.createTextNode('text');
    expect(isInputElement(textNode)).toBe(false);
  });

  it('returns true for input element', () => {
    const input = document.createElement('input');
    expect(isInputElement(input)).toBe(true);
  });

  it('returns true for textarea element', () => {
    const textarea = document.createElement('textarea');
    expect(isInputElement(textarea)).toBe(true);
  });

  it('returns true for select element', () => {
    const select = document.createElement('select');
    expect(isInputElement(select)).toBe(true);
  });

  it('returns falsy for a regular div', () => {
    const div = document.createElement('div');
    expect(isInputElement(div)).toBeFalsy();
  });
});

describe('matchesBinding', () => {
  const makeEvent = (overrides: Partial<KeyboardEvent> = {}): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      key: (overrides.key as string) ?? 'k',
      metaKey: ((overrides as Record<string, unknown>).metaKey as boolean) ?? false,
      ctrlKey: ((overrides as Record<string, unknown>).ctrlKey as boolean) ?? false,
    });
  };

  const baseBinding: KeyBinding = {
    key: 'k',
    description: 'test',
    action: () => {},
  };

  it('returns true when key matches', () => {
    const event = makeEvent({ key: 'k' });
    expect(matchesBinding(event, baseBinding)).toBe(true);
  });

  it('returns false when meta is required but not pressed', () => {
    const event = makeEvent({ key: 'k' });
    const binding: KeyBinding = { ...baseBinding, meta: true };
    expect(matchesBinding(event, binding)).toBe(false);
  });

  it('returns false when ctrl is required but not pressed', () => {
    const event = makeEvent({ key: 'k' });
    const binding: KeyBinding = { ...baseBinding, ctrl: true };
    expect(matchesBinding(event, binding)).toBe(false);
  });
});
