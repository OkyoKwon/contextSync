import { loadEnv } from './config/env.js';
import { buildApp } from './app.js';
import { runMigrations } from './database/migrate.js';

async function main() {
  const env = loadEnv();

  if (env.RUN_MIGRATIONS && env.DEPLOYMENT_MODE !== 'team-member') {
    console.log('Running auto-migrations...');
    try {
      await runMigrations({
        connectionString: env.DATABASE_URL,
        deploymentMode: env.DEPLOYMENT_MODE,
        sslEnabled: env.DATABASE_SSL,
        sslCaPath: env.DATABASE_SSL_CA,
      });
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
