/**
 * GEMORIA — access control, exercised.
 *
 * The specification asks for these as *tests*, not as assertions in prose: no
 * administrator surface without a session, a real role check on the server, and a
 * Server Action that refuses a hand-crafted POST. So this file opens a real
 * database, creates real accounts with real hashes, and calls the real actions —
 * only the edge of Next.js (cookies, redirect, revalidation) is stood in for,
 * because there is no HTTP server here.
 *
 * What is deliberately *not* faked: the password hash, the session table, the
 * permission table, the mutation functions and the validation schema. If any of
 * those were wrong, these tests would fail.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import type { DatabaseHandle } from '@/db/client';

/* ── The Next.js edge, stood in for ───────────────────────────────────────── */

/** A cookie jar with the same three methods the code uses. */
const jar = new Map<string, string>();

class RedirectSignal extends Error {
  constructor(readonly destination: string) {
    super(`redirect:${destination}`);
  }
}

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      jar.set(name, value);
      setCookieOptions[name] = options ?? {};
    },
    delete: (name: string) => {
      jar.delete(name);
    },
  }),
  headers: async () =>
    new Headers({
      'x-forwarded-for': '203.0.113.7',
      'user-agent': 'vitest/access-control',
    }),
}));

const setCookieOptions: Record<string, Record<string, unknown>> = {};

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...actual,
    redirect: (destination: string): never => {
      throw new RedirectSignal(destination);
    },
    notFound: (): never => {
      throw new Error('not-found');
    },
  };
});

vi.mock('next/cache', () => ({
  revalidatePath: () => undefined,
  revalidateTag: () => undefined,
}));

/* ── A real database ──────────────────────────────────────────────────────── */

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gemoria-security-'));
let handle: DatabaseHandle;

vi.mock('@/db/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/db/client')>();
  return {
    ...actual,
    getDatabase: async () => handle,
  };
});

/* Imported after the mocks so the modules pick up the stand-ins. */
const { hashPassword } = await import('@/lib/auth/password');
const { authenticate, getSessionUser, requireUser, requirePermissionUser, ForbiddenError, SESSION_COOKIE } =
  await import('@/lib/auth/session');
const { saveSpecimenAction, setSpecimenStatusAction, deleteSpecimenAction } = await import(
  '@/app/admin/(secured)/specimens/actions'
);
const { signInAction, signOutAction } = await import('@/app/admin/login/actions');
const { getAdminSpecimen } = await import('@/db/queries/admin');
const { getSpecimenBySlug, listSpecimens } = await import('@/db/queries/specimens');
const { users } = await import('@/db/schema/identity');
const { specimens } = await import('@/db/schema/specimens');

const PASSWORDS = {
  curator: 'curator-password-1',
  viewer: 'viewer-password-01',
};

function specimenForm(fields: Record<string, string> = {}): FormData {
  const form = new FormData();
  const base: Record<string, string> = {
    inventoryNo: 'SEC-0001',
    slug: 'security-test-object',
    title: 'نمونهٔ آزمون دسترسی',
    summary: 'معرفی کوتاه برای آزمون دسترسی.',
    scientificName: 'Testite',
  };
  for (const [key, value] of Object.entries({ ...base, ...fields })) form.set(key, value);
  return form;
}

async function signInAs(email: string, password: string): Promise<string> {
  const outcome = await authenticate(email, password, { ip: null, userAgent: 'vitest' });
  if (!outcome.ok) throw new Error(`could not sign in as ${email}: ${outcome.reason}`);
  return outcome.token;
}

beforeAll(async () => {
  const { openDatabase } = await import('@/db/client');
  handle = await openDatabase(
    { driver: 'pglite', ssl: false, pgliteDataDir: dataDir, autoMigrate: true },
    { migrate: true },
  );

  await handle.db.insert(users).values([
    {
      email: 'curator@gemoria.test',
      displayName: 'کیوریتور آزمون',
      role: 'curator',
      status: 'active',
      passwordHash: await hashPassword(PASSWORDS.curator),
    },
    {
      email: 'viewer@gemoria.test',
      displayName: 'بازبین آزمون',
      role: 'viewer',
      status: 'active',
      passwordHash: await hashPassword(PASSWORDS.viewer),
    },
  ]);
});

