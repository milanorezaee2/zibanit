/**
 * GEMORIA — password hashing.
 *
 * scrypt, from Node's own `crypto` module. Not Argon2id — and the reason is
 * recorded here rather than left as a surprise for whoever reads the schema:
 *
 *   • Argon2id is the current OWASP first choice, but every usable implementation
 *     is a native module (`argon2`, `@node-rs/argon2`). This project has no native
 *     dependency in its dependency tree, and adding one to a museum that must run
 *     on an unknown host is a deployment risk larger than the marginal difference
 *     between scrypt and Argon2id at these parameters.
 *   • scrypt is memory-hard (16 MiB per verification here), is in the Node core,
 *     has no build step, and is explicitly listed by OWASP as an acceptable
 *     alternative when Argon2id is unavailable.
 *
 * The stored format is self-describing, so parameters can be raised later and old
 * hashes still verify:
 *
 *     scrypt$16384$8$1$<salt base64>$<derived key base64>
 *
 * Comparison is constant-time (`timingSafeEqual`), and a malformed or unknown
 * format fails closed — it never throws a distinguishable error to the caller.
 */
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

/**
 * `promisify` erases the options overload that carries the cost parameters, so the
 * signature is declared once here instead of casting at each call site.
 */
const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: Buffer,
  keyLength: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/** OWASP-equivalent parameters for scrypt: N=2^14, r=8, p=1, 64-byte key. */
export const SCRYPT_PARAMS = { N: 16_384, r: 8, p: 1, keyLength: 64, saltBytes: 16 } as const;

const PREFIX = 'scrypt';
const MAX_MEMORY = 64 * 1024 * 1024;

export async function hashPassword(plain: string): Promise<string> {
  if (plain.length < 8) {
    throw new Error('A password shorter than 8 characters is refused before hashing.');
  }

  const salt = randomBytes(SCRYPT_PARAMS.saltBytes);
  const key = await scrypt(plain.normalize('NFKC'), salt, SCRYPT_PARAMS.keyLength, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    maxmem: MAX_MEMORY,
  });

  return [
    PREFIX,
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

/**
 * Verifies a password against a stored hash.
 *
 * Returns false for every failure — wrong password, unknown algorithm, truncated
 * hash — because distinguishing them would tell an attacker which half they got
 * right.
 */
export async function verifyPassword(plain: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;

  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== PREFIX) return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  // Refuse absurd parameters from a tampered row: a stored N of 2^30 would hang
  // the server for minutes and is a denial-of-service vector.
  if (N < 1024 || N > 1_048_576 || r < 1 || r > 32 || p < 1 || p > 16) return false;

  const salt = Buffer.from(parts[4] ?? '', 'base64');
  const expected = Buffer.from(parts[5] ?? '', 'base64');
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const actual = await scrypt(plain.normalize('NFKC'), salt, expected.length, {
      N,
      r,
      p,
      maxmem: MAX_MEMORY,
    });

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * A hash with no valid password, used to spend the same time on a login attempt
 * for an address that does not exist as for one that does.
 */
export const DUMMY_HASH =
  'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
