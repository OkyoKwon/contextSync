import { describe, it, expect } from 'vitest';
import { buildGitHubAuthUrl } from '../github-oauth.client.js';

describe('GitHub OAuth', () => {
  describe('buildGitHubAuthUrl', () => {
    it('should build correct OAuth URL with client ID and redirect URI', () => {
      const url = buildGitHubAuthUrl('test-client-id', 'http://localhost:5173/auth/callback');

      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=http');
      expect(url).toContain('scope=read%3Auser+user%3Aemail');
    });

    it('should encode redirect URI properly', () => {
      const url = buildGitHubAuthUrl('id', 'http://example.com/callback?test=1');

      expect(url).toContain('redirect_uri=http%3A%2F%2Fexample.com%2Fcallback%3Ftest%3D1');
    });
  });
});
