/**
 * GEMORIA — deployment preflight.
 *
 *   npm start   →  preflight  →  server
 *
 * Validates the environment *before* a production process is allowed to bind a
 * port. Next.js logs an instrumentation failure and keeps the process alive; that
 * is not good enough for a museum. This script exits non-zero, so `npm start` (and
 * any container CMD built on it) cannot come up misconfigured.
 *
 * Deliberately checks configuration only — not reachability. During a rolling
 * deployment the database may legitimately be a few seconds behind the web
 * process; `/api/health` is the signal for that, and it returns 503 until the
 * database is genuinely ready.
 */
import { assertProductionDatabaseSafety, describeTarget, loadServerEnv } from '../src/lib/env';

/**
 * `npm start` launches the production server, and the production server runs with
 * NODE_ENV=production. This standalone Node process, however, inherits whatever the
 * shell has — often nothing. Validating *that* would silently downgrade every rule
 * to the development set and the production guard would never fire.
 *
 * So the start path declares its own context explicitly: `--production` (or
 * GEMORIA_PREFLIGHT_MODE=production) means "validate as production".
 */
const asProduction =
  process.argv.includes('--production') || process.env.GEMORIA_PREFLIGHT_MODE === 'production';

try {
  const env = loadServerEnv(
    asProduction ? { ...process.env, NODE_ENV: 'production' } : process.env,
  );
  assertProductionDatabaseSafety(env);

  console.log(
    [
      '▶ GEMORIA preflight',
      `  environment : ${env.nodeEnv}`,
      `  driver      : ${env.database.driver}`,
      `  target      : ${describeTarget(env.database)}`,
      `  validating  : ${asProduction ? 'production rules (npm start)' : 'shell environment'}`,
      '✓ Configuration is valid.',
    ].join('\n'),
  );
} catch (error) {
  console.error('');
  console.error(error instanceof Error ? error.message : error);
  console.error('');
  console.error('✗ Refusing to start. Fix the configuration above and run again.');
  console.error('');
  process.exit(1);
}
