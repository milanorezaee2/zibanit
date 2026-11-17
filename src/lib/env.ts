/**
 * GEMORIA — server-side environment contract.
 *
 * This module is the single gate through which the application learns *where*
 * its data lives. It has one job and does it strictly:
 *
 *   development / preview  → PGlite (PostgreSQL/WASM, in-process)
 *   production             → a real PostgreSQL server, via DATABASE_URL
 *
 * The rules are enforced by a schema, not by convention or by comments, and the
 * failure messages are written to be read by a human at 3 a.m. during a
 * deployment. In particular:
 *
 *   • production without DATABASE_URL  → hard failure, never a fallback
 *   • production with DB_DRIVER=pglite → hard failure, never a fallback
 *   • production with DB_AUTO_MIGRATE → hard failure (migrations are an explicit,
 *     reviewed deployment step, not something a web server does at boot)
 *
 * No secret is ever logged, returned, or formatted. Only a redacted description
 * of the target is exposed (see `describeTarget`).
 */

import { z } from 'zod';

export const DATABASE_DRIVERS = ['pglite', 'postgres'] as const;
export type DatabaseDriver = (typeof DATABASE_DRIVERS)[number];

const POSTGRES_URL_PATTERN = /^postgres(?:ql)?:\/\/\S+$/i;
const DEFAULT_PGLITE_DIR = '.data/pglite';
const DEFAULT_APP_URL = 'http://localhost:3000';

const booleanish = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

const serverSourceSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).optional(),
  DATABASE_URL: z.string().optional(),
  DATABASE_SSL: booleanish.optional(),
  DB_DRIVER: z.enum(DATABASE_DRIVERS).optional(),
  PGLITE_DATA_DIR: z.string().optional(),
  DB_AUTO_MIGRATE: booleanish.optional(),
});

export type EnvironmentName = 'development' | 'test' | 'production';

export interface DatabaseConfig {
  readonly driver: DatabaseDriver;
  /** Only present for the postgres driver. */
  readonly url?: string;
  readonly ssl: boolean;
  readonly pgliteDataDir: string;
  readonly autoMigrate: boolean;
}

export interface ServerEnv {
  readonly nodeEnv: EnvironmentName;
  readonly isProduction: boolean;
  readonly database: DatabaseConfig;
}

export class EnvironmentConfigurationError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(
      [
        'GEMORIA cannot start because the environment configuration is invalid:',
        ...problems.map((problem) => `  • ${problem}`),
        '',
        'See .env.example for the complete, documented set of variables.',
      ].join('\n'),
    );
    this.name = 'EnvironmentConfigurationError';
    this.problems = problems;
  }
}

/**
 * Pure, side-effect-free validation. Tests call this directly with fixtures
 * instead of mutating `process.env`, which keeps them order-independent.
 */
export function loadServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const parsed = serverSourceSchema.safeParse(source);

  if (!parsed.success) {
    throw new EnvironmentConfigurationError(
      parsed.error.issues.map((issue) => {
        const path = issue.path.join('.') || '(root)';
        return `${path}: ${issue.message}`;
      }),
    );
  }

  const value = parsed.data;
  const nodeEnv: EnvironmentName = value.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';
  const problems: string[] = [];

  if (value.DATABASE_URL !== undefined && !POSTGRES_URL_PATTERN.test(value.DATABASE_URL)) {
    problems.push(
      'DATABASE_URL must be a PostgreSQL connection string starting with "postgres://" or "postgresql://". ' +
        'Other schemes are not supported: the museum speaks one SQL dialect everywhere.',
    );
  }

  if (isProduction) {
    if (value.DB_DRIVER === 'pglite') {
      problems.push(
        'DB_DRIVER=pglite is not permitted in production. PGlite is an in-process, single-connection ' +
          'databases intended for development, tests and preview environments — never for a live museum.',
      );
    }
    if (!value.DATABASE_URL) {
      problems.push(
        'DATABASE_URL is required in production. GEMORIA will not fall back to PGlite: refusing to start ' +
          'is safer than silently serving a museum from an empty scratch database.',
      );
    }
    if (value.DB_AUTO_MIGRATE === true) {
      problems.push(
        'DB_AUTO_MIGRATE=true is not permitted in production. Apply migrations as an explicit, reviewed ' +
          'deployment step (`npm run db:migrate`) before starting the server.',
      );
    }
  }

  if (value.DB_DRIVER === 'postgres' && !value.DATABASE_URL) {
    problems.push('DB_DRIVER=postgres requires DATABASE_URL to be set.');
  }

  if (problems.length > 0) {
    throw new EnvironmentConfigurationError(problems);
  }

  const driver: DatabaseDriver =
    value.DB_DRIVER ?? (value.DATABASE_URL ? 'postgres' : 'pglite');

  return {
    nodeEnv,
    isProduction,
    database: {
      driver,
      ...(driver === 'postgres' && value.DATABASE_URL ? { url: value.DATABASE_URL } : {}),
      ssl: value.DATABASE_SSL ?? false,
      pgliteDataDir: value.PGLITE_DATA_DIR ?? DEFAULT_PGLITE_DIR,
      autoMigrate: value.DB_AUTO_MIGRATE ?? !isProduction,
    },
  };
}

