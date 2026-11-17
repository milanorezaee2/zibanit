/**
 * The same compatibility suite, executed against a real PostgreSQL server.
 *
 * Enabled by `TEST_DATABASE_URL`. `npm run test:postgres` boots a throwaway
 * PostgreSQL 18 server (real binaries, via `embedded-postgres`), points this suite
 * at it, and shuts it down — so the migration is proven on the engine production
 * will actually use, not only on the WebAssembly build.
 *
 * Safety: this suite deliberately resets the `public` schema of the database it is
 * given, so it refuses to run against a database whose name does not look like a
 * test database unless GEMORIA_ALLOW_NON_TEST_DB=1 is set explicitly.
 */
import { sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { openDatabase, type DatabaseHandle } from '@/db/client';
import { defineDatabaseSuite } from '../helpers/database-suite';

const url = process.env.TEST_DATABASE_URL;
const allowNonTest = process.env.GEMORIA_ALLOW_NON_TEST_DB === '1';

function isClearlyATestDatabase(connectionString: string): boolean {
  try {
    const databaseName = new URL(connectionString).pathname.replace(/^\//, '');
    return /test/i.test(databaseName);
  } catch {
    return false;
  }
}

const enabled = Boolean(url) && (allowNonTest || isClearlyATestDatabase(url!));

if (!enabled) {
  describe.skip('database compatibility — real PostgreSQL (skipped)', () => {
    it('requires TEST_DATABASE_URL pointing at a disposable test database', () => {
      expect(true).toBe(true);
    });
  });
} else {
  let handle: DatabaseHandle | undefined;

  defineDatabaseSuite(
    'real PostgreSQL server',
    async () => {
      handle = await openDatabase(
        { driver: 'postgres', url, ssl: false, pgliteDataDir: '', autoMigrate: true },
        { migrate: false },
      );

      // Start from nothing so the migration is proven, not assumed.
      await handle.db.execute(sql`drop schema if exists public cascade`);
      await handle.db.execute(sql`drop schema if exists drizzle cascade`);
      await handle.db.execute(sql`create schema public`);

      const { runMigrations } = await import('@/db/migrate');
      await runMigrations(handle);
      return handle;
    },
    async () => {
      await handle?.close();
    },
  );

  describe('real PostgreSQL — engine identity', () => {
    it('is a genuine server, not the WebAssembly build', async () => {
      const server = await openDatabase(
        { driver: 'postgres', url, ssl: false, pgliteDataDir: '', autoMigrate: true },
        { migrate: false },
      );
      const version = await server.db.execute<{ version: string }>(sql`select version()`);
      const banner = version.rows[0]?.version ?? '';
      expect(banner).toMatch(/^PostgreSQL \d+/);
      expect(banner).not.toMatch(/wasm|emscripten/i);
      await server.close();
    });
  });
}
