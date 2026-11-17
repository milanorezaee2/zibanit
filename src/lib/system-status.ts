/**
 * GEMORIA — system status.
 *
 * One implementation, two audiences:
 *
 *   /api/health            machine-readable JSON for uptime checks and deployment
 *                          gates. Deliberately free of internal detail.
 *   /admin                 the same facts, rendered for a museum administrator.
 *
 * Neither audience ever sees a credential: `describeTarget` redacts the password
 * and query string, and driver errors are reduced to a coarse category here
 * rather than being echoed to the caller.
 */
import { sql } from 'drizzle-orm';
import { APP_PHASE, APP_VERSION } from '@/config/app';
import { getDatabase } from '@/db/client';
import { checkPersianTextSearch, type PersianTextSearchCapability } from '@/db/capabilities';
import { countMigrationFiles, getMigrationStatus, hasSchema, type MigrationStatus } from '@/db/migrate';
import { describeTarget, getServerEnv } from '@/lib/env';

export type HealthState = 'ok' | 'degraded' | 'error';

export interface DatabaseStatus {
  readonly driver: 'pglite' | 'postgres';
  readonly target: string;
  readonly reachable: boolean;
  readonly latencyMs: number | null;
  readonly schemaReady: boolean;
  readonly migrations: MigrationStatus;
  /** Coarse, non-identifying failure category. Details go to the server log. */
  readonly error: 'connection_failed' | 'query_failed' | 'migrations_missing' | null;
}

export interface Capabilities {
  readonly persianTextSearch: PersianTextSearchCapability;
}

export interface SystemStatus {
  readonly status: HealthState;
  readonly application: {
    readonly name: 'gemoria';
    readonly nameFa: string;
    readonly version: string;
    readonly phase: number;
    readonly phaseName: string;
    readonly environment: string;
  };
  readonly database: DatabaseStatus;
  readonly capabilities: Capabilities;
  readonly checkedAt: string;
}

const APP_NAME_FA = 'گموریا';

export async function getSystemStatus(): Promise<SystemStatus> {
  const env = getServerEnv();
  const checkedAt = new Date().toISOString();

  const application = {
    name: 'gemoria' as const,
    nameFa: APP_NAME_FA,
    version: APP_VERSION,
    phase: APP_PHASE.number,
    phaseName: APP_PHASE.name,
    environment: env.nodeEnv,
  };

  let database: DatabaseStatus;
  let capabilities: Capabilities = {
    persianTextSearch: {
      supported: false,
      encoding: 'unknown',
      collation: null,
      ctype: null,
      sample: '',
      detail: 'Not checked: the database is unreachable.',
    },
  };

  try {
    const handle = await getDatabase();
    const startedAt = performance.now();
    await handle.db.execute(sql`select 1`);
    const latencyMs = Math.round(performance.now() - startedAt);

    const schemaReady = await hasSchema(handle);
    const migrations = await getMigrationStatus(handle);
    const persianTextSearch = await checkPersianTextSearch(handle);
    capabilities = { persianTextSearch };

    database = {
      driver: handle.driver,
      target: handle.target ?? describeTarget(env.database),
      reachable: true,
      latencyMs,
      schemaReady,
      migrations,
      error: schemaReady ? null : 'migrations_missing',
    };
  } catch (error) {
    // Full detail is logged; the caller receives a category, not a stack trace.
    console.error('[gemoria] database health check failed:', error);

    database = {
      driver: env.database.driver,
      target: describeTarget(env.database),
      reachable: false,
      latencyMs: null,
      schemaReady: false,
      migrations: {
        applied: 0,
        lastAppliedAt: null,
        available: countMigrationFiles(),
        upToDate: false,
        folder: '',
      },
      error: 'connection_failed',
    };
  }

  // A cluster that cannot tokenise Persian is *degraded*, not healthy: the museum
  // would serve pages fine and silently fail every search.
  const status: HealthState =
    database.reachable && database.schemaReady && database.migrations.upToDate
      ? capabilities.persianTextSearch.supported
        ? 'ok'
        : 'degraded'
      : database.reachable
        ? 'degraded'
        : 'error';

  return { status, application, database, capabilities, checkedAt };
}
