/**
 * GEMORIA — the specimen write model.
 *
 * All catalogue mutation goes through this module. It is deliberately not a
 * repository of one-liners: each function is one *transaction* that leaves the
 * object, its translation, its classification, its halls, its provenance, its
 * gallery and its search document consistent — or leaves nothing changed at all.
 *
 * The pieces of the write:
 *
 *   1. `specimens`            language-neutral facts (formula, hardness, status)
 *   2. `specimen_translations` everything a visitor reads, per locale
 *   3. `hall_specimens`        where it hangs (many halls, one row each)
 *   4. `specimen_provenances`  where it came from (many places, coordinates ready)
 *   5. `specimen_media`        its gallery, by role
 *   6. `search_text`           rebuilt from 1–5 so the index never drifts
 *   7. `audit_log`             who did this, and what the record said before
 *
 * Uniqueness is enforced by the database (inventory number, slug per locale) *and*
 * checked here so the dashboard can say «این شمارهٔ اموال قبلاً ثبت شده است»
 * instead of showing a constraint violation.
 */
import { and, eq, inArray, isNull, ne } from 'drizzle-orm';
import type { MuseumDatabase } from '../client';
import { hallSpecimens, halls } from '../schema/halls';
import {
  specimenMedia,
  specimenProvenances,
  specimenRelations,
  specimenTranslations,
  specimens,
} from '../schema/specimens';
import { recomputeSpecimenSearchText } from '../search-index';
import { DEFAULT_LOCALE } from '@/config/app';
import type { SpecimenFormValues } from '@/lib/validation/specimen';
import { writeAudit } from './audit';

/** The transaction handle's own type — assignments stay exact, with no casts. */
type Tx = Parameters<Parameters<MuseumDatabase['transaction']>[0]>[0];

export type SpecimenStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type MutationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: 'duplicate-inventory' | 'duplicate-slug' | 'not-found' | 'invalid' };

const EMPTY = (value: string | null): string | null => (value === '' ? null : value);

/** Rows that actually carry data — an empty form row must not create a locality. */
function meaningfulProvenances(values: SpecimenFormValues) {
  return values.provenances
    .filter((entry) => Boolean(entry.countryName ?? entry.countryCode ?? entry.region ?? entry.locality ?? entry.note))
    .slice(0, 12);
}

function neutralColumns(values: SpecimenFormValues) {
  return {
    inventoryNo: values.inventoryNo,
    scientificName: EMPTY(values.scientificName),
    chemicalFormula: EMPTY(values.chemicalFormula),
    crystalSystem: (EMPTY(values.crystalSystem) as
      | 'triclinic'
      | 'monoclinic'
      | 'orthorhombic'
      | 'tetragonal'
      | 'trigonal'
      | 'hexagonal'
      | 'cubic'
      | null),
    mohsMin: EMPTY(values.mohsMin),
    mohsMax: EMPTY(values.mohsMax),
    densityMin: EMPTY(values.densityMin),
    densityMax: EMPTY(values.densityMax),
    refractiveIndexMin: EMPTY(values.refractiveIndexMin),
    refractiveIndexMax: EMPTY(values.refractiveIndexMax),
    mineralFamilyId: values.mineralFamilyId,
    scientificGroupId: values.scientificGroupId,
    specimenTypeId: values.specimenTypeId,
    originKindId: values.originKindId,
    weightCt: EMPTY(values.weightCt),
    dimensionsMm: EMPTY(values.dimensionsMm),
    pieces: values.pieces,
    acquiredAt: EMPTY(values.acquiredAt),
    certificateRef: EMPTY(values.certificateRef),
    primaryMediaId: values.primaryMediaId,
    isFeatured: values.isFeatured,
    isHighlight: values.isHighlight,
    updatedAt: new Date(),
  };
}

function translationColumns(values: SpecimenFormValues) {
  return {
    slug: values.slug,
    title: values.title,
    subtitle: EMPTY(values.subtitle),
    summary: EMPTY(values.summary),
    story: EMPTY(values.story),
    formation: EMPTY(values.formation),
    history: EMPTY(values.history),
    notes: EMPTY(values.notes),
    colors: values.colors.length > 0 ? values.colors : null,
    transparency: values.transparency.length > 0 ? values.transparency : null,
    luster: EMPTY(values.luster),
    cleavage: EMPTY(values.cleavage),
    fracture: EMPTY(values.fracture),
    seoTitle: EMPTY(values.seoTitle),
    seoDescription: EMPTY(values.seoDescription),
    updatedAt: new Date(),
  };
}

async function replaceHalls(
  tx: Tx,
  specimenId: string,
  codes: readonly string[],
): Promise<void> {
  await tx.delete(hallSpecimens).where(eq(hallSpecimens.specimenId, specimenId));
  if (codes.length === 0) return;

  const rows = await tx
    .select({ id: halls.id })
    .from(halls)
    .where(and(inArray(halls.code, codes as string[]), isNull(halls.deletedAt)));

  if (rows.length === 0) return;

  await tx.insert(hallSpecimens).values(
    rows.map((hall, index) => ({
      hallId: hall.id,
      specimenId,
      sortOrder: (index + 1) * 10,
    })),
  );
}

