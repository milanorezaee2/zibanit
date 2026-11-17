/**
 * The collection suite against PGlite — the engine development and preview run on.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase, type DatabaseHandle } from '@/db/client';
import { defineCollectionSuite } from '../helpers/collection-suite';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gemoria-collection-pglite-'));
let handle: DatabaseHandle | undefined;

defineCollectionSuite(
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
