import { describe, it, expect, vi, afterEach } from 'vitest';
import { assetUrl } from '../asset-url';

describe('assetUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prepends default base URL', () => {
    expect(assetUrl('images/logo.png')).toBe('/images/logo.png');
  });

  it('avoids double slash when path starts with /', () => {
    expect(assetUrl('/images/logo.png')).toBe('/images/logo.png');
  });

  it('works with path without leading slash', () => {
    expect(assetUrl('favicon.ico')).toBe('/favicon.ico');
  });
});
