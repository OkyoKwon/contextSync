import { describe, it, expect } from 'vitest';
import { EXTERNAL_URLS } from '../external-urls';

describe('EXTERNAL_URLS', () => {
  it('has docs url based on GitHub Pages', () => {
    expect(EXTERNAL_URLS.docs).toBe('https://okyokwon.github.io/contextSync/docs');
  });

  it('has landing url based on GitHub Pages', () => {
    expect(EXTERNAL_URLS.landing).toBe('https://okyokwon.github.io/contextSync');
  });
});
