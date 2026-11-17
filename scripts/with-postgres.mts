/**
 * GEMORIA — run the PostgreSQL parity suite against a throwaway server.
 *
 *   npm run test:postgres
 *
 * Acceptance criterion: "the same migrations execute successfully against real
 * PostgreSQL". PGlite is a genuine PostgreSQL engine, but it is not the server
 * production will run. This script therefore boots a real PostgreSQL 18 server
 * from the `embedded-postgres` development dependency (real binaries, downloaded
 * as an npm package — no Docker required), creates a disposable database, runs the
 * compatibility suite through the `pg` driver, and destroys the instance.
 *
 * In CI with a managed PostgreSQL service, skip this script and simply set
 * TEST_DATABASE_URL. Both paths run the identical assertions.
 */
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import EmbeddedPostgres from 'embedded-postgres';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.GEMORIA_TEST_PG_PORT ?? 55432);
const USER = 'gemoria_test';
const PASSWORD = 'gemoria_test';
const DATABASE = 'gemoria_test';
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gemoria-pg-'));

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function main(): Promise<number> {
  log('▶ Booting a disposable PostgreSQL server for the parity suite');
  log(`  binaries : embedded-postgres (real PostgreSQL, npm)`);
  log(`  data dir : ${dataDir}`);
  log(`  port     : ${PORT}`);

  const server = new EmbeddedPostgres({
    databaseDir: dataDir,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: false,
    // A UTF-8 cluster is a hard requirement, not a convenience: with the default
    // SQL_ASCII/C locale, PostgreSQL silently discards Persian text while
    // tokenising, so full-text search would return nothing for every visitor.
    // See src/db/capabilities.ts. This is the configuration production must use.
    initdbFlags: ['--encoding=UTF8', '--locale=C.UTF-8'],
  });

  await server.initialise();
  await server.start();
  await server.createDatabase(DATABASE);

  const connectionString = `postgres://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}`;
  log(`  database : ${DATABASE}\n`);

  try {
    const vitestPath = path.join(ROOT, 'node_modules', 'vitest', 'vitest.mjs');
    const result = spawnSync(
      process.execPath,
      [vitestPath, 'run', 'tests/database/postgres.test.ts', 'tests/collection/postgres.test.ts'],
      {
        cwd: ROOT,
        stdio: 'inherit',
        env: {
          ...process.env,
          TEST_DATABASE_URL: connectionString,
          NODE_ENV: 'test',
        },
      },
    );

    return result.status ?? 1;
  } finally {
    log('\n▶ Shutting down the disposable PostgreSQL server');
    await server.stop();
    fs.rmSync(dataDir, { recursive: true, force: true });
    log('✓ Server stopped and data directory removed');
  }
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error: unknown) => {
    console.error('✗ Parity run failed to start.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
