import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import {
  createAuthStoreMock,
  setMockAuthState,
  resetMockAuthState,
} from '../../test/mocks/auth-store.mock';
import { setupMsw } from '../../test/test-utils';

vi.mock('../../stores/auth.store', () => createAuthStoreMock());

import { prdAnalysisApi } from '../prd-analysis.api';

setupMsw();

describe('prdAnalysisApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockAuthState();
    setMockAuthState({ token: 'test-token' });
  });

  it('uploadDocument sends FormData with file', async () => {
    let wasCalled = false;
    server.use(
      http.post('/api/projects/:projectId/prd/documents', () => {
        wasCalled = true;
        return HttpResponse.json({
          success: true,
          data: { id: 'doc-1', title: 'My PRD' },
          error: null,
        });
      }),
    );

    const file = new File(['content'], 'prd.md', { type: 'text/markdown' });
    const result = await prdAnalysisApi.uploadDocument('proj-1', file, 'My PRD');

    expect(wasCalled).toBe(true);
    expect(result.data).toEqual({ id: 'doc-1', title: 'My PRD' });
  });

  it('uploadDocument without title still calls endpoint', async () => {
    let wasCalled = false;
    server.use(
      http.post('/api/projects/:projectId/prd/documents', () => {
        wasCalled = true;
        return HttpResponse.json({
          success: true,
          data: { id: 'doc-2', title: null },
          error: null,
        });
      }),
    );

    const file = new File(['content'], 'prd.md');
    await prdAnalysisApi.uploadDocument('proj-1', file);

    expect(wasCalled).toBe(true);
  });

  it('listDocuments returns documents array', async () => {
    const docs = [
      { id: 'doc-1', title: 'PRD 1' },
      { id: 'doc-2', title: 'PRD 2' },
    ];
    server.use(
      http.get('/api/projects/:projectId/prd/documents', () =>
        HttpResponse.json({ success: true, data: docs, error: null }),
      ),
    );

    const result = await prdAnalysisApi.listDocuments('proj-1');
    expect(result.data).toEqual(docs);
  });

  it('deleteDocument calls DELETE endpoint', async () => {
    let wasCalled = false;
    server.use(
      http.delete('/api/prd/documents/:documentId', () => {
        wasCalled = true;
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );

    await prdAnalysisApi.deleteDocument('doc-1');
    expect(wasCalled).toBe(true);
  });

  it('startAnalysis sends prdDocumentId in body', async () => {
    let capturedBody: any = null;
    const analysisResult = { id: 'analysis-1', status: 'completed' };
    server.use(
      http.post('/api/projects/:projectId/prd/analyze', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ success: true, data: analysisResult, error: null });
      }),
    );

    const result = await prdAnalysisApi.startAnalysis('proj-1', 'doc-1');
    expect(capturedBody).toEqual({ prdDocumentId: 'doc-1' });
    expect(result.data).toEqual(analysisResult);
  });

  it('getLatestAnalysis returns analysis or null', async () => {
    const analysis = { id: 'analysis-1', score: 85 };
    server.use(
      http.get('/api/projects/:projectId/prd/analysis/latest', () =>
        HttpResponse.json({ success: true, data: analysis, error: null }),
      ),
    );

    const result = await prdAnalysisApi.getLatestAnalysis('proj-1');
    expect(result.data).toEqual(analysis);
  });

  it('getAnalysisHistory builds query params correctly', async () => {
    let capturedUrl = '';
    server.use(
      http.get('/api/projects/:projectId/prd/analysis/history', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ success: true, data: [], error: null });
      }),
    );

    await prdAnalysisApi.getAnalysisHistory('proj-1', 2, 10);
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('limit')).toBe('10');
  });

  it('getAnalysisDetail returns analysis with requirements', async () => {
    const detail = { id: 'analysis-1', requirements: [{ id: 'r1' }] };
    server.use(
      http.get('/api/prd/analysis/:analysisId', () =>
        HttpResponse.json({ success: true, data: detail, error: null }),
      ),
    );

    const result = await prdAnalysisApi.getAnalysisDetail('analysis-1');
    expect(result.data).toEqual(detail);
  });

  it('throws on server error', async () => {
    server.use(
      http.get('/api/projects/:projectId/prd/documents', () =>
        HttpResponse.json({ error: 'Internal error' }, { status: 500 }),
      ),
    );

    await expect(prdAnalysisApi.listDocuments('proj-1')).rejects.toThrow('Internal error');
  });

  it('throws on server error for POST endpoints', async () => {
    server.use(
      http.post('/api/projects/:projectId/prd/analyze', () =>
        HttpResponse.json({ error: 'Analysis failed' }, { status: 500 }),
      ),
    );

    await expect(prdAnalysisApi.startAnalysis('proj-1', 'doc-1')).rejects.toThrow(
      'Analysis failed',
    );
  });
});