async function replaceProvenances(
  tx: Tx,
  specimenId: string,
  values: SpecimenFormValues,
): Promise<void> {
  await tx.delete(specimenProvenances).where(eq(specimenProvenances.specimenId, specimenId));

  const entries = meaningfulProvenances(values);
  if (entries.length === 0) return;

  await tx.insert(specimenProvenances).values(
    entries.map((entry, index) => ({
      specimenId,
      countryName: entry.countryName,
      countryCode: entry.countryCode,
      region: entry.region,
      locality: entry.locality,
      note: entry.note,
      isPrimary: index === 0,
      sortOrder: index * 10,
    })),
  );
}

async function replaceGallery(
  tx: Tx,
  specimenId: string,
  mediaIds: readonly string[],
): Promise<void> {
  await tx.delete(specimenMedia).where(eq(specimenMedia.specimenId, specimenId));
  if (mediaIds.length === 0) return;

  await tx.insert(specimenMedia).values(
    mediaIds.map((mediaId, index) => ({
      specimenId,
      mediaId,
      role: 'gallery' as const,
      sortOrder: index * 10,
    })),
  );
}

async function auditSnapshot(db: MuseumDatabase, specimenId: string) {
  const [row] = await db
    .select({
      inventoryNo: specimens.inventoryNo,
      status: specimens.status,
      slug: specimenTranslations.slug,
      title: specimenTranslations.title,
      isFeatured: specimens.isFeatured,
    })
    .from(specimens)
    .leftJoin(
      specimenTranslations,
      and(
        eq(specimenTranslations.specimenId, specimens.id),
        eq(specimenTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(eq(specimens.id, specimenId))
    .limit(1);

  return row ?? null;
}

export async function createSpecimen(
  db: MuseumDatabase,
  values: SpecimenFormValues,
  actorId: string | null,
): Promise<MutationResult<{ id: string; slug: string }>> {
  const existing = await db
    .select({ id: specimens.id })
    .from(specimens)
    .where(eq(specimens.inventoryNo, values.inventoryNo))
    .limit(1);

  if (existing.length > 0) return { ok: false, error: 'duplicate-inventory' };

  const slugOwner = await db
    .select({ id: specimenTranslations.specimenId })
    .from(specimenTranslations)
    .where(
      and(
        eq(specimenTranslations.locale, DEFAULT_LOCALE),
        eq(specimenTranslations.slug, values.slug),
      ),
    )
    .limit(1);

  if (slugOwner.length > 0) return { ok: false, error: 'duplicate-slug' };

  try {
    const id = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(specimens)
        .values({
          ...neutralColumns(values),
          status: 'draft',
          createdBy: actorId,
          updatedBy: actorId,
        })
        .returning({ id: specimens.id });

      const specimenId = created!.id;

      await tx.insert(specimenTranslations).values({
        specimenId,
        locale: DEFAULT_LOCALE,
        ...translationColumns(values),
      });

      await replaceHalls(tx, specimenId, values.halls);
      await replaceProvenances(tx, specimenId, values);
      await replaceGallery(tx, specimenId, values.galleryMediaIds);
      await recomputeSpecimenSearchText(tx, specimenId);

      return specimenId;
    });

    await writeAudit(db, {
      actorId,
      action: 'specimen.create',
      entityType: 'specimen',
      entityId: id,
      after: { inventoryNo: values.inventoryNo, slug: values.slug, title: values.title },
    });

    return { ok: true, value: { id, slug: values.slug } };
  } catch (error) {
    console.error('[gemoria] createSpecimen failed:', error instanceof Error ? error.message : 'unknown');
    return { ok: false, error: 'invalid' };
  }
}

export async function updateSpecimen(
  db: MuseumDatabase,
  specimenId: string,
  values: SpecimenFormValues,
  actorId: string | null,
): Promise<MutationResult<{ slug: string }>> {
  const existing = await db
    .select({ id: specimens.id, inventoryNo: specimens.inventoryNo })
    .from(specimens)
    .where(eq(specimens.id, specimenId))
    .limit(1);

  if (existing.length === 0) return { ok: false, error: 'not-found' };

  const duplicateInventory = await db
    .select({ id: specimens.id })
    .from(specimens)
    .where(and(eq(specimens.inventoryNo, values.inventoryNo), ne(specimens.id, specimenId)))
    .limit(1);

  if (duplicateInventory.length > 0) return { ok: false, error: 'duplicate-inventory' };

  const duplicateSlug = await db
    .select({ id: specimenTranslations.specimenId })
    .from(specimenTranslations)
    .where(
      and(
        eq(specimenTranslations.locale, DEFAULT_LOCALE),
        eq(specimenTranslations.slug, values.slug),
        ne(specimenTranslations.specimenId, specimenId),
      ),
    )
    .limit(1);

  if (duplicateSlug.length > 0) return { ok: false, error: 'duplicate-slug' };

  const before = await auditSnapshot(db, specimenId);

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(specimens)
        .set({ ...neutralColumns(values), updatedBy: actorId })
        .where(eq(specimens.id, specimenId));

      const updated = await tx
        .update(specimenTranslations)
        .set(translationColumns(values))
        .where(
          and(
            eq(specimenTranslations.specimenId, specimenId),
            eq(specimenTranslations.locale, DEFAULT_LOCALE),
          ),
        )
        .returning({ id: specimenTranslations.id });

      if (updated.length === 0) {
        await tx.insert(specimenTranslations).values({
          specimenId,
          locale: DEFAULT_LOCALE,
          ...translationColumns(values),
        });
      }

      await replaceHalls(tx, specimenId, values.halls);
      await replaceProvenances(tx, specimenId, values);
      await replaceGallery(tx, specimenId, values.galleryMediaIds);
      await recomputeSpecimenSearchText(tx, specimenId);
    });

    await writeAudit(db, {
      actorId,
      action: 'specimen.update',
      entityType: 'specimen',
      entityId: specimenId,
      before: before ?? null,
      after: { inventoryNo: values.inventoryNo, slug: values.slug, title: values.title },
    });

    return { ok: true, value: { slug: values.slug } };
  } catch (error) {
    console.error('[gemoria] updateSpecimen failed:', error instanceof Error ? error.message : 'unknown');
    return { ok: false, error: 'invalid' };
  }
}

