import pg from 'pg';

export interface ConnectionTestResult {
  readonly success: boolean;
  readonly latencyMs: number;
  readonly version: string | null;
  readonly error: string | null;
}

export async function testConnection(
  connectionUrl: string,
  sslEnabled: boolean,
): Promise<ConnectionTestResult> {
  const pool = new pg.Pool({
    connectionString: connectionUrl,
    max: 1,
    connectionTimeoutMillis: 10_000,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  });

  const start = Date.now();
  try {
    const result = await pool.query('SELECT version()');
    const latencyMs = Date.now() - start;
    const version = result.rows[0]?.version ?? null;
    return { success: true, latencyMs, version, error: null };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, latencyMs, version: null, error: message };
  } finally {
    await pool.end().catch(() => {});
  }
}
