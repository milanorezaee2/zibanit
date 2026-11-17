/**
 * GEMORIA — the hall write model.
 *
 * Halls are structural: six permanent galleries whose Persian copy, order and
 * publication state a curator may edit, but whose existence is fixed by the
 * museum's plan. Editing one therefore edits a row, never creates a seventh
 * gallery by accident — and `code` is immutable once created, because it is what
 * every specimen link, seed and test refers to.
 */
import { and, asc, eq, isNull, ne } from 'drizzle-orm';
import type { MuseumDatabase } from '../client';
import { hallTranslations, halls } from '../schema/halls';
import { DEFAULT_LOCALE } from '@/config/app';
import { writeAudit } from './audit';

export type HallStatus = 'draft' | 'published' | 'archived';

export interface HallFormValues {
  readonly code: string;
  readonly latinName: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string | null;
  readonly imageAlt: string | null;
  readonly seoTitle: string | null;
  readonly seoDescription: string | null;
  readonly sortOrder: number;
  readonly isFeatured: boolean;
  readonly coverImageKey: string | null;
}

export type HallMutationResult =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly error: 'duplicate-code' | 'duplicate-slug' | 'not-found' | 'invalid' };

export async function createHall(
  db: MuseumDatabase,
  values: HallFormValues,
  actorId: string | null,
): Promise<HallMutationResult> {
  const [existing] = await db
    .select({ id: halls.id })
    .from(halls)
    .where(eq(halls.code, values.code))
    .limit(1);

  if (existing) return { ok: false, error: 'duplicate-code' };

  const [slugOwner] = await db
    .select({ id: hallTranslations.id })
    .from(hallTranslations)
    .where(
      and(eq(hallTranslations.locale, DEFAULT_LOCALE), eq(hallTranslations.slug, values.slug)),
    )
    .limit(1);

  if (slugOwner) return { ok: false, error: 'duplicate-slug' };

  const id = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(halls)
      .values({
        code: values.code,
        latinName: values.latinName,
        status: 'draft',
        sortOrder: values.sortOrder,
        isFeatured: values.isFeatured,
        coverImageKey: values.coverImageKey,
        heroImageKey: values.coverImageKey,
        createdBy: actorId,
        updatedBy: actorId,
      })
      .returning({ id: halls.id });

    await tx.insert(hallTranslations).values({
      hallId: created!.id,
      locale: DEFAULT_LOCALE,
      slug: values.slug,
      title: values.title,
      summary: values.summary,
      description: values.description,
      imageAlt: values.imageAlt,
      seoTitle: values.seoTitle,
      seoDescription: values.seoDescription,
      searchText: [values.title, values.title, values.latinName, values.summary]
        .join(' ')
        .trim(),
    });

    return created!.id;
  });

  await writeAudit(db, {
    actorId,
    action: 'hall.create',
    entityType: 'hall',
    entityId: id,
    after: { code: values.code, slug: values.slug, title: values.title },
  });

  return { ok: true, id };
}

