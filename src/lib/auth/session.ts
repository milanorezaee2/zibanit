/**
 * GEMORIA — sessions and the server-side authorisation gate.
 *
 * Design notes that matter for security:
 *
 *   • the cookie carries 32 random bytes; the database stores only their SHA-256.
 *     A leaked database cannot be replayed as a valid session.
 *   • the cookie is httpOnly, SameSite=Lax, Secure in production, and scoped to
 *     `/`. Nothing in the browser can read or forge it.
 *   • every read of the session re-checks four facts the token cannot prove:
 *     expiry, revocation, the user's status, and the role at read time. A
 *     suspended user is out on their next request, not at their next login.
 *   • `getSessionUser()` is memoised per request with React's `cache()`, so a page
 *     that guards its layout and its action does not query twice per render.
 *   • authorisation is enforced by `requireUser`/`requirePermission` on the
 *     server. Hiding a button is a courtesy; this is the control.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { getDatabase, type MuseumDatabase } from '@/db/client';
import { sessions, users } from '@/db/schema/identity';
import { can, permissionsFor, type Permission, type Role } from './permissions';
import { DUMMY_HASH, verifyPassword } from './password';

export const SESSION_COOKIE = 'gemoria_session';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
  readonly permissions: readonly Permission[];
}

export type LoginOutcome =
  | { readonly ok: true; readonly token: string; readonly user: AdminUser }
  | { readonly ok: false; readonly reason: 'invalid' | 'suspended' | 'rate-limited' };

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * IP addresses are personal data. They are stored only as a salted digest, and
 * only so that an operator can spot a session created from an unexpected network.
 * `AUTH_SECRET` is optional: without it the digest still hides the address from a
 * casual database reader, but it is not a cryptographic anonymity guarantee — the
 * README says so plainly rather than implying more.
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const secret = process.env.AUTH_SECRET ?? 'gemoria-development';
  return createHash('sha256').update(`${ip}:${secret}`).digest('hex').slice(0, 32);
}

function toAdminUser(row: { id: string; email: string; displayName: string; role: Role }): AdminUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    permissions: permissionsFor(row.role),
  };
}

/**
 * Checks credentials and, on success, creates a session row.
 *
 * The comparison against `DUMMY_HASH` for an unknown address keeps the response
 * time of "no such user" and "wrong password" indistinguishable.
 */
export async function authenticate(
  email: string,
  password: string,
  meta: { ip?: string | null; userAgent?: string | null } = {},
  database?: MuseumDatabase,
): Promise<LoginOutcome> {
  const db = database ?? (await getDatabase()).db;
  const normalizedEmail = email.trim().toLowerCase();

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      status: users.status,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  const matches = await verifyPassword(password, row?.passwordHash ?? DUMMY_HASH);

  if (!row || !row.passwordHash || !matches) return { ok: false, reason: 'invalid' };
  if (row.status !== 'active') return { ok: false, reason: 'suspended' };

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    userId: row.id,
    tokenHash: hashToken(token),
    userAgent: meta.userAgent?.slice(0, 300) ?? null,
    ipHash: hashIp(meta.ip ?? null),
    expiresAt,
  });

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, row.id));

  return {
    ok: true,
    token,
    user: toAdminUser({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
    }),
  };
}

/** The session row for a token, if it is live. */
export async function readSession(
  token: string,
  database?: MuseumDatabase,
): Promise<AdminUser | null> {
  const db = database ?? (await getDatabase()).db;

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      status: users.status,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, hashToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return null;
  if (row.status !== 'active') return null;

  await db.update(sessions).set({ lastSeenAt: new Date() }).where(eq(sessions.tokenHash, hashToken(token)));

  return toAdminUser({
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
  });
}

/** Revokes a session. Idempotent, and silent when the token is unknown. */
export async function revokeSession(token: string, database?: MuseumDatabase): Promise<void> {
  const db = database ?? (await getDatabase()).db;
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, hashToken(token)));
}

/** Constant-time comparison helper for tests and for token-shaped inputs. */
export function tokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * The current administrator, or null. Memoised for the lifetime of one request.
 */
export const getSessionUser = cache(async (): Promise<AdminUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    return await readSession(token);
  } catch (error) {
    console.error('[gemoria] session lookup failed:', error instanceof Error ? error.message : 'unknown');
    return null;
  }
});

/**
 * Requires a signed-in administrator.
 *
 * `redirect()` throws, which is what makes this safe to `await` at the top of a
 * Server Component or Server Action: execution stops there. The return value is
 * therefore never null in the type system, and no caller can forget the check.
 */
export async function requireUser(nextPath = '/admin'): Promise<AdminUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export class ForbiddenError extends Error {
  readonly permission: Permission;

  constructor(permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = 'ForbiddenError';
    this.permission = permission;
  }
}

/**
 * Requires a specific permission.
 *
 * Used by every Server Action and Route Handler that writes. Unauthenticated
 * callers are redirected to the sign-in page; authenticated callers without the
 * permission get a thrown `ForbiddenError` that the action converts into a form
 * error — never a silent no-op and never a success.
 */
export async function requirePermissionUser(permission: Permission): Promise<AdminUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) throw new ForbiddenError(permission);
  return user;
}

/**
 * Page-level permission check that returns instead of throwing.
 *
 * A Server Component cannot set a status code, and a thrown `ForbiddenError` would
 * become a 500 — the wrong story to tell a signed-in colleague who simply lacks the
 * permission. `null` lets the page render an honest «no access» panel with no data.
 * Server Actions keep using `requirePermissionUser`, which throws.
 */
export async function guardPage(permission: Permission): Promise<AdminUser | null> {
  const user = await getSessionUser();
  if (!user) redirect('/admin/login?next=%2Fadmin');
  return can(user.role, permission) ? user : null;
}

/** Whether the current user may perform an action. For rendering, never for guarding. */
export async function currentUserCan(permission: Permission): Promise<boolean> {
  const user = await getSessionUser();
  return Boolean(user && can(user.role, permission));
}
