/**
 * Resolves the database a read should use.
 *
 * Public pages call a query without arguments and get the application handle. The
 * parity suites open their own temporary database and pass it in, so the very same
 * query code is exercised against PGlite and against a real PostgreSQL server —
 * not a copy of it.
 */
import { getDatabase, type MuseumDatabase } from '@/db/client';

export async function resolveDb(db?: MuseumDatabase): Promise<MuseumDatabase> {
  if (db) return db;
  return (await getDatabase()).db;
}
