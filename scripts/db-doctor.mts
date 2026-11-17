/**
 * GEMORIA — database doctor.
 *
 *   npm run db:doctor
 *
 * Answers, in one screen, the questions asked during an incident or a deployment
 * review: which database am I connected to, is it reachable, is the schema there,
 * and are the migrations current? Exits non-zero if anything is wrong, so it can
 * gate a release.
 */
import { sql } from 'drizzle-orm';
import { checkPersianTextSearch } from '../src/db/capabilities';
import { openDatabase } from '../src/db/client';
import { getMigrationStatus, hasSchema } from '../src/db/migrate';
import { assertProductionDatabaseSafety, describeTarget, getServerEnv } from '../src/lib/env';

async function main(): Promise<void> {
  const env = getServerEnv();
  assertProductionDatabaseSafety(env);

  console.log('▶ GEMORIA database doctor\n');
  console.log(`  environment  ${env.nodeEnv}`);
  console.log(`  driver       ${env.database.driver}`);
  console.log(`  target       ${describeTarget(env.database)}`);
  console.log(`  auto-migrate ${env.database.autoMigrate ? 'on' : 'off'}\n`);

  const handle = await openDatabase(env.database, { migrate: false });
  let healthy = true;

  try {
    const startedAt = performance.now();
    const version = await handle.db.execute<{ version: string }>(sql`select version()`);
    const latency = Math.round(performance.now() - startedAt);

    console.log(`  reachable    yes (${latency} ms)`);
    console.log(`  server       ${(version.rows[0]?.version ?? 'unknown').split(' on ')[0]}`);

    const schemaReady = await hasSchema(handle);
    const migrations = await getMigrationStatus(handle);

    console.log(`  schema       ${schemaReady ? 'complete' : 'INCOMPLETE'}`);
    console.log(`  migrations   ${migrations.applied}/${migrations.available} applied`);
    if (migrations.lastAppliedAt) console.log(`  last applied ${migrations.lastAppliedAt}`);

    const tables = await handle.db.execute<{ count: number }>(
      sql`select count(*)::int as count from information_schema.tables where table_schema = 'public'`,
    );
    console.log(`  tables       ${tables.rows[0]?.count ?? 0}`);

    const textSearch = await checkPersianTextSearch(handle);
    console.log(`  encoding     ${textSearch.encoding} (ctype ${textSearch.ctype ?? 'unknown'})`);
    console.log(`  persian FTS  ${textSearch.supported ? 'supported' : 'UNSUPPORTED'}`);

    const problems: string[] = [];
    if (!schemaReady || !migrations.upToDate) {
      problems.push('Schema is incomplete or migrations are pending: run `npm run db:migrate`.');
    }
    if (!textSearch.supported) {
      problems.push(textSearch.detail);
    }

    console.log('');
    if (problems.length > 0) {
      healthy = false;
      for (const problem of problems) console.log(`✗ ${problem}`);
    } else {
      console.log('✓ Database is healthy.');
    }
  } catch (error) {
    healthy = false;
    console.error('✗ Cannot query the database.');
    console.error(error instanceof Error ? error.message : error);
  } finally {
    await handle.close();
  }

  if (!healthy) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error('✗ Doctor failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