/**
 * Runtime defence in depth, kept pure and unit-testable.
 *
 * `loadServerEnv` already refuses the combination, but this assertion also runs
 * immediately before a connection is created, so that a future refactor cannot
 * quietly re-introduce a PGlite production database.
 */
export function assertProductionDatabaseSafety(env: ServerEnv): void {
  if (env.isProduction && env.database.driver === 'pglite') {
    throw new Error(
      'Refusing to start: PGlite is a development-only database and this process reports NODE_ENV=production. ' +
        'Set DATABASE_URL to a real PostgreSQL server.',
    );
  }
}

let cachedServerEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedServerEnv ??= loadServerEnv(process.env);
  return cachedServerEnv;
}

/** Test helper: drop the memoised environment between cases. */
export function resetServerEnvCache(): void {
  cachedServerEnv = undefined;
}

/**
 * A safe, log-ready description of the database target. Credentials, query
 * parameters and the password are never included.
 */
export function describeTarget(database: DatabaseConfig): string {
  if (database.driver === 'pglite') {
    return `pglite:${database.pgliteDataDir}`;
  }

  if (!database.url) {
    return 'postgres:(url missing)';
  }

  try {
    const url = new URL(database.url);
    const databaseName = url.pathname.replace(/^\//, '') || '(default)';
    return `postgres:${url.hostname}:${url.port || '5432'}/${databaseName}`;
  } catch {
    return 'postgres:(unparseable url)';
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   Public configuration — safe to send to the browser, validated separately so
   that rendering a page never requires database credentials.
   ───────────────────────────────────────────────────────────────────────────── */

const publicSourceSchema = z.object({
  APP_URL: z
    .string()
    .optional()
    .refine((value) => value === undefined || /^https?:\/\/\S+$/.test(value), {
      message: 'APP_URL must be an absolute http(s) URL, e.g. https://gemoria.example',
    }),
  SITE_NAME: z.string().min(1).optional(),
  SITE_NAME_LATIN: z.string().min(1).optional(),
});

export interface PublicEnv {
  readonly appUrl: string;
  readonly siteName: string;
  readonly siteNameLatin: string;
}

export function loadPublicEnv(source: Record<string, string | undefined>): PublicEnv {
  const parsed = publicSourceSchema.safeParse(source);

  if (!parsed.success) {
    throw new EnvironmentConfigurationError(
      parsed.error.issues.map(
        (issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`,
      ),
    );
  }

  return {
    appUrl: parsed.data.APP_URL ?? DEFAULT_APP_URL,
    siteName: parsed.data.SITE_NAME ?? 'گموریا',
    siteNameLatin: parsed.data.SITE_NAME_LATIN ?? 'GEMORIA',
  };
}

let cachedPublicEnv: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  cachedPublicEnv ??= loadPublicEnv(process.env);
  return cachedPublicEnv;
}

export function resetPublicEnvCache(): void {
  cachedPublicEnv = undefined;
}
