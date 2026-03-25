import { http, HttpResponse } from 'msw';

// Default handlers — override per-test with server.use()
// These provide reasonable defaults so tests don't fail on unhandled requests.
export const handlers = [
  // Auth
  http.post('/api/auth/refresh', () =>
    HttpResponse.json({ success: false, data: null, error: 'Not authenticated' }, { status: 401 }),
  ),
  http.post('/api/auth/identify', () =>
    HttpResponse.json({
      success: true,
      data: {
        token: 'test-token',
        user: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
      },
      error: null,
    }),
  ),
  http.get('/api/auth/me', () =>
    HttpResponse.json({
      success: true,
      data: { id: 'user-1', name: 'Test User', email: 'test@test.com' },
      error: null,
    }),
  ),
  http.get('/api/auth/me/quota', () =>
    HttpResponse.json({
      success: true,
      data: { used: 0, limit: 100, remaining: 100 },
      error: null,
    }),
  ),

  // Projects
  http.get('/api/projects', () => HttpResponse.json({ success: true, data: [], error: null })),
  http.get('/api/projects/:projectId', () =>
    HttpResponse.json({
      success: true,
      data: {
        id: 'proj-1',
        name: 'Test Project',
        ownerId: 'user-1',
        collaboratorCount: 0,
        isTeam: false,
      },
      error: null,
    }),
  ),

  // Sessions
  http.get('/api/projects/:projectId/sessions', () =>
    HttpResponse.json({ success: true, data: [], error: null }),
  ),
  http.get('/api/projects/:projectId/timeline', () =>
    HttpResponse.json({ success: true, data: [], error: null }),
  ),
  http.get('/api/projects/:projectId/stats', () =>
    HttpResponse.json({
      success: true,
      data: { totalSessions: 0, activeSessions: 0, totalTokens: 0, totalCost: 0 },
      error: null,
    }),
  ),
  http.get('/api/projects/:projectId/team-stats', () =>
    HttpResponse.json({ success: true, data: [], error: null }),
  ),
  http.get('/api/projects/:projectId/token-usage', () =>
    HttpResponse.json({
      success: true,
      data: {
        period: '30d',
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheCreationTokens: 0,
        totalCacheReadTokens: 0,
        totalCost: 0,
        dailyUsage: [],
      },
      error: null,
    }),
  ),

  // Local sessions
  http.get('/api/sessions/local/:sessionId', () =>
    HttpResponse.json({
      success: true,
      data: { id: 'local-1', title: 'Local Session', projectPath: '/tmp', messageCount: 0 },
      error: null,
    }),
  ),

  // Conflicts
  http.get('/api/projects/:projectId/conflicts', () =>
    HttpResponse.json({ success: true, data: [], error: null }),
  ),

  // Setup
  http.get('/api/setup/status', () =>
    HttpResponse.json({
      success: true,
      data: { databaseMode: 'local', provider: 'local', host: 'localhost', remoteUrl: null },
      error: null,
    }),
  ),
];
