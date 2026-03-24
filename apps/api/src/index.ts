import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { loadEnv } from './config/env.js';
import { buildApp } from './app.js';
import { runMigrations } from './database/migrate.js';

async function main() {
  const env = loadEnv();

  if (env.RUN_MIGRATIONS) {
    console.log('Running auto-migrations...');
    try {
      await runMigrations({
        connectionString: env.DATABASE_URL,
        sslEnabled: env.DATABASE_SSL,
        sslCaPath: env.DATABASE_SSL_CA,
      });

      if (env.REMOTE_DATABASE_URL) {
        console.log('Running remote DB migrations...');
        try {
          await runMigrations({
            connectionString: env.REMOTE_DATABASE_URL,
            sslEnabled: env.REMOTE_DATABASE_SSL,
            sslCaPath: env.REMOTE_DATABASE_SSL_CA,
          });
        } catch (remoteErr) {
          console.warn(
            'Remote DB migration failed (non-fatal):',
            remoteErr instanceof Error ? remoteErr.message : remoteErr,
          );
        }
      }
    } catch (error) {
      console.error('Auto-migration failed:', error);
      process.exit(1);
    }
  }

  const app = await buildApp(env);

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`Server running at http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