export async function updateHall(
  db: MuseumDatabase,
  hallId: string,
  values: Omit<HallFormValues, 'code'>,
  actorId: string | null,
): Promise<HallMutationResult> {
  const [existing] = await db
    .select({ id: halls.id, code: halls.code, sortOrder: halls.sortOrder })
    .from(halls)
    .where(eq(halls.id, hallId))
    .limit(1);

  if (!existing) return { ok: false, error: 'not-found' };

  const [slugOwner] = await db
    .select({ id: hallTranslations.id })
    .from(hallTranslations)
    .where(
      and(
        eq(hallTranslations.locale, DEFAULT_LOCALE),
        eq(hallTranslations.slug, values.slug),
        ne(hallTranslations.hallId, hallId),
      ),
    )
    .limit(1);

  if (slugOwner) return { ok: false, error: 'duplicate-slug' };

  await db.transaction(async (tx) => {
    await tx
      .update(halls)
      .set({
        latinName: values.latinName,
        sortOrder: values.sortOrder,
        isFeatured: values.isFeatured,
        coverImageKey: values.coverImageKey,
        heroImageKey: values.coverImageKey,
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(halls.id, hallId));

    await tx
      .update(hallTranslations)
      .set({
        slug: values.slug,
        title: values.title,
        summary: values.summary,
        description: values.description,
        imageAlt: values.imageAlt,
        seoTitle: values.seoTitle,
        seoDescription: values.seoDescription,
        searchText: [values.title, values.latinName, values.summary].join(' ').trim(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(hallTranslations.hallId, hallId),
          eq(hallTranslations.locale, DEFAULT_LOCALE),
        ),
      );
  });

  await writeAudit(db, {
    actorId,
    action: 'hall.update',
    entityType: 'hall',
    entityId: hallId,
    before: { sortOrder: existing.sortOrder },
    after: { slug: values.slug, title: values.title, sortOrder: values.sortOrder },
  });

  return { ok: true, id: hallId };
}

export async function setHallStatus(
  db: MuseumDatabase,
  hallId: string,
  status: HallStatus,
  actorId: string | null,
): Promise<HallMutationResult> {
  const [existing] = await db
    .select({ id: halls.id, status: halls.status, publishedAt: halls.publishedAt })
    .from(halls)
    .where(eq(halls.id, hallId))
    .limit(1);

  if (!existing) return { ok: false, error: 'not-found' };

  await db
    .update(halls)
    .set({
      status,
      publishedAt:
        status === 'published' ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      updatedBy: actorId,
      updatedAt: new Date(),
    })
    .where(eq(halls.id, hallId));

  await writeAudit(db, {
    actorId,
    action: status === 'published' ? 'hall.publish' : 'hall.unpublish',
    entityType: 'hall',
    entityId: hallId,
    before: { status: existing.status },
    after: { status },
  });

  return { ok: true, id: hallId };
}

/**
 * Move a hall one position up or down in the public order.
 *
 * `sort_order` is unique, so a direct swap collides mid-transaction; the mover is
 * parked on a temporary value first. Only the two neighbours change, and the whole
 * thing is one transaction so a failure cannot leave two halls on the same number.
 */
export async function renumberHalls(
  db: MuseumDatabase,
  hallId: string,
  direction: 'up' | 'down',
  actorId: string | null,
): Promise<HallMutationResult> {
  const ordered = await db
    .select({ id: halls.id, sortOrder: halls.sortOrder })
    .from(halls)
    .where(isNull(halls.deletedAt))
    .orderBy(asc(halls.sortOrder));

  const index = ordered.findIndex((hall) => hall.id === hallId);
  const moving = index === -1 ? undefined : ordered[index];
  if (!moving) return { ok: false, error: 'not-found' };

  const target = ordered[direction === 'up' ? index - 1 : index + 1];
  if (!target) return { ok: true, id: hallId };

  const parked = Math.max(...ordered.map((hall) => hall.sortOrder)) + 100;

  await db.transaction(async (tx) => {
    await tx.update(halls).set({ sortOrder: parked, updatedAt: new Date() }).where(eq(halls.id, moving.id));
    await tx
      .update(halls)
      .set({ sortOrder: moving.sortOrder, updatedBy: actorId, updatedAt: new Date() })
      .where(eq(halls.id, target.id));
    await tx
      .update(halls)
      .set({ sortOrder: target.sortOrder, updatedBy: actorId, updatedAt: new Date() })
      .where(eq(halls.id, moving.id));
  });

  await writeAudit(db, {
    actorId,
    action: 'hall.reorder',
    entityType: 'hall',
    entityId: hallId,
    before: { sortOrder: moving.sortOrder },
    after: { sortOrder: target.sortOrder },
  });

  return { ok: true, id: hallId };
}
