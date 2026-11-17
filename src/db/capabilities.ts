/**
 * GEMORIA — database capability probes.
 *
 * The migration succeeds on any PostgreSQL cluster. Whether *Persian text search*
 * works is a different question, and it depends on a property of the cluster that
 * no migration can set: its encoding and ctype.
 *
 * Measured in this project (PostgreSQL 18.6):
 *
 *   cluster initialised with default SQL_ASCII / ctype=C
 *       → to_tsvector('simple', 'زمرد موزو') returns an empty document
 *       → a Persian visitor types «زمرد» and the museum finds nothing
 *
 *   cluster initialised with --locale=C.UTF-8 --encoding=UTF8
 *       → 'زمرد':1 'موزو':2 'کلمبیا':3
 *       → search works
 *
 * PGlite ships UTF-8, so the defect is invisible during development and only
 * appears on a mis-provisioned production cluster. This module exists so that the
 * requirement is *checked*, reported by `/api/health` and `npm run db:doctor`, and
 * refuses to be forgotten. The parity suite in `tests/` asserts the same
 * behaviour on a real server.
 */
import { sql } from 'drizzle-orm';
import type { DatabaseHandle } from './client';

export interface PersianTextSearchCapability {
  /** True when PostgreSQL tokenises Persian text instead of discarding it. */
  readonly supported: boolean;
  readonly encoding: string;
  readonly collation: string | null;
  readonly ctype: string | null;
  /** The lexemes PostgreSQL produced for the probe word, verbatim. */
  readonly sample: string;
  /** Human-readable explanation, safe to display in the dashboard. */
  readonly detail: string;
}

const PROBE_WORD = 'زمرد';

export async function checkPersianTextSearch(
  handle: DatabaseHandle,
): Promise<PersianTextSearchCapability> {
  let encoding = 'unknown';
  let collation: string | null = null;
  let ctype: string | null = null;

  try {
    const info = await handle.db.execute<{
      encoding: string;
      collation: string | null;
      ctype: string | null;
    }>(sql`select pg_encoding_to_char(encoding) as encoding,
                  datcollate as collation,
                  datctype as ctype
           from pg_database where datname = current_database()`);
    const row = info.rows[0];
    if (row) {
      encoding = row.encoding;
      collation = row.collation;
      ctype = row.ctype;
    }
  } catch {
    // Older or restricted servers may hide pg_database; the probe below still runs.
  }

  let sample = '';
  let supported = false;

  try {
    const result = await handle.db.execute<{ document: string }>(
      sql`select to_tsvector('simple', ${PROBE_WORD})::text as document`,
    );
    sample = result.rows[0]?.document ?? '';
    supported = sample.includes(PROBE_WORD);
  } catch {
    supported = false;
  }

  const detail = supported
    ? `PostgreSQL tokenises Persian text (encoding ${encoding}).`
    : `PostgreSQL discarded Persian text while tokenising (encoding ${encoding}, ctype ${ctype ?? 'unknown'}). ` +
      'The cluster must be initialised with a UTF-8 encoding and a UTF-8 ctype ' +
      '(for example `initdb --encoding=UTF8 --locale=C.UTF-8`). Persian full-text search cannot work otherwise.';

  return { supported, encoding, collation, ctype, sample, detail };
}
