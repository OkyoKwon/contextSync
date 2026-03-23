import type { FastifyPluginAsync } from 'fastify';
import { ok, fail, paginated, buildPaginationMeta } from '../../lib/api-response.js';
import { getUserApiKey } from '../auth/auth.service.js';
import * as prdService from './prd-analysis.service.js';
import {
  uploadPrdSchema,
  startAnalysisSchema,
  analysisHistoryQuerySchema,
} from './prd-analysis.schema.js';
import { findPrdDocumentById, findPrdAnalysisById } from './prd-analysis.repository.js';
import { NotFoundError } from '../../plugins/error-handler.plugin.js';
import { SUPPORTED_PRD_EXTENSIONS, MAX_PRD_FILE_SIZE } from '@context-sync/shared';
import { extname } from 'node:path';

export const prdAnalysisRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  // Upload PRD document (multipart)
  app.post<{ Params: { projectId: string } }>(
    '/projects/:projectId/prd/documents',
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ success: false, data: null, error: 'No file uploaded' });
      }

      const ext = extname(data.filename).toLowerCase();
      if (!SUPPORTED_PRD_EXTENSIONS.includes(ext as (typeof SUPPORTED_PRD_EXTENSIONS)[number])) {
        return reply.status(400).send({
          success: false,
          data: null,
          error: `Unsupported file type: ${ext}. Supported: ${SUPPORTED_PRD_EXTENSIONS.join(', ')}`,
        });
      }

      const buffer = await data.toBuffer();
      if (buffer.length > MAX_PRD_FILE_SIZE) {
        return reply.status(400).send({
          success: false,
          data: null,
          error: `File exceeds maximum size of ${MAX_PRD_FILE_SIZE / 1024}KB`,
        });
      }

      const content = buffer.toString('utf-8');
      const fields = data.fields as Record<string, { value?: string } | undefined>;
      const titleField = fields['title'];
      const title = titleField?.value;

      const parsedInput = uploadPrdSchema.parse({ title });

      const db = await app.resolveDb(request.params.projectId);
      const document = await prdService.uploadPrdDocument(
        db,
        request.params.projectId,
        request.user.userId,
        data.filename,
        content,
        parsedInput.title,
      );

      return reply.status(201).send(ok(document));
    },
  );

  // List PRD documents
  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/prd/documents',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
      const documents = await prdService.listPrdDocuments(
        db,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(documents));
    },
  );

  // Delete PRD document
  app.delete<{ Params: { documentId: string } }>(
    '/prd/documents/:documentId',
    async (request, reply) => {
      const { documentId } = request.params;
      let db = app.localDb;
      let doc = await findPrdDocumentById(db, documentId);
      if (!doc && app.remoteDb) {
        db = app.remoteDb;
        doc = await findPrdDocumentById(db, documentId);
      }
      if (!doc) throw new NotFoundError('PRD Document');

      await prdService.deletePrdDocument(db, documentId, request.user.userId);
      return reply.send(ok(null));
    },
  );

  // Start analysis
  app.post<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId/prd/analyze',
    async (request, reply) => {
      const userApiKey = await getUserApiKey(app.localDb, request.user.userId);
      const apiKey = userApiKey ?? app.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return reply
          .status(400)
          .send(
            fail('Anthropic API Key가 설정되지 않았습니다. Settings에서 API Key를 설정해주세요.'),
          );
      }

      const db = await app.resolveDb(request.params.projectId);
      const input = startAnalysisSchema.parse(request.body);
      const result = await prdService.startAnalysis(
        db,
        apiKey,
        app.env.ANTHROPIC_MODEL,
        request.params.projectId,
        request.user.userId,
        input.prdDocumentId,
      );
      return reply.send(ok(result));
    },
  );

  // Get latest analysis
  app.get<{ Params: { projectId: string } }>(
    '/projects/:projectId/prd/analysis/latest',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
      const analysis = await prdService.getLatestAnalysis(
        db,
        request.params.projectId,
        request.user.userId,
      );
      return reply.send(ok(analysis));
    },
  );

  // Get analysis history
  app.get<{ Params: { projectId: string }; Querystring: Record<string, string> }>(
    '/projects/:projectId/prd/analysis/history',
    async (request, reply) => {
      const db = await app.resolveDb(request.params.projectId);
      const query = analysisHistoryQuerySchema.parse(request.query);
      const result = await prdService.getAnalysisHistory(
        db,
        request.params.projectId,
        request.user.userId,
        query.page,
        query.limit,
      );
      const meta = buildPaginationMeta(result.total, query.page, query.limit);
      return reply.send(paginated(result.entries, meta));
    },
  );

  // Get analysis detail
  app.get<{ Params: { analysisId: string } }>(
    '/prd/analysis/:analysisId',
    async (request, reply) => {
      const { analysisId } = request.params;
      let db = app.localDb;
      let analysis = await findPrdAnalysisById(db, analysisId);
      if (!analysis && app.remoteDb) {
        db = app.remoteDb;
        analysis = await findPrdAnalysisById(db, analysisId);
      }
      if (!analysis) throw new NotFoundError('PRD Analysis');

      const detail = await prdService.getAnalysisDetail(db, analysisId, request.user.userId);
      return reply.send(ok(detail));
    },
  );
};
