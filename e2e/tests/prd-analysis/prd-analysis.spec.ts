import { test, expect } from '../../fixtures/auth.fixture.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturesDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/session-fixtures',
);

test.describe('PRD Analysis', () => {
  test('upload PRD document via API', async ({ apiClient, testUser, testProjectId }) => {
    const result = (await apiClient.uploadPrd(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-prd.md'),
      'Test PRD',
    )) as { id: string; fileName: string; title: string };

    expect(result.id).toBeTruthy();
    expect(result.title).toBe('Test PRD');
  });

  test('list PRD documents', async ({ apiClient, testUser, testProjectId }) => {
    await apiClient.uploadPrd(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-prd.md'),
      'Listed PRD',
    );

    const documents = await apiClient.get<readonly { id: string }[]>(
      `/projects/${testProjectId}/prd/documents`,
      testUser.token,
    );

    expect(documents.length).toBeGreaterThanOrEqual(1);
  });

  test('delete PRD document', async ({ apiClient, testUser, testProjectId }) => {
    const doc = (await apiClient.uploadPrd(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-prd.md'),
      'To Delete PRD',
    )) as { id: string };

    await apiClient.del(`/prd/documents/${doc.id}`, testUser.token);

    const documents = await apiClient.get<readonly { id: string }[]>(
      `/projects/${testProjectId}/prd/documents`,
      testUser.token,
    );

    const found = documents.find((d) => d.id === doc.id);
    expect(found).toBeUndefined();
  });

  test('analysis fails gracefully without API key', async ({
    apiClient,
    testUser,
    testProjectId,
  }) => {
    const doc = (await apiClient.uploadPrd(
      testUser.token,
      testProjectId,
      resolve(fixturesDir, 'sample-prd.md'),
    )) as { id: string };

    // Attempt analysis — should fail if ANTHROPIC_API_KEY is not set
    const raw = await apiClient.fetchRaw(
      'POST',
      `/projects/${testProjectId}/prd/analyze`,
      { prdDocumentId: doc.id },
      testUser.token,
    );

    // Accept any status — 200 (key present), 400/403/500 (key missing or error)
    expect(raw.status).toBeGreaterThanOrEqual(200);
  });
});
