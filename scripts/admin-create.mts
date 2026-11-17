/**
 * GEMORIA — create or update an administrator.
 *
 *   npm run admin:create -- --email curator@gemoria.example --name "کارشناس مجموعه" --role curator
 *
 * The password is read from `ADMIN_PASSWORD` or, when that is absent, typed at a
 * hidden prompt. It is never accepted as a command-line argument: arguments end up
 * in shell history and in `ps` output, which is exactly where a museum's credentials
 * must not be.
 *
 * This is an operator tool, not a route. There is no "first user wins" bootstrap and
 * no self-service registration, so a leaked public URL cannot mint an account.
 */
import { createInterface } from 'node:readline/promises';
import { closeDatabase, openDatabase } from '../src/db/client';
import { users } from '../src/db/schema/identity';
import { hashPassword } from '../src/lib/auth/password';
import { PERMISSIONS, ROLE_PERMISSIONS, type Role } from '../src/lib/auth/permissions';
import { assertProductionDatabaseSafety, describeTarget, getServerEnv } from '../src/lib/env';
import { eq } from 'drizzle-orm';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function readPassword(): Promise<string> {
  const fromEnv = process.env.ADMIN_PASSWORD;
  if (fromEnv && fromEnv.length >= 12) return fromEnv;

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question('گذرواژه (دست‌کم ۱۲ نویسه): ');
    return answer;
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const email = argument('email')?.trim().toLowerCase();
  const name = argument('name') ?? 'مدیر موزه';
  const role = (argument('role') ?? 'super_admin') as Role;

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('✗ A valid --email is required.');
    process.exitCode = 1;
    return;
  }

  if (!Object.hasOwn(ROLE_PERMISSIONS, role)) {
    console.error(`✗ Unknown role "${role}". Known roles: ${Object.keys(ROLE_PERMISSIONS).join(', ')}.`);
    process.exitCode = 1;
    return;
  }

  const password = await readPassword();
  if (password.length < 12) {
    console.error('✗ The password must be at least 12 characters.');
    process.exitCode = 1;
    return;
  }

  const env = getServerEnv();
  assertProductionDatabaseSafety(env);

  const handle = await openDatabase(env.database, { migrate: false });

  try {
    const passwordHash = await hashPassword(password);
    const [existing] = await handle.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      await handle.db
        .update(users)
        .set({ passwordHash, displayName: name, role, status: 'active', updatedAt: new Date() })
        .where(eq(users.id, existing.id));
      console.log(`✓ Updated ${email} (${role}) on ${describeTarget(env.database)}.`);
    } else {
      await handle.db.insert(users).values({
        email,
        displayName: name,
        role,
        status: 'active',
        passwordHash,
      });
      console.log(`✓ Created ${email} (${role}) on ${describeTarget(env.database)}.`);
    }

    console.log(
      `  permissions: ${ROLE_PERMISSIONS[role].length}/${PERMISSIONS.length} — the password is not echoed or stored in plain text.`,
    );
  } finally {
    await handle.close();
    await closeDatabase();
  }
}

main().catch((error: unknown) => {
  console.error('✗ Could not create the administrator.');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
