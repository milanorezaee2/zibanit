/**
 * The health endpoint, exercised as the deployment platform will call it.
 *
 * The route handler is imported and invoked directly rather than through a server
 * process: this keeps the assertion about *behaviour* (status code, redaction)
 * rather than about the network stack, while still running the real database
 * adapter and the real migration ledger query.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gemoria-health-'));

type RouteModule = typeof import('@/app/api/health/route');
let route: RouteModule;

beforeAll(async () => {
  // Configure a disposable database *before* the environment module is imported,
  // because `getServerEnv` memoises on first read.
  process.env.PGLITE_DATA_DIR = dataDir;
  delete process.env.DATABASE_URL;
  delete process.env.DB_DRIVER;
  (process.env as Record<string, string | undefined>).NODE_ENV = 'test';

  const { resetServerEnvCache, resetPublicEnvCache } = await import('@/lib/env');
  resetServerEnvCache();
  resetPublicEnvCache();

  route = await import('@/app/api/health/route');
});

afterAll(async () => {
  const { closeDatabase } = await import('@/db/client');
  await closeDatabase();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('GET /api/health', () => {
  it('reports a healthy, migrated PGlite database', async () => {
    const response = await route.GET();
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      status: string;
      application: { name: string; version: string; phase: number };
      database: {
        driver: string;
        reachable: boolean;
        schemaReady: boolean;
        migrations: { applied: number; available: number; upToDate: boolean };
        latencyMs: number | null;
      };
    };

    expect(body.status).toBe('ok');
    expect(body.application.name).toBe('gemoria');
    expect(body.application.phase).toBe(0);
    expect(body.database.driver).toBe('pglite');
    expect(body.database.reachable).toBe(true);
    expect(body.database.schemaReady).toBe(true);
    expect(body.database.migrations.applied).toBe(body.database.migrations.available);
    expect(body.database.migrations.upToDate).toBe(true);
    expect(body.database.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('never exposes credentials or the connection string', async () => {
    const response = await route.GET();
    const text = await response.text();

    expect(text).not.toMatch(/postgres:\/\//);
    expect(text).not.toMatch(/password/i);
    expect(text.toLowerCase()).not.toContain('secret');
  });

  it('is explicitly uncacheable', async () => {
    const response = await route.GET();
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('describes a failure in one line without dumping the driver objects', async () => {
    const { describeError } = await import('@/lib/system-status');
    const pool = { sockets: new Array(500).fill('x'), processID: 1234, secretKey: 99 };
    const leaf = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), {
      code: 'ECONNREFUSED',
    });
    const wrapped = Object.assign(new Error('Failed query: select 1'), { cause: leaf });
    Object.assign(wrapped, { cause: Object.assign(leaf, { pool }) });

    const described = describeError(wrapped);

    expect(described).toContain('Failed query: select 1');
    expect(described).toContain('ECONNREFUSED');
    expect(described.length).toBeLessThan(200);
    expect(described).not.toContain('processID');
    expect(described).not.toContain('pool');
  });

  it('survives a non-Error value and an error with no message', async () => {
    const { describeError } = await import('@/lib/system-status');
    expect(describeError(undefined)).toBe('unknown error');
    expect(describeError('boom')).toBe('unknown error');
  });
});
