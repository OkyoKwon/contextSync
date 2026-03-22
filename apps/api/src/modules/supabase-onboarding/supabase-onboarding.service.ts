import type { Db } from '../../database/client.js';
import type { SupabaseProject, SupabaseOrganization } from '@context-sync/shared';
import { getSupabaseToken } from '../auth/auth.service.js';
import { saveConfig, testConnection } from '../db-config/db-config.service.js';
import { AppError } from '../../plugins/error-handler.plugin.js';
import type { AutoSetupExistingInput, AutoSetupNewInput } from './supabase-onboarding.schema.js';

const SUPABASE_API_BASE = 'https://api.supabase.com/v1';

interface SupabaseApiProject {
  readonly id: string;
  readonly ref: string;
  readonly name: string;
  readonly region: string;
  readonly status: string;
  readonly created_at: string;
  readonly organization_id: string;
}

interface SupabaseApiOrganization {
  readonly id: string;
  readonly name: string;
}

interface SupabaseCreateProjectResponse {
  readonly id: string;
  readonly ref: string;
  readonly name: string;
  readonly region: string;
  readonly status: string;
  readonly created_at: string;
}

async function supabaseFetch<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${SUPABASE_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    throw new AppError(
      'Invalid or expired Supabase access token. Generate a new one at supabase.com/dashboard/account/tokens',
      401,
    );
  }

  if (response.status === 429) {
    throw new AppError(
      'Too many requests to Supabase API. Please wait a moment and try again.',
      429,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    const message = body.message ?? `Supabase API error (${response.status})`;
    throw new AppError(message, response.status);
  }

  return response.json() as Promise<T>;
}

function toSupabaseProject(raw: SupabaseApiProject): SupabaseProject {
  return {
    ref: raw.ref,
    name: raw.name,
    region: raw.region,
    status: raw.status,
    createdAt: raw.created_at,
  };
}

export async function listProjects(supabaseToken: string): Promise<readonly SupabaseProject[]> {
  const projects = await supabaseFetch<readonly SupabaseApiProject[]>(supabaseToken, '/projects');
  return projects.map(toSupabaseProject);
}

export async function listOrganizations(
  supabaseToken: string,
): Promise<readonly SupabaseOrganization[]> {
  const orgs = await supabaseFetch<readonly SupabaseApiOrganization[]>(
    supabaseToken,
    '/organizations',
  );
  return orgs.map((o) => ({ id: o.id, name: o.name }));
}

export function buildConnectionUrl(projectRef: string, dbPassword: string, region: string): string {
  return `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
}

export async function createSupabaseProject(
  supabaseToken: string,
  input: AutoSetupNewInput,
): Promise<SupabaseProject & { readonly dbPassword: string }> {
  const result = await supabaseFetch<SupabaseCreateProjectResponse>(supabaseToken, '/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      db_pass: input.dbPassword,
      region: input.region,
      organization_id: input.organizationId,
    }),
  });

  return {
    ref: result.ref,
    name: result.name,
    region: result.region,
    status: result.status,
    createdAt: result.created_at,
    dbPassword: input.dbPassword,
  };
}

async function resolveSupabaseToken(db: Db, userId: string, jwtSecret: string): Promise<string> {
  const token = await getSupabaseToken(db, userId, jwtSecret);
  if (!token) {
    throw new AppError('No Supabase access token configured. Please save your token first.', 400);
  }
  return token;
}

export async function autoSetupExisting(
  db: Db,
  userId: string,
  projectId: string,
  jwtSecret: string,
  input: AutoSetupExistingInput,
) {
  const supabaseToken = await resolveSupabaseToken(db, userId, jwtSecret);

  // Find the project in user's Supabase account to get region
  const projects = await listProjects(supabaseToken);
  const target = projects.find((p) => p.ref === input.supabaseProjectRef);
  if (!target) {
    throw new AppError('Supabase project not found in your account', 404);
  }

  const connectionUrl = buildConnectionUrl(target.ref, input.dbPassword, target.region);

  // Test connection before saving
  const testResult = await testConnection(connectionUrl, true);
  if (!testResult.success) {
    throw new AppError(
      testResult.error ?? 'Connection test failed. Please check your database password.',
      400,
    );
  }

  return saveConfig(db, projectId, userId, connectionUrl, 'supabase', true, jwtSecret);
}

export async function createAndSetup(
  db: Db,
  userId: string,
  projectId: string,
  jwtSecret: string,
  input: AutoSetupNewInput,
) {
  const supabaseToken = await resolveSupabaseToken(db, userId, jwtSecret);

  // Create the project on Supabase
  const created = await createSupabaseProject(supabaseToken, input);

  const connectionUrl = buildConnectionUrl(created.ref, created.dbPassword, created.region);

  // New projects may take a moment to become available.
  // We retry the connection test a few times with a short delay.
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 6_000;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const testResult = await testConnection(connectionUrl, true);
    if (testResult.success) {
      return saveConfig(db, projectId, userId, connectionUrl, 'supabase', true, jwtSecret);
    }
    lastError = testResult.error;
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new AppError(
    `Supabase project created but database is not yet reachable: ${lastError ?? 'Connection timed out'}. The project may still be initializing — try again in a minute.`,
    504,
  );
}

export async function getProjectsForUser(
  db: Db,
  userId: string,
  jwtSecret: string,
): Promise<readonly SupabaseProject[]> {
  const supabaseToken = await resolveSupabaseToken(db, userId, jwtSecret);
  return listProjects(supabaseToken);
}

export async function getOrganizationsForUser(
  db: Db,
  userId: string,
  jwtSecret: string,
): Promise<readonly SupabaseOrganization[]> {
  const supabaseToken = await resolveSupabaseToken(db, userId, jwtSecret);
  return listOrganizations(supabaseToken);
}
