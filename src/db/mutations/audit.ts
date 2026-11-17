/**
 * GEMORIA — the audit trail.
 *
 * Every write through the dashboard records who did it, what changed, and when.
 * A museum that catalogues objects has to be able to answer "who altered this
 * record, and what did it say before" — that is a curatorial requirement, not a
 * debugging convenience, so it is written by the same service that performs the
 * write rather than by a logger someone might remove.
 *
 * Only an actor id, an action name, the entity, and the before/after snapshots are
 * stored. No password, no session token and no request body ever reaches this
 * table: the `before`/`after` objects are built explicitly by each caller, not
 * spread from a request.
 */
import type { MuseumDatabase } from '../client';
import { auditLog } from '../schema/identity';

export type AuditAction =
  | 'specimen.create'
  | 'specimen.update'
  | 'specimen.publish'
  | 'specimen.unpublish'
  | 'specimen.archive'
  | 'specimen.delete'
  | 'hall.create'
  | 'hall.update'
  | 'hall.publish'
  | 'hall.unpublish'
  | 'hall.reorder'
  | 'media.register'
  | 'session.sign-in'
  | 'session.sign-out';

export interface AuditEntry {
  readonly actorId: string | null;
  readonly action: AuditAction;
  readonly entityType: 'specimen' | 'hall' | 'media' | 'session';
  readonly entityId?: string | null;
  readonly before?: Record<string, unknown> | null;
  readonly after?: Record<string, unknown> | null;
  readonly ipHash?: string | null;
  readonly userAgent?: string | null;
}

export async function writeAudit(db: MuseumDatabase, entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      ipHash: entry.ipHash ?? null,
      userAgent: entry.userAgent?.slice(0, 300) ?? null,
    });
  } catch (error) {
    /*
     * An audit write must never hide a successful change, and a failed change must
     * never be recorded as if it happened. The failure is logged loudly so an
     * operator can act on it; the caller's transaction has already committed or
     * rolled back on its own terms.
     */
    console.error(
      '[gemoria] audit write failed:',
      error instanceof Error ? error.message : 'unknown error',
    );
  }
}
