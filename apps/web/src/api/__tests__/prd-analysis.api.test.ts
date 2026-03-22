import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    post: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  },
}));

import { prdAnalysisApi } from '../prd-analysis.api';
import { api } from '../client';

describe('prdAnalysisApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uploadDocument sends FormData with file', async () => {
    const file = new File(['content'], 'prd.md', { type: 'text/markdown' });
    await prdAnalysisApi.uploadDocument('proj-1', file, 'My PRD');

    expect(api.post).toHaveBeenCalledWith('/projects/proj-1/prd/documents', expect.any(FormData));
    const formData = vi.mocked(api.post).mock.calls[0]![1] as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('title')).toBe('My PRD');
  });

  it('uploadDocument without title omits title field', async () => {
    const file = new File(['content'], 'prd.md');
    await prdAnalysisApi.uploadDocument('proj-1', file);

    const formData = vi.mocked(api.post).mock.calls[0]![1] as FormData;
    expect(formData.get('title')).toBeNull();
  });

  it('listDocuments calls GET', async () => {
    await prdAnalysisApi.listDocuments('proj-1');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/prd/documents');
  });

  it('deleteDocument calls DELETE', async () => {
    await prdAnalysisApi.deleteDocument('doc-1');
    expect(api.delete).toHaveBeenCalledWith('/prd/documents/doc-1');
  });

  it('startAnalysis calls POST with prdDocumentId', async () => {
    await prdAnalysisApi.startAnalysis('proj-1', 'doc-1');
    expect(api.post).toHaveBeenCalledWith('/projects/proj-1/prd/analyze', {
      prdDocumentId: 'doc-1',
    });
  });

  it('getLatestAnalysis calls GET', async () => {
    await prdAnalysisApi.getLatestAnalysis('proj-1');
    expect(api.get).toHaveBeenCalledWith('/projects/proj-1/prd/analysis/latest');
  });

  it('getAnalysisHistory builds query params', async () => {
    await prdAnalysisApi.getAnalysisHistory('proj-1', 2, 10);
    const callArg = vi.mocked(api.get).mock.calls[0]![0];
    expect(callArg).toContain('page=2');
    expect(callArg).toContain('limit=10');
  });

  it('getAnalysisDetail calls GET with analysisId', async () => {
    await prdAnalysisApi.getAnalysisDetail('analysis-1');
    expect(api.get).toHaveBeenCalledWith('/prd/analysis/analysis-1');
  });
});
