/**
 * GEMORIA — apply database migrations.
 *
 *   npm run db:migrate
 *
 * Runs against whatever `src/lib/env.ts` resolves: PGlite in development, a real
 * PostgreSQL server in production (via DATABASE_URL). In production this is a
 * deliberate deployment step, executed before the web server starts — the server
 * itself never migrates.
 *
 * Exits non-zero on failure so a deployment pipeline stops.
 */
import { closeDatabase, openDatabase } from '../src/db/client';
import { getMigrationStatus, hasSchema, runMigrations } from '../src/db/migrate';
import { assertProductionDatabaseSafety, describeTarget, getServerEnv } from '../src/lib/env';

async function main(): Promise<void> {
  const env = getServerEnv();
  assertProductionDatabaseSafety(env);

  console.log(`▶ GEMORIA migrations`);
  console.log(`  environment : ${env.nodeEnv}`);
  console.log(`  driver      : ${env.database.driver}`);
  console.log(`  target      : ${describeTarget(env.database)}`);

  const handle = await openDatabase(env.database, { migrate: false });

  try {
    const before = await getMigrationStatus(handle);
    console.log(`  pending     : ${Math.max(before.available - before.applied, 0)}`);

    await runMigrations(handle);

    const after = await getMigrationStatus(handle);
    const schemaReady = await hasSchema(handle);

    console.log(`  applied     : ${after.applied}/${after.available}`);
    console.log(`  schema      : ${schemaReady ? 'complete (8 tables)' : 'INCOMPLETE'}`);

    if (!after.upToDate || !schemaReady) {
      console.error('✗ Migration finished but the database is not in the expected state.');
      process.exitCode = 1;
      return;
    }

    console.log('✓ Database is up to date.');
  } finally {
    await handle.close();
    await closeDatabase();
  }
}

main().catch((error: unknown) => {
  console.error('✗ Migration failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
