/**
 * The same compatibility suite, executed against PGlite.
 *
 * This is the engine used by development and preview. It is a real PostgreSQL
 * (18.x) compiled to WebAssembly, so "it works in PGlite" is meaningful evidence
 * — but it is *not* sufficient on its own, which is why `postgres.test.ts` runs the
 * identical assertions against a genuine server.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase, type DatabaseHandle } from '@/db/client';
import { defineDatabaseSuite } from '../helpers/database-suite';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gemoria-pglite-'));
let handle: DatabaseHandle | undefined;

defineDatabaseSuite(
  'PGlite (development / preview)',
  async () => {
    handle = await openDatabase(
      { driver: 'pglite', ssl: false, pgliteDataDir: dataDir, autoMigrate: true },
      { migrate: true },
    );
    return handle;
  },
  async () => {
    await handle?.close();
    fs.rmSync(dataDir, { recursive: true, force: true });
  },
);
