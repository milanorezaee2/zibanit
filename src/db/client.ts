/**
 * GEMORIA — database client.
 *
 * One SQL dialect, two drivers:
 *
 *   postgres → a real PostgreSQL server, reached through DATABASE_URL
 *   pglite   → PostgreSQL compiled to WebAssembly, running in-process
 *
 * Both are driven by the *same* Drizzle schema and the *same* SQL migration
 * files. The driver is chosen once, by `src/lib/env.ts`, and never guessed here.
 *
 * Driver packages are imported dynamically so that a production build that uses
 * PostgreSQL never loads the WebAssembly database at all — and so that a
 * development build never opens a TCP pool it does not need.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  assertProductionDatabaseSafety,
  describeTarget,
  getServerEnv,
  type DatabaseConfig,
  type DatabaseDriver,
} from '@/lib/env';
import * as schema from './schema';
import { runMigrations } from './migrate';

/**
 * The application's database surface.
 *
 * `NodePgDatabase` and `PgliteDatabase` both extend `PgDatabase` and expose an
 * identical query-builder API; the only difference is the envelope a *raw*
 * `execute()` returns, and both envelopes carry `.rows`. Declaring the surface
 * once, in terms of the driver the application was designed for, keeps
 * repositories free of casts. The PGlite handle is asserted to this type at the
 * single place where it is created — the one boundary where the difference could
 * ever matter.
 */
export type MuseumDatabase = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  readonly driver: DatabaseDriver;
  readonly db: MuseumDatabase;
  /** Safe, log-ready target description. Never contains credentials. */
  readonly target: string;
  close(): Promise<void>;
}

/**
 * Migrations are read from disk at runtime. Overridable so that a container
 * image can ship them at a different path.
 */
export function migrationsFolder(): string {
  return process.env.GEMORIA_MIGRATIONS_DIR ?? path.join(process.cwd(), 'src/db/migrations');
}

interface DatabaseGlobals {
  __gemoriaDatabase?: Promise<DatabaseHandle>;
}

// Survives Next.js hot reloads in development: without this, every recompile
// would open another PGlite instance against the same data directory.
const globals = globalThis as typeof globalThis & DatabaseGlobals;

/**
 * Opens a database handle from an explicit configuration.
 *
 * Exported (rather than hidden behind `getDatabase`) so that tests and operational
 * scripts can open a *specific* database — a temporary PGlite directory, or a
 * throwaway PostgreSQL server — without touching the memoised application handle.
 */
export async function openDatabase(
  config: DatabaseConfig,
  options: { migrate?: boolean } = {},
): Promise<DatabaseHandle> {
  const handle =
    config.driver === 'postgres'
      ? await createPostgresHandle(config.url, config.ssl)
      : await createPgliteHandle(config.pgliteDataDir);

  const shouldMigrate = options.migrate ?? config.autoMigrate;
  if (shouldMigrate) {
    await runMigrations(handle);
  }

  return handle;
}

async function createDatabase(): Promise<DatabaseHandle> {
  const env = getServerEnv();
  assertProductionDatabaseSafety(env);
  return openDatabase(env.database);
}

async function createPostgresHandle(
  url: string | undefined,
  ssl: boolean,
): Promise<DatabaseHandle> {
  if (!url) {
    throw new Error('DATABASE_URL is required for the postgres driver.');
  }

  const { Pool } = await import('pg');
  const { drizzle } = await import('drizzle-orm/node-postgres');

  const pool = new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    application_name: 'gemoria',
    ...(ssl ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  // Fail loudly and immediately rather than on the first page request.
  const probe = await pool.connect();
  probe.release();

  return {
    driver: 'postgres',
    db: drizzle(pool, { schema }),
    target: describeTarget({ driver: 'postgres', url, ssl, pgliteDataDir: '', autoMigrate: false }),
    close: async () => {
      await pool.end();
    },
  };
}

async function createPgliteHandle(dataDir: string): Promise<DatabaseHandle> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');

  // PGlite creates the leaf directory but not its parents, so a first run in a
  // clean checkout would fail with ENOENT on `.data/`. Creating it explicitly also
  // gives a clear error message if the path is not writable.
  const resolvedDataDir = path.resolve(dataDir);
  fs.mkdirSync(resolvedDataDir, { recursive: true });

  const client = new PGlite(resolvedDataDir);
  await client.waitReady;

  return {
    driver: 'pglite',
    // Same query API, different result envelope on raw execute() — normalised at
    // this single boundary. See the `MuseumDatabase` note above.
    db: drizzle(client, { schema }) as unknown as MuseumDatabase,
    target: describeTarget({
      driver: 'pglite',
      ssl: false,
      pgliteDataDir: dataDir,
      autoMigrate: false,
    }),
    close: async () => {
      await client.close();
    },
  };
}

export async function getDatabase(): Promise<DatabaseHandle> {
  globals.__gemoriaDatabase ??= createDatabase();

  try {
    return await globals.__gemoriaDatabase;
  } catch (error) {
    // Do not cache a failed initialisation: the next request should retry.
    globals.__gemoriaDatabase = undefined;
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  const pending = globals.__gemoriaDatabase;
  globals.__gemoriaDatabase = undefined;
  if (!pending) return;

  try {
    const handle = await pending;
    await handle.close();
  } catch {
    // The handle never became usable; nothing to close.
  }
}

export { schema };
