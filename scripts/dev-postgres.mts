/**
 * GEMORIA — a real PostgreSQL server for local work.
 *
 *   npm run db:server
 *
 * Development and preview use PGlite by design, but some things can only be
 * verified against a genuine server: the `pg` driver path, production migrations,
 * connection pooling and the cluster's encoding. This script boots PostgreSQL 18
 * from the `embedded-postgres` development dependency (real binaries shipped as an
 * npm package — no Docker, no system packages) with a UTF-8 cluster, creates the
 * `gemoria` database, prints a ready-to-paste DATABASE_URL, and stays in the
 * foreground until interrupted.
 *
 * Data is kept in `.pgdata/` (git-ignored) so restarts do not lose your work.
 */
import fs from 'node:fs';
import path from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const PORT = Number(process.env.GEMORIA_PG_PORT ?? 54329);
const USER = 'gemoria';
const PASSWORD = 'gemoria_local_dev_only';
const DATABASE = 'gemoria';
const DATA_DIR = path.resolve(process.cwd(), '.pgdata', 'dev');

fs.mkdirSync(DATA_DIR, { recursive: true });

const alreadyInitialised = fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'));

const server = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
  // A UTF-8 cluster is mandatory: with the default SQL_ASCII/C locale PostgreSQL
  // silently discards Persian text while tokenising. See src/db/capabilities.ts.
  initdbFlags: ['--encoding=UTF8', '--locale=C.UTF-8'],
});

if (!alreadyInitialised) {
  console.log('▶ Initialising a new PostgreSQL cluster (UTF-8)…');
  await server.initialise();
}

await server.start();

try {
  await server.createDatabase(DATABASE);
} catch {
  // Already exists — fine.
}

const url = `postgres://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}`;

console.log(
  [
    '',
    '✓ PostgreSQL is running (local development only)',
    `  data dir   : ${DATA_DIR}`,
    `  DATABASE_URL=${url}`,
    '',
    '  Next step, in another terminal:',
    `    DATABASE_URL="${url}" npm run db:migrate`,
    `    DATABASE_URL="${url}" npm start`,
    '',
    '  Press Ctrl+C to stop.',
    '',
  ].join('\n'),
);

const shutdown = async (signal: string) => {
  console.log(`\n▶ ${signal} received — stopping PostgreSQL…`);
  await server.stop();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

// Keep the process (and therefore the server) alive.
await new Promise(() => {});