afterAll(async () => {
  await handle?.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

/* ── The tests ────────────────────────────────────────────────────────────── */

describe('guards', () => {
  it('sends an unauthenticated visitor to the sign-in page instead of the dashboard', async () => {
    jar.clear();

    await expect(requireUser()).rejects.toThrow(RedirectSignal);
    await expect(requireUser()).rejects.toThrow('/admin/login');

    const error = await requireUser().catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(RedirectSignal);
    expect((error as RedirectSignal).destination).toContain('next=%2Fadmin');
  });

  it('refuses a forged token that was never issued', async () => {
    jar.set(SESSION_COOKIE, 'a'.repeat(43));
    await expect(getSessionUser()).resolves.toBeNull();
    await expect(requireUser()).rejects.toThrow(RedirectSignal);
    jar.clear();
  });

  it('accepts a real session and reports the role', async () => {
    jar.set(SESSION_COOKIE, await signInAs('curator@gemoria.test', PASSWORDS.curator));

    const user = await requireUser();
    expect(user.email).toBe('curator@gemoria.test');
    expect(user.role).toBe('curator');
    jar.clear();
  });

  it('blocks a signed-in account that lacks the permission', async () => {
    jar.set(SESSION_COOKIE, await signInAs('viewer@gemoria.test', PASSWORDS.viewer));

    const user = await requireUser();
    expect(user.role).toBe('viewer');

    const error = await requirePermissionUser('specimen.write').catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ForbiddenError);
    expect((error as InstanceType<typeof ForbiddenError>).permission).toBe('specimen.write');

    jar.clear();
  });
});

describe('server actions', () => {
  it('refuses to create a specimen without a session', async () => {
    jar.clear();
    const before = await handle.db.select({ id: specimens.id }).from(specimens);

    // Anonymous callers are redirected to sign-in rather than told why: the action
    // never reaches the write path, so the assertion that matters is the row count.
    await expect(
      saveSpecimenAction({ status: 'idle' }, specimenForm({ inventoryNo: 'SEC-DENIED' })),
    ).rejects.toBeInstanceOf(RedirectSignal);

    const after = await handle.db.select({ id: specimens.id }).from(specimens);
    expect(after.length).toBe(before.length);
  });

  it('refuses a write from a viewer who is signed in but unauthorised', async () => {
    jar.set(SESSION_COOKIE, await signInAs('viewer@gemoria.test', PASSWORDS.viewer));

    const state = await saveSpecimenAction({ status: 'idle' }, specimenForm({ inventoryNo: 'SEC-VIEWER' }));

    expect(state.status).toBe('error');
    expect(state.message).toContain('اجازه');

    const rows = await handle.db
      .select({ id: specimens.id })
      .from(specimens)
      .where(eq(specimens.inventoryNo, 'SEC-VIEWER'));
    expect(rows).toHaveLength(0);

    jar.clear();
  });

  it('accepts the same write from a curator, and creates a draft only', async () => {
    jar.set(SESSION_COOKIE, await signInAs('curator@gemoria.test', PASSWORDS.curator));

    const state = await saveSpecimenAction({ status: 'idle' }, specimenForm()).catch((reason: unknown) => reason);

    // The action redirects after a successful save; the redirect is the success signal.
    expect(state).toBeInstanceOf(RedirectSignal);

    const [created] = await handle.db
      .select({ id: specimens.id, status: specimens.status })
      .from(specimens)
      .where(eq(specimens.inventoryNo, 'SEC-0001'));

    expect(created).toBeDefined();
    expect(created?.status).toBe('draft');

    jar.clear();
  });

  it('reports field errors in Persian and keeps the submitted values', async () => {
    jar.set(SESSION_COOKIE, await signInAs('curator@gemoria.test', PASSWORDS.curator));

    const state = await saveSpecimenAction(
      { status: 'idle' },
      specimenForm({ inventoryNo: 'SEC-0002', title: '', slug: '' }),
    );

    expect(state.status).toBe('error');
    expect(state.fieldErrors?.title).toBeTruthy();
    expect(state.fieldErrors?.slug).toBeTruthy();
    // The form must not lose what was typed.
    expect(state.values?.inventoryNo).toBe('SEC-0002');

    jar.clear();
  });

  it('rejects a duplicate inventory number as a field error, not a crash', async () => {
    jar.set(SESSION_COOKIE, await signInAs('curator@gemoria.test', PASSWORDS.curator));

    const state = await saveSpecimenAction(
      { status: 'idle' },
      specimenForm({ inventoryNo: 'SEC-0001', slug: 'another-slug', title: 'نمونهٔ دوم' }),
    );

    expect(state.status).toBe('error');
    expect(state.fieldErrors?.inventoryNo).toBeTruthy();

    jar.clear();
  });

  it('does not publish through the save action', async () => {
    jar.set(SESSION_COOKIE, await signInAs('curator@gemoria.test', PASSWORDS.curator));

    const [row] = await handle.db
      .select({ id: specimens.id })
      .from(specimens)
      .where(eq(specimens.inventoryNo, 'SEC-0001'));

    const form = specimenForm({ inventoryNo: 'SEC-0001', id: row!.id });
    form.set('status', 'published');

    await saveSpecimenAction({ status: 'idle' }, form).catch(() => undefined);

    const [after] = await handle.db
      .select({ status: specimens.status })
      .from(specimens)
      .where(eq(specimens.id, row!.id));

    expect(after?.status).toBe('draft');
    jar.clear();
  });

  it('requires permission to publish and to remove an object', async () => {
    jar.set(SESSION_COOKIE, await signInAs('viewer@gemoria.test', PASSWORDS.viewer));

    const [row] = await handle.db
      .select({ id: specimens.id, status: specimens.status })
      .from(specimens)
      .where(eq(specimens.inventoryNo, 'SEC-0001'));

    const publishForm = new FormData();
    publishForm.set('id', row!.id);
    publishForm.set('status', 'published');

    await expect(setSpecimenStatusAction(publishForm)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(deleteSpecimenAction(publishForm)).rejects.toBeInstanceOf(ForbiddenError);

    const [after] = await handle.db
      .select({ status: specimens.status })
      .from(specimens)
      .where(eq(specimens.id, row!.id));
    expect(after?.status).toBe('draft');

    jar.clear();
  });

  it('hides a draft from the public query and exposes it only after publication', async () => {
    const [row] = await handle.db
      .select({ id: specimens.id })
      .from(specimens)
      .where(eq(specimens.inventoryNo, 'SEC-0001'));

    expect(await getSpecimenBySlug('security-test-object', handle.db)).toBeNull();
    const publicList = await listSpecimens({}, handle.db);
    expect(publicList.items.some((item) => item.id === row!.id)).toBe(false);

    jar.set(SESSION_COOKIE, await signInAs('curator@gemoria.test', PASSWORDS.curator));
    const publishForm = new FormData();
    publishForm.set('id', row!.id);
    publishForm.set('status', 'published');
    await setSpecimenStatusAction(publishForm);

    expect(await getSpecimenBySlug('security-test-object', handle.db)).not.toBeNull();

    // Put it back so the suite's expectations stay independent of order.
    const draftForm = new FormData();
    draftForm.set('id', row!.id);
    draftForm.set('status', 'draft');
    await setSpecimenStatusAction(draftForm);
    jar.clear();
  });

  it('does not expose an object the curator cannot read through the admin form either', async () => {
    jar.set(SESSION_COOKIE, await signInAs('viewer@gemoria.test', PASSWORDS.viewer));

    // A viewer *may* read (READ_ONLY includes specimen.read) but not write; the form
    // data therefore exists and the action still refuses to change it.
    const read = await getAdminSpecimen(handle.db, (await handle.db.select({ id: specimens.id }).from(specimens))[0]!.id);
    expect(read).not.toBeNull();

    const state = await saveSpecimenAction({ status: 'idle' }, specimenForm({ inventoryNo: 'SEC-VIEWER-2' }));
    expect(state.status).toBe('error');

    jar.clear();
  });
});

describe('sign-in and sign-out', () => {
  it('sets a hardened cookie on success and redirects to the dashboard', async () => {
    jar.clear();

    const form = new FormData();
    form.set('email', 'curator@gemoria.test');
    form.set('password', PASSWORDS.curator);

    await expect(signInAction({ status: 'idle' }, form)).rejects.toBeInstanceOf(RedirectSignal);

    expect(jar.get(SESSION_COOKIE)).toBeTruthy();
    expect(setCookieOptions[SESSION_COOKIE]).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false,
    });

    jar.clear();
  });

  it('answers an unknown address and a wrong password with the same message', async () => {
    jar.clear();

    const unknown = new FormData();
    unknown.set('email', 'nobody@gemoria.test', );
    unknown.set('password', 'whatever-password');

    const wrong = new FormData();
    wrong.set('email', 'curator@gemoria.test');
    wrong.set('password', 'not-the-password');

    const first = await signInAction({ status: 'idle' }, unknown);
    const second = await signInAction({ status: 'idle' }, wrong);

    expect(first.status).toBe('error');
    expect(first.message).toBe(second.message);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });

  it('throttles repeated failures for the same address and client', async () => {
    jar.clear();

    const attempt = async (password: string) => {
      const form = new FormData();
      form.set('email', 'viewer@gemoria.test');
      form.set('password', password);
      return signInAction({ status: 'idle' }, form);
    };

    let last = await attempt('wrong-1');
    for (let index = 0; index < 5; index += 1) last = await attempt(`wrong-${index}`);

    expect(last.status).toBe('error');
    expect(last.message).toContain('تلاش');

    // Even the correct password is refused while the throttle holds: otherwise the
    // limit would only slow an attacker down by one guess.
    const correct = await attempt(PASSWORDS.viewer);
    expect(correct.status).toBe('error');
  });

  it('clears the cookie and revokes the session on sign-out', async () => {
    jar.set(SESSION_COOKIE, await signInAs('curator@gemoria.test', PASSWORDS.curator));
    const token = jar.get(SESSION_COOKIE)!;

    await expect(signOutAction()).rejects.toBeInstanceOf(RedirectSignal);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(await getSessionUser()).toBeNull();

    // Replaying the revoked token must not work either.
    jar.set(SESSION_COOKIE, token);
    expect(await getSessionUser()).toBeNull();
    jar.clear();
  });

  it('keeps the sign-in page and the dashboard out of search engines', async () => {
    const { metadata: adminMetadata } = await import('@/app/admin/layout');
    const { metadata: loginMetadata } = await import('@/app/admin/login/page');

    expect(adminMetadata.robots).toMatchObject({ index: false, follow: false });
    expect(loginMetadata.robots).toMatchObject({ index: false, follow: false });
  });
});
