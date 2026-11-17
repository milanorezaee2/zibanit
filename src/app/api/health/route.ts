import { getSystemStatus } from '@/lib/system-status';

/**
 * GET /api/health
 *
 * The single machine-readable health signal for this application. It answers
 * three questions a deployment needs answered:
 *
 *   1. Is the process alive?                      → HTTP 200/503
 *   2. Which database is it talking to?           → database.driver / target
 *   3. Is the schema actually migrated?           → database.migrations
 *
 * It never returns a connection string, a credential or a driver stack trace:
 * `getSystemStatus` reduces failures to a coarse category. Diagnostics belong in
 * the server log, not on a public endpoint.
 *
 * Unauthenticated by design (orchestrators cannot hold cookies) but deliberately
 * low-information.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const status = await getSystemStatus();

  const httpStatus = status.database.reachable && status.database.schemaReady ? 200 : 503;

  return Response.json(status, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'X-Robots-Tag': 'noindex',
    },
  });
}
