'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticate, revokeSession, SESSION_COOKIE, SESSION_TTL_MS } from '@/lib/auth/session';
import {
  checkRateLimit,
  clearFailures,
  recordFailure,
} from '@/lib/auth/rate-limit';
import type { FormState } from '@/lib/validation/specimen';

/**
 * Sign in.
 *
 * The four defences, in order: a per-(address, client) throttle, a constant-time
 * password check that also spends the same time on unknown addresses, a check on
 * the account's status, and an opaque token whose hash — not the token — reaches
 * the database.
 *
 * The error message is deliberately identical for "no such account" and "wrong
 * password": telling an attacker which half they got right is a gift.
 */
export async function signInAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const destination = String(formData.get('next') ?? '/admin');

  const values = { email };

  if (email.length === 0 || password.length === 0) {
    return { status: 'error', message: 'نشانی ایمیل و گذرواژه لازم است.', values };
  }

  const headerList = await headers();
  const ip =
    headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerList.get('x-real-ip') ??
    null;
  const key = `${email}|${ip ?? 'unknown'}`;

  const limit = checkRateLimit(key);
  if (!limit.allowed) {
    return {
      status: 'error',
      message: `تلاش‌های ناموفق بیش از حد مجاز. ${limit.retryAfterSeconds} ثانیه دیگر دوباره تلاش کنید.`,
      values,
    };
  }

  const outcome = await authenticate(email, password, {
    ip,
    userAgent: headerList.get('user-agent'),
  });

  if (!outcome.ok) {
    recordFailure(key);
    return {
      status: 'error',
      message:
        outcome.reason === 'suspended'
          ? 'این حساب غیرفعال است. با مدیر موزه تماس بگیرید.'
          : 'ایمیل یا گذرواژه درست نیست.',
      values,
    };
  }

  clearFailures(key);

  const store = await cookies();
  store.set(SESSION_COOKIE, outcome.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  redirect(destination.startsWith('/admin') ? destination : '/admin');
}

/** Sign out: revoke the session row *and* clear the cookie. */
export async function signOutAction(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    try {
      await revokeSession(token);
    } catch {
      // The cookie is cleared regardless: an unreachable database must not trap a
      // user in a signed-in state they cannot leave.
    }
  }

  store.delete(SESSION_COOKIE);
  redirect('/admin/login');
}
