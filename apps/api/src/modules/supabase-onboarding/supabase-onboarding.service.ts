import type { Db } from '../../database/client.js';
import type { SupabaseProject, SupabaseOrganization } from '@context-sync/shared';
import { getSupabaseToken } from '../auth/auth.service.js';
import { testConnection } from '../../lib/test-connection.js';
import { switchToRemote, type SwitchToRemoteResult } from '../setup/setup.service.js';
import { AppError } from '../../plugins/error-handler.plugin.js';
import type { AutoSetupExistingInput, AutoSetupNewInput } from './supabase-onboarding.schema.js';

export interface CreateSetupRecovery {
  readonly recovered: true;
  readonly projectRef: string;
  readonly region: string;
  readonly error: string;
}

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

interface SupabasePoolerConfig {
  readonly database_type: string;
  readonly db_host: string;
  readonly db_port: number;
  readonly db_user: string;
  readonly db_name: string;
  readonly pool_mode: string;
}

const SUPABASE_ERROR_MAPPINGS: readonly {
  readonly pattern: RegExp;
  readonly userMessage: string;
}[] = [
  {
    pattern: /tenant or user not found/i,
    userMessage:
      'Your Supabase access token appears to be stale or invalid. Please remove your token and re-save a new one from supabase.com/dashboard/account/tokens.',
  },
  {
    pattern: /project .* not found/i,
    userMessage:
      'The specified Supabase project could not be found. Please verify the project exists in your Supabase dashboard.',
  },
];

const CONNECTION_ERROR_MAPPINGS: readonly {
  readonly pattern: RegExp;
  readonly userMessage: string;
}[] = [
  {
    pattern: /tenant or user not found/i,
    userMessage:
      'Database connection rejected by Supabase pooler. Please verify your database password is correct (Supabase Dashboard → Project Settings → Database).',
  },
  {
    pattern: /password authentication failed/i,
    userMessage:
      'Incorrect database password. You can find or reset it in Supabase Dashboard → Project Settings → Database.',
  },
  {
    pattern: /ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i,
    userMessage:
      'Could not reach the Supabase database. The project may still be initializing — please try again in a moment.',
  },
];

export function resolveConnectionErrorMessage(rawError: string): string {
  const match = CONNECTION_ERROR_MAPPINGS.find((m) => m.pattern.test(rawError));
  return match?.userMessage ?? `Connection test failed: ${rawError}`;
}

export function resolveSupabaseErrorMessage(rawMessage: string): string {
  const match = SUPABASE_ERROR_MAPPINGS.find((m) => m.pattern.test(rawMessage));
  return match?.userMessage ?? rawMessage;
}

async function supabaseFetch<T>(token: string, path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${SUPABASE_API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Failed to connect to Supabase API. Check your network connection.', 502);
  }

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
    const rawMessage = body.message ?? `Supabase API error (${response.status})`;
    throw new AppError(resolveSupabaseErrorMessage(rawMessage), response.status);
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

async function getPoolerConfig(
  token: string,
  projectRef: string,
): Promise<SupabasePoolerConfig | null> {
  try {
    const configs = await supabaseFetch<readonly SupabasePoolerConfig[]>(
      token,
      `/projects/${projectRef}/config/database/pooler`,
    );
    // API returns an array; pick the PRIMARY entry (or first available)
    return configs.find((c) => c.database_type === 'PRIMARY') ?? configs[0] ?? null;
  } catch {
    // Pooler config endpoint may not be available; fall back to manual URL
    return null;
  }
}

function buildConnectionUrlFromPooler(
  poolerConfig: SupabasePoolerConfig,
  dbPassword: string,
): string {
  const user = poolerConfig.db_user;
  const host = poolerConfig.db_host;
  const port = poolerConfig.db_port;
  const name = poolerConfig.db_name;
  return `postgresql://${user}:${encodeURIComponent(dbPassword)}@${host}:${port}/${name}`;
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

async function validateAndListProjects(token: string): Promise<readonly SupabaseProject[]> {
  try {
    return await listProjects(token);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 401) throw err;
    if (err instanceof AppError) {
      throw new AppError(`Failed to access your Supabase account. ${err.message}`, 400);
    }
    throw new AppError(
      'Supabase token validation failed. Please remove your token and re-save a new one.',
      400,
    );
  }
}

async function validateSupabaseToken(token: string): Promise<void> {
  try {
    await supabaseFetch<readonly unknown[]>(token, '/projects');
  } catch (err) {
    if (err instanceof AppError && (err.statusCode === 401 || err.statusCode === 403)) throw err;
    if (err instanceof AppError) {
      throw new AppError(`Token validation failed: ${err.message}`, 400);
    }
    throw new AppError(
      'Supabase token validation failed. Please remove your token and re-save a new one.',
      400,
    );
  }
}

async function resolveSupabaseToken(db: Db, userId: string, jwtSecret: string): Promise<string> {
  let token: string | null;
  try {
    token = await getSupabaseToken(db, userId, jwtSecret);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      'Failed to decrypt Supabase token. Try removing and re-saving your token.',
      400,
    );
  }
  if (!token) {
    throw new AppError('No Supabase access token configured. Please save your token first.', 400);
  }
  return token;
}

