import type { FastifyPluginAsync } from 'fastify';
import { ok, paginated, buildPaginationMeta } from '../../lib/api-response.js';
import { resolveProjectDb } from '../../lib/resolve-project-db.js';
import * as prdService from './prd-analysis.service.js';
import {
  uploadPrdSchema,
  startAnalysisSchema,
  analysisHistoryQuerySchema,
} from './prd-analysis.schema.js';
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

      const db = await resolveProjectDb(app, request.params.projectId);
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
      const db = await resolveProjectDb(app, request.params.projectId);
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
      await prdService.deletePrdDocument(app.db, request.params.documentId, request.user.userId);
      return reply.send(ok(null));
    },
  );

  // Start analysis
  app.post<{ Params: { projectId: string }; Body: unknown }>(
    '/projects/:projectId/prd/analyze',
    async (request, reply) => {
      const db = await resolveProjectDb(app, request.params.projectId);
      const input = startAnalysisSchema.parse(request.body);
      const result = await prdService.startAnalysis(
        db,
        app.env,
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
      const db = await resolveProjectDb(app, request.params.projectId);
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
      const db = await resolveProjectDb(app, request.params.projectId);
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
      const analysis = await prdService.getAnalysisDetail(
        app.db,
        request.params.analysisId,
        request.user.userId,
      );
      return reply.send(ok(analysis));
    },
  );
};
