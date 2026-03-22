import { http, HttpResponse } from 'msw';

// Default handlers — override per-test with server.use()
export const handlers = [
  http.post('/api/auth/refresh', () =>
    HttpResponse.json({ success: false, data: null, error: 'Not authenticated' }, { status: 401 }),
  ),
];