/**
 * Moves an object through its lifecycle.
 *
 * `published_at` is stamped the first time an object is published and never
 * overwritten by a later edit: the museum's "newest" ordering is the date it went
 * on display, not the date someone fixed a typo.
 */
export async function setSpecimenStatus(
  db: MuseumDatabase,
  specimenId: string,
  status: SpecimenStatus,
  actorId: string | null,
): Promise<MutationResult<{ status: SpecimenStatus }>> {
  const [existing] = await db
    .select({ status: specimens.status, publishedAt: specimens.publishedAt })
    .from(specimens)
    .where(eq(specimens.id, specimenId))
    .limit(1);

  if (!existing) return { ok: false, error: 'not-found' };

  await db
    .update(specimens)
    .set({
      status,
      publishedAt:
        status === 'published' ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      updatedBy: actorId,
      updatedAt: new Date(),
    })
    .where(eq(specimens.id, specimenId));

  const action =
    status === 'published'
      ? 'specimen.publish'
      : status === 'archived'
        ? 'specimen.archive'
        : 'specimen.unpublish';

  await writeAudit(db, {
    actorId,
    action,
    entityType: 'specimen',
    entityId: specimenId,
    before: { status: existing.status },
    after: { status },
  });

  return { ok: true, value: { status } };
}

/**
 * Removes an object from the museum without destroying the record.
 *
 * `deletedAt` is set and the status is archived, so the row, its translations, its
 * provenance and its audit history all survive; the public queries filter on
 * `deletedAt is null`. A museum does not shred its accession register because a
 * curator pressed delete — and because the operation is reversible, a mistake is
 * recoverable by an administrator with database access.
 */
export async function softDeleteSpecimen(
  db: MuseumDatabase,
  specimenId: string,
  actorId: string | null,
): Promise<MutationResult<{ id: string }>> {
  const [existing] = await db
    .select({ id: specimens.id, inventoryNo: specimens.inventoryNo })
    .from(specimens)
    .where(eq(specimens.id, specimenId))
    .limit(1);

  if (!existing) return { ok: false, error: 'not-found' };

  await db
    .update(specimens)
    .set({ deletedAt: new Date(), status: 'archived', updatedBy: actorId, updatedAt: new Date() })
    .where(eq(specimens.id, specimenId));

  await writeAudit(db, {
    actorId,
    action: 'specimen.delete',
    entityType: 'specimen',
    entityId: specimenId,
    before: { inventoryNo: existing.inventoryNo },
    after: { deletedAt: new Date().toISOString() },
  });

  return { ok: true, value: { id: specimenId } };
}

/** Curated relations. Built as a set: the editor submits the full list. */
export async function replaceSpecimenRelations(
  db: MuseumDatabase,
  specimenId: string,
  relatedIds: readonly string[],
  actorId: string | null,
): Promise<MutationResult<{ count: number }>> {
  const filtered = relatedIds.filter((id) => id !== specimenId).slice(0, 12);

  await db.transaction(async (tx) => {
    await tx.delete(specimenRelations).where(eq(specimenRelations.specimenId, specimenId));

    if (filtered.length > 0) {
      await tx.insert(specimenRelations).values(
        filtered.map((relatedId, index) => ({
          specimenId,
          relatedSpecimenId: relatedId,
          kind: 'related' as const,
          sortOrder: (index + 1) * 10,
        })),
      );
    }
  });

  await writeAudit(db, {
    actorId,
    action: 'specimen.update',
    entityType: 'specimen',
    entityId: specimenId,
    after: { relations: filtered.length },
  });

  return { ok: true, value: { count: filtered.length } };
}
