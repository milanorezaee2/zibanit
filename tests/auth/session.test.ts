/**
 * Sessions and credential handling, exercised against a real PGlite database.
 *
 * What is asserted is what the security model claims: a wrong password fails, an
 * unknown address fails *without* revealing that it is unknown, a suspended user
 * cannot sign in, an expired or revoked session stops working immediately, and the
 * database never stores the browser's token.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { openDatabase, type DatabaseHandle } from '@/db/client';
import { sessions, users } from '@/db/schema/identity';
import { authenticate, hashIp, readSession, revokeSession, SESSION_TTL_MS } from '@/lib/auth/session';
import { hashPassword, verifyPassword, DUMMY_HASH } from '@/lib/auth/password';
import {
  MAX_ATTEMPTS,
  checkRateLimit,
  clearFailures,
  recordFailure,
  resetRateLimits,
} from '@/lib/auth/rate-limit';

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gemoria-auth-'));
let handle: DatabaseHandle;
const PASSWORD = 'یک-گذرواژهٔ-آزمایشی-بلند';

beforeAll(async () => {
  handle = await openDatabase(
    { driver: 'pglite', ssl: false, pgliteDataDir: dataDir, autoMigrate: true },
    { migrate: true },
  );

  await handle.db.insert(users).values({
    email: 'curator@gemoria.test',
    displayName: 'کیوریتور آزمایشی',
    role: 'curator',
    status: 'active',
    passwordHash: await hashPassword(PASSWORD),
  });

  await handle.db.insert(users).values({
    email: 'suspended@gemoria.test',
    displayName: 'کاربر معلق',
    role: 'editor',
    status: 'suspended',
    passwordHash: await hashPassword(PASSWORD),
  });
});

afterAll(async () => {
  await handle?.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

beforeEach(() => resetRateLimits());

describe('password hashing', () => {
  it('verifies the right password and rejects the wrong one', async () => {
    const stored = await hashPassword(PASSWORD);
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(await verifyPassword(PASSWORD, stored)).toBe(true);
    expect(await verifyPassword(`${PASSWORD}x`, stored)).toBe(false);
  });

  it('salts every hash, so two identical passwords differ on disk', async () => {
    const first = await hashPassword(PASSWORD);
    const second = await hashPassword(PASSWORD);
    expect(first).not.toBe(second);
    expect(await verifyPassword(PASSWORD, first)).toBe(true);
    expect(await verifyPassword(PASSWORD, second)).toBe(true);
  });

  it('fails closed on a malformed, missing or hostile stored hash', async () => {
    expect(await verifyPassword(PASSWORD, null)).toBe(false);
    expect(await verifyPassword(PASSWORD, '')).toBe(false);
    expect(await verifyPassword(PASSWORD, 'bcrypt$whatever')).toBe(false);
    // An absurd cost parameter must be refused, not executed.
    expect(await verifyPassword(PASSWORD, 'scrypt$1073741824$8$1$AAAA$AAAA')).toBe(false);
    expect(await verifyPassword(PASSWORD, DUMMY_HASH)).toBe(false);
  });

  it('refuses to hash a trivially short password', async () => {
    await expect(hashPassword('123')).rejects.toThrow();
  });
});

describe('sign-in', () => {
  it('issues a session for the right credentials and resolves it back', async () => {
    const outcome = await authenticate('curator@gemoria.test', PASSWORD, {}, handle.db);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    expect(outcome.user.role).toBe('curator');
    expect(outcome.user.permissions).toContain('specimen.write');

    const session = await readSession(outcome.token, handle.db);
    expect(session?.email).toBe('curator@gemoria.test');
  });

  it('never stores the token itself', async () => {
    const outcome = await authenticate('curator@gemoria.test', PASSWORD, {}, handle.db);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const rows = await handle.db.execute<{ token_hash: string }>(
      sql`select token_hash from sessions where user_id = (select id from users where email = 'curator@gemoria.test')`,
    );

    for (const row of rows.rows) {
      expect(row.token_hash).not.toBe(outcome.token);
      expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('rejects a wrong password and an unknown address identically', async () => {
    const wrong = await authenticate('curator@gemoria.test', 'wrong-password', {}, handle.db);
    const unknown = await authenticate('nobody@gemoria.test', PASSWORD, {}, handle.db);

    expect(wrong).toEqual({ ok: false, reason: 'invalid' });
    expect(unknown).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a suspended account even with the correct password', async () => {
    const outcome = await authenticate('suspended@gemoria.test', PASSWORD, {}, handle.db);
    expect(outcome).toEqual({ ok: false, reason: 'suspended' });
  });

  it('normalises the address so casing and spaces do not matter', async () => {
    const outcome = await authenticate('  Curator@Gemoria.Test ', PASSWORD, {}, handle.db);
    expect(outcome.ok).toBe(true);
  });
});

describe('session lifetime', () => {
  it('stops accepting a session once it is revoked', async () => {
    const outcome = await authenticate('curator@gemoria.test', PASSWORD, {}, handle.db);
    if (!outcome.ok) throw new Error('fixture sign-in failed');

    expect(await readSession(outcome.token, handle.db)).not.toBeNull();
    await revokeSession(outcome.token, handle.db);
    expect(await readSession(outcome.token, handle.db)).toBeNull();
  });

  it('stops accepting a session once it expires', async () => {
    const outcome = await authenticate('curator@gemoria.test', PASSWORD, {}, handle.db);
    if (!outcome.ok) throw new Error('fixture sign-in failed');

    await handle.db.execute(
      sql`update sessions set expires_at = now() - interval '1 minute'
          where user_id = (select id from users where email = 'curator@gemoria.test')`,
    );

    expect(await readSession(outcome.token, handle.db)).toBeNull();
  });

  it('stops accepting a session when the account is suspended afterwards', async () => {
    const outcome = await authenticate('curator@gemoria.test', PASSWORD, {}, handle.db);
    if (!outcome.ok) throw new Error('fixture sign-in failed');

    await handle.db
      .update(users)
      .set({ status: 'suspended' })
      .where(sql`email = 'curator@gemoria.test'`);

    expect(await readSession(outcome.token, handle.db)).toBeNull();

    await handle.db
      .update(users)
      .set({ status: 'active' })
      .where(sql`email = 'curator@gemoria.test'`);
  });

  it('expires a new session twelve hours after it is issued', async () => {
    await handle.db.delete(sessions);
    const outcome = await authenticate('curator@gemoria.test', PASSWORD, {}, handle.db);
    if (!outcome.ok) throw new Error('fixture sign-in failed');

    const rows = await handle.db.execute<{ delta: number }>(
      sql`select extract(epoch from (expires_at - now()))::int as delta from sessions limit 1`,
    );

    const delta = Number(rows.rows[0]?.delta ?? 0);
    expect(delta).toBeGreaterThan(SESSION_TTL_MS / 1000 - 60);
    expect(delta).toBeLessThanOrEqual(SESSION_TTL_MS / 1000);
  });

  it('hashes the client address instead of storing it', () => {
    const hashed = hashIp('203.0.113.7');
    expect(hashed).toMatch(/^[0-9a-f]{32}$/);
    expect(hashed).not.toContain('203.0.113.7');
    expect(hashIp(null)).toBeNull();
  });
});

describe('sign-in throttle', () => {
  it('locks the key after the allowed number of failures', () => {
    const key = 'curator@gemoria.test|127.0.0.1';
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      expect(checkRateLimit(key).allowed).toBe(true);
      recordFailure(key);
    }

    const locked = checkRateLimit(key);
    expect(locked.allowed).toBe(false);
    expect(locked.retryAfterSeconds).toBeGreaterThan(0);

    clearFailures(key);
    expect(checkRateLimit(key).allowed).toBe(true);
  });

  it('keeps its counters per key, so one address cannot lock out another', () => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) recordFailure('a|1');
    expect(checkRateLimit('a|1').allowed).toBe(false);
    expect(checkRateLimit('b|1').allowed).toBe(true);
  });
});