export async function autoSetupExisting(
  db: Db,
  userId: string,
  jwtSecret: string,
  input: AutoSetupExistingInput,
  onRemoteReady?: (tempRemoteDb: Db) => Promise<void>,
) {
  const supabaseToken = await resolveSupabaseToken(db, userId, jwtSecret);

  // Validate token and fetch projects in one call
  const projects = await validateAndListProjects(supabaseToken);
  const target = projects.find((p) => p.ref === input.supabaseProjectRef);
  if (!target) {
    throw new AppError('Supabase project not found in your account', 404);
  }

  if (target.status === 'INACTIVE' || target.status === 'PAUSED') {
    throw new AppError(
      `This Supabase project is currently ${target.status.toLowerCase()}. Please restore it from the Supabase dashboard before connecting.`,
      400,
    );
  }

  // Prefer pooler config from Supabase API for accurate host/port
  const poolerConfig = await getPoolerConfig(supabaseToken, target.ref);
  const connectionUrl = poolerConfig
    ? buildConnectionUrlFromPooler(poolerConfig, input.dbPassword)
    : buildConnectionUrl(target.ref, input.dbPassword, target.region);

  // Test connection before switching
  const testResult = await testConnection(connectionUrl, true);
  if (!testResult.success) {
    const message = testResult.error
      ? resolveConnectionErrorMessage(testResult.error)
      : 'Connection test failed. Please check your database password.';
    throw new AppError(message, 400);
  }

  return switchToRemote(connectionUrl, true, onRemoteReady);
}

export async function createAndSetup(
  db: Db,
  userId: string,
  jwtSecret: string,
  input: AutoSetupNewInput,
  onRemoteReady?: (tempRemoteDb: Db) => Promise<void>,
): Promise<SwitchToRemoteResult | CreateSetupRecovery> {
  const supabaseToken = await resolveSupabaseToken(db, userId, jwtSecret);

  // Validate token before irreversible project creation
  await validateSupabaseToken(supabaseToken);

  // Create the project on Supabase — this is irreversible
  const created = await createSupabaseProject(supabaseToken, input);

  // Try pooler config; new projects may not have it ready yet, so fall back
  const poolerConfig = await getPoolerConfig(supabaseToken, created.ref);
  const connectionUrl = poolerConfig
    ? buildConnectionUrlFromPooler(poolerConfig, created.dbPassword)
    : buildConnectionUrl(created.ref, created.dbPassword, created.region);

  // New projects may take a moment to become available.
  // We retry the connection test a few times with a short delay.
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 6_000;
  let lastError: string | null = null;

  try {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const testResult = await testConnection(connectionUrl, true);
      if (testResult.success) {
        return switchToRemote(connectionUrl, true, onRemoteReady);
      }
      lastError = testResult.error;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }

    // All retries exhausted — return recovery data instead of throwing
    return {
      recovered: true,
      projectRef: created.ref,
      region: created.region,
      error: `Database is not yet reachable: ${lastError ?? 'Connection timed out'}. The project may still be initializing — try again in a minute.`,
    };
  } catch (err) {
    // switchToRemote or unexpected failure after project creation
    const message = err instanceof Error ? err.message : 'Connection setup failed';
    return {
      recovered: true,
      projectRef: created.ref,
      region: created.region,
      error: message,
    };
  }
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
