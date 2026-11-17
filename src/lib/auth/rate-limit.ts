/**
 * GEMORIA — a small, in-process throttle for the sign-in form.
 *
 * It exists to make password guessing expensive without adding Redis to a museum
 * that runs one server. The limitation is real and is written down rather than
 * hidden: the counters live in this process, so a restart clears them and a
 * multi-instance deployment counts each instance separately. When the museum grows
 * past one instance this becomes a table (`login_attempts`) and the interface here
 * does not change.
 *
 * The key is the email *and* the client, so one noisy address cannot lock out a
 * curator who is signing in from somewhere else.
 */

export const MAX_ATTEMPTS = 5;
export const WINDOW_MS = 15 * 60 * 1000;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitState {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

export function checkRateLimit(key: string, now = Date.now()): RateLimitState {
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true, remaining: MAX_ATTEMPTS, retryAfterSeconds: 0 };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - bucket.count);
  return {
    allowed: remaining > 0,
    remaining,
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Records one failed attempt. */
export function recordFailure(key: string, now = Date.now()): void {
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    bucket.count += 1;
  }

  // Bound the map: an attacker cycling addresses must not grow it without limit.
  if (buckets.size > 10_000) {
    for (const [candidate, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(candidate);
    }
    if (buckets.size > 10_000) buckets.clear();
  }
}

export function clearFailures(key: string): void {
  buckets.delete(key);
}

/** Test-only: resets the store so suites do not leak state into each other. */
export function resetRateLimits(): void {
  buckets.clear();
}
