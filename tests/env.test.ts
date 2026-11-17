/**
 * The environment contract is security-relevant, so it is tested like one.
 *
 * The most important assertions in this file are the negative ones: production
 * without a database URL must fail, and production pointing at PGlite must fail.
 */
import { describe, expect, it } from 'vitest';
import {
  assertProductionDatabaseSafety,
  describeTarget,
  EnvironmentConfigurationError,
  loadPublicEnv,
  loadServerEnv,
} from '@/lib/env';

const PROD_URL = 'postgres://gemoria:secret@db.internal:5432/gemoria';

describe('loadServerEnv — development', () => {
  it('defaults to PGlite when no database URL is configured', () => {
    const env = loadServerEnv({});
    expect(env.nodeEnv).toBe('development');
    expect(env.database.driver).toBe('pglite');
    expect(env.database.autoMigrate).toBe(true);
    expect(env.database.pgliteDataDir).toBe('.data/pglite');
  });

  it('switches to PostgreSQL as soon as DATABASE_URL is present', () => {
    const env = loadServerEnv({ DATABASE_URL: PROD_URL });
    expect(env.database.driver).toBe('postgres');
    expect(env.database.url).toBe(PROD_URL);
  });

  it('can be pinned to PGlite even when a URL exists', () => {
    const env = loadServerEnv({ DATABASE_URL: PROD_URL, DB_DRIVER: 'pglite' });
    expect(env.database.driver).toBe('pglite');
  });

  it('honours an explicit data directory for PGlite', () => {
    const env = loadServerEnv({ PGLITE_DATA_DIR: '/tmp/museum-db' });
    expect(env.database.pgliteDataDir).toBe('/tmp/museum-db');
  });

  it('rejects a non-PostgreSQL connection string', () => {
    expect(() => loadServerEnv({ DATABASE_URL: 'mysql://user@host/db' })).toThrow(
      EnvironmentConfigurationError,
    );
    expect(() => loadServerEnv({ DATABASE_URL: 'mysql://user@host/db' })).toThrow(
      /postgres:\/\//,
    );
  });

  it('requires DATABASE_URL when the driver is explicitly postgres', () => {
    expect(() => loadServerEnv({ DB_DRIVER: 'postgres' })).toThrow(/requires DATABASE_URL/);
  });
});

describe('loadServerEnv — production guard rails', () => {
  it('accepts a real PostgreSQL server', () => {
    const env = loadServerEnv({ NODE_ENV: 'production', DATABASE_URL: PROD_URL });
    expect(env.isProduction).toBe(true);
    expect(env.database.driver).toBe('postgres');
    // Automatic migrations are off in production, always.
    expect(env.database.autoMigrate).toBe(false);
  });

  it('refuses to start without DATABASE_URL — it never falls back to PGlite', () => {
    const fail = () => loadServerEnv({ NODE_ENV: 'production' });
    expect(fail).toThrow(EnvironmentConfigurationError);
    expect(fail).toThrow(/DATABASE_URL is required in production/);
    expect(fail).toThrow(/will not fall back to PGlite/);
  });

  it('refuses DB_DRIVER=pglite in production even if a URL is present', () => {
    const fail = () => loadServerEnv({ NODE_ENV: 'production', DATABASE_URL: PROD_URL, DB_DRIVER: 'pglite' });
    expect(fail).toThrow(/DB_DRIVER=pglite is not permitted in production/);
  });

  it('refuses automatic migrations in production', () => {
    expect(() =>
      loadServerEnv({ NODE_ENV: 'production', DATABASE_URL: PROD_URL, DB_AUTO_MIGRATE: 'true' }),
    ).toThrow(/DB_AUTO_MIGRATE=true is not permitted in production/);
  });

  it('reports every problem at once instead of one at a time', () => {
    try {
      loadServerEnv({ NODE_ENV: 'production', DB_DRIVER: 'pglite', DB_AUTO_MIGRATE: 'true' });
      throw new Error('expected a configuration error');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentConfigurationError);
      const problems = (error as EnvironmentConfigurationError).problems;
      expect(problems.length).toBe(3);
    }
  });
});

describe('assertProductionDatabaseSafety', () => {
  it('throws for a production PGlite configuration', () => {
    const env = {
      nodeEnv: 'production' as const,
      isProduction: true,
      database: {
        driver: 'pglite' as const,
        ssl: false,
        pgliteDataDir: '.data/pglite',
        autoMigrate: false,
      },
    };
    expect(() => assertProductionDatabaseSafety(env)).toThrow(/development-only database/);
  });

  it('is silent for a production PostgreSQL configuration', () => {
    const env = {
      nodeEnv: 'production' as const,
      isProduction: true,
      database: { driver: 'postgres' as const, url: PROD_URL, ssl: true, pgliteDataDir: '', autoMigrate: false },
    };
    expect(() => assertProductionDatabaseSafety(env)).not.toThrow();
  });

  it('is silent for PGlite outside production', () => {
    const env = {
      nodeEnv: 'development' as const,
      isProduction: false,
      database: { driver: 'pglite' as const, ssl: false, pgliteDataDir: '.data/pglite', autoMigrate: true },
    };
    expect(() => assertProductionDatabaseSafety(env)).not.toThrow();
  });
});

describe('describeTarget', () => {
  it('never leaks the password or query parameters', () => {
    const description = describeTarget({
      driver: 'postgres',
      url: 'postgres://gemoria:sup3r-secret@db.internal:5432/gemoria?sslmode=require',
      ssl: true,
      pgliteDataDir: '',
      autoMigrate: false,
    });
    expect(description).toBe('postgres:db.internal:5432/gemoria');
    expect(description).not.toContain('sup3r-secret');
    expect(description).not.toContain('sslmode');
  });
});

describe('loadPublicEnv', () => {
  it('provides sane defaults', () => {
    const env = loadPublicEnv({});
    expect(env.appUrl).toBe('http://localhost:3000');
    expect(env.siteName).toBe('گموریا');
    expect(env.siteNameLatin).toBe('GEMORIA');
  });

  it('rejects a relative APP_URL', () => {
    expect(() => loadPublicEnv({ APP_URL: '/museum' })).toThrow(/absolute http\(s\) URL/);
  });
});
