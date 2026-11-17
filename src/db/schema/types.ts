/**
 * GEMORIA — column types that Drizzle does not ship built-in.
 */
import { customType } from 'drizzle-orm/pg-core';

/**
 * PostgreSQL `tsvector`.
 *
 * Present in the schema from day one so that the search column, its generated
 * expression and its GIN index are part of the first migration rather than a
 * later, riskier retrofit. Search itself is a Phase 3 feature; the storage layer
 * simply refuses to be designed around an absence.
 *
 * Compatibility note: `tsvector`, its GIN access method and `to_tsvector` are
 * core PostgreSQL. They are exercised identically against PGlite and a real
 * server by `tests/database/*` — no optional extension is involved.
 */
export const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'tsvector';
  },
});
