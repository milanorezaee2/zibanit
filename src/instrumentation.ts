/**
 * GEMORIA — server startup instrumentation.
 *
 * Runs once, in the Node.js runtime, when the server process starts (not during
 * `next build`, which must remain environment-agnostic so the same artifact can be
 * promoted between environments).
 *
 * Its job is to make a misconfigured production process fail **at boot** rather
 * than on the first visitor. In particular: if NODE_ENV=production and there is no
 * usable PostgreSQL configuration, the process refuses to start. A museum that
 * cannot reach its collection should not pretend to be open.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // `next build` also runs with NODE_ENV=production; it must not require credentials.
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const { assertProductionDatabaseSafety, describeTarget, getServerEnv } = await import('@/lib/env');
  const { APP_PHASE, APP_VERSION } = await import('@/config/app');

  const env = getServerEnv();
  assertProductionDatabaseSafety(env);

  const driver = env.database.driver === 'postgres' ? 'PostgreSQL (server)' : 'PGlite (WASM)';
  console.log(
    [
      `▲ GEMORIA v${APP_VERSION} — phase ${APP_PHASE.number} (${APP_PHASE.name})`,
      `  environment : ${env.nodeEnv}`,
      `  database    : ${driver}`,
      `  target      : ${describeTarget(env.database)}`,
      `  migrations  : ${env.database.autoMigrate ? 'automatic (non-production)' : 'explicit'}`,
    ].join('\n'),
  );
}
