/**
 * GEMORIA — dashboard read models.
 *
 * These queries exist because a curator needs to see what a visitor cannot: drafts,
 * archived records and their audit history. They are never imported by a public
 * page, and every caller sits behind `requirePermission` — the read model itself
 * makes no access decision, so the guard cannot be forgotten in this layer and
 * silently trusted to exist in another.
 */
import { and, asc, count, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import type { MuseumDatabase } from '@/db/client';
import { auditLog } from '@/db/schema/identity';
import { hallTranslations, halls } from '@/db/schema/halls';
import { specimenTranslations, specimens } from '@/db/schema/specimens';
import { DEFAULT_LOCALE } from '@/config/app';

export interface AdminSpecimenRow {
  readonly id: string;
  readonly inventoryNo: string;
  readonly status: 'draft' | 'scheduled' | 'published' | 'archived';
  readonly slug: string | null;
  readonly title: string | null;
  readonly updatedAt: string;
  readonly isFeatured: boolean;
  readonly deletedAt: string | null;
}

export interface AdminSpecimenList {
  readonly items: readonly AdminSpecimenRow[];
  readonly total: number;
  readonly page: number;
  readonly pageCount: number;
}

/** Every status, newest edit first, with an optional free-text filter. */
export async function listAdminSpecimens(
  db: MuseumDatabase,
  options: { q?: string; status?: string; page?: number; pageSize?: number } = {},
): Promise<AdminSpecimenList> {
  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 100);
  const page = Math.max(options.page ?? 1, 1);

  const conditions = [];
  if (options.status && options.status !== 'all') {
    conditions.push(eq(specimens.status, options.status as 'draft'));
  }
  if (options.q) {
    const needle = `%${options.q.trim()}%`;
    conditions.push(
      or(
        ilike(specimens.inventoryNo, needle),
        ilike(specimenTranslations.title, needle),
        ilike(specimenTranslations.slug, needle),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: specimens.id,
        inventoryNo: specimens.inventoryNo,
        status: specimens.status,
        slug: specimenTranslations.slug,
        title: specimenTranslations.title,
        updatedAt: specimens.updatedAt,
        isFeatured: specimens.isFeatured,
        deletedAt: specimens.deletedAt,
      })
      .from(specimens)
      .leftJoin(
        specimenTranslations,
        and(
          eq(specimenTranslations.specimenId, specimens.id),
          eq(specimenTranslations.locale, DEFAULT_LOCALE),
        ),
      )
      .where(where)
      .orderBy(desc(specimens.updatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count() })
      .from(specimens)
      .leftJoin(
        specimenTranslations,
        and(
          eq(specimenTranslations.specimenId, specimens.id),
          eq(specimenTranslations.locale, DEFAULT_LOCALE),
        ),
      )
      .where(where),
  ]);

  const total = Number(totals[0]?.total ?? 0);

  return {
    items: rows.map((row) => ({
      ...row,
      updatedAt: row.updatedAt.toISOString(),
      deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export interface AdminHallRow {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly slug: string;
  readonly latinName: string;
  readonly status: 'draft' | 'scheduled' | 'published' | 'archived';
  readonly sortOrder: number;
  readonly isFeatured: boolean;
  readonly specimenCount: number;
}

/** All halls including drafts — the visitor's view lives in `queries/halls.ts`. */
export async function listAdminHalls(db: MuseumDatabase): Promise<readonly AdminHallRow[]> {
  const rows = await db
    .select({
      id: halls.id,
      code: halls.code,
      latinName: halls.latinName,
      status: halls.status,
      sortOrder: halls.sortOrder,
      isFeatured: halls.isFeatured,
      title: hallTranslations.title,
      slug: hallTranslations.slug,
      specimenCount: sql<number>`(
        select count(*)::int from hall_specimens hs
        join specimens s on s.id = hs.specimen_id
        where hs.hall_id = ${halls.id} and s.status = 'published' and s.deleted_at is null
      )`,
    })
    .from(halls)
    .leftJoin(
      hallTranslations,
      and(eq(hallTranslations.hallId, halls.id), eq(hallTranslations.locale, DEFAULT_LOCALE)),
    )
    .where(isNull(halls.deletedAt))
    .orderBy(asc(halls.sortOrder));

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title ?? row.code,
    slug: row.slug ?? row.code,
    latinName: row.latinName,
    status: row.status,
    sortOrder: row.sortOrder,
    isFeatured: row.isFeatured,
    specimenCount: Number(row.specimenCount ?? 0),
  }));
}

/** One hall's raw form values. */
export async function getAdminHall(db: MuseumDatabase, hallId: string) {
  const [row] = await db
    .select({
      id: halls.id,
      code: halls.code,
      latinName: halls.latinName,
      status: halls.status,
      sortOrder: halls.sortOrder,
      isFeatured: halls.isFeatured,
      coverImageKey: halls.coverImageKey,
      title: hallTranslations.title,
      slug: hallTranslations.slug,
      summary: hallTranslations.summary,
      description: hallTranslations.description,
      imageAlt: hallTranslations.imageAlt,
      seoTitle: hallTranslations.seoTitle,
      seoDescription: hallTranslations.seoDescription,
    })
    .from(halls)
    .leftJoin(
      hallTranslations,
      and(eq(hallTranslations.hallId, halls.id), eq(hallTranslations.locale, DEFAULT_LOCALE)),
    )
    .where(and(eq(halls.id, hallId), isNull(halls.deletedAt)))
    .limit(1);

  return row ?? null;
}

export interface AuditRow {
  readonly id: number;
  readonly action: string;
  readonly entityType: string | null;
  readonly entityId: string | null;
  readonly actorEmail: string | null;
  readonly createdAt: string;
}

/** The most recent writes, for the dashboard's "who changed what" panel. */
export async function listRecentAudit(db: MuseumDatabase, limit = 12): Promise<readonly AuditRow[]> {
  const { users } = await import('@/db/schema/identity');

  const rows = await db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      actorEmail: users.email,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .orderBy(desc(auditLog.id))
    .limit(limit);

  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

/* ── Editing an existing record ───────────────────────────────────────────── */

export interface AdminSpecimenForm {
  readonly id: string;
  readonly inventoryNo: string;
  readonly status: 'draft' | 'scheduled' | 'published' | 'archived';
  readonly scientificName: string | null;
  readonly chemicalFormula: string | null;
  readonly crystalSystem: string | null;
  readonly mohsMin: string | null;
  readonly mohsMax: string | null;
  readonly densityMin: string | null;
  readonly densityMax: string | null;
  readonly refractiveIndexMin: string | null;
  readonly refractiveIndexMax: string | null;
  readonly weightCt: string | null;
  readonly dimensionsMm: string | null;
  readonly pieces: number;
  readonly acquiredAt: string | null;
  readonly certificateRef: string | null;
  readonly isFeatured: boolean;
  readonly isHighlight: boolean;
  readonly primaryMediaId: string | null;
  readonly mineralFamilyId: string | null;
  readonly scientificGroupId: string | null;
  readonly specimenTypeId: string | null;
  readonly originKindId: string | null;
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly summary: string | null;
  readonly story: string | null;
  readonly formation: string | null;
  readonly history: string | null;
  readonly notes: string | null;
  readonly colors: readonly string[];
  readonly transparency: readonly string[];
  readonly luster: string | null;
  readonly cleavage: string | null;
  readonly fracture: string | null;
  readonly seoTitle: string | null;
  readonly seoDescription: string | null;
  readonly hallCodes: readonly string[];
  readonly galleryIds: readonly string[];
  readonly provenances: readonly {
    countryName: string | null;
    countryCode: string | null;
    region: string | null;
    locality: string | null;
    note: string | null;
  }[];
}

/** The complete editable state of one object, for the form. */
export async function getAdminSpecimen(
  db: MuseumDatabase,
  specimenId: string,
): Promise<AdminSpecimenForm | null> {
  const { specimenProvenances, specimenMedia } = await import('@/db/schema/specimens');
  const { hallSpecimens } = await import('@/db/schema/halls');

  const [row] = await db
    .select({
      id: specimens.id,
      inventoryNo: specimens.inventoryNo,
      status: specimens.status,
      scientificName: specimens.scientificName,
      chemicalFormula: specimens.chemicalFormula,
      crystalSystem: specimens.crystalSystem,
      mohsMin: specimens.mohsMin,
      mohsMax: specimens.mohsMax,
      densityMin: specimens.densityMin,
      densityMax: specimens.densityMax,
      refractiveIndexMin: specimens.refractiveIndexMin,
      refractiveIndexMax: specimens.refractiveIndexMax,
      weightCt: specimens.weightCt,
      dimensionsMm: specimens.dimensionsMm,
      pieces: specimens.pieces,
      acquiredAt: specimens.acquiredAt,
      certificateRef: specimens.certificateRef,
      isFeatured: specimens.isFeatured,
      isHighlight: specimens.isHighlight,
      primaryMediaId: specimens.primaryMediaId,
      mineralFamilyId: specimens.mineralFamilyId,
      scientificGroupId: specimens.scientificGroupId,
      specimenTypeId: specimens.specimenTypeId,
      originKindId: specimens.originKindId,
      slug: specimenTranslations.slug,
      title: specimenTranslations.title,
      subtitle: specimenTranslations.subtitle,
      summary: specimenTranslations.summary,
      story: specimenTranslations.story,
      formation: specimenTranslations.formation,
      history: specimenTranslations.history,
      notes: specimenTranslations.notes,
      colors: specimenTranslations.colors,
      transparency: specimenTranslations.transparency,
      luster: specimenTranslations.luster,
      cleavage: specimenTranslations.cleavage,
      fracture: specimenTranslations.fracture,
      seoTitle: specimenTranslations.seoTitle,
      seoDescription: specimenTranslations.seoDescription,
    })
    .from(specimens)
    .innerJoin(
      specimenTranslations,
      and(
        eq(specimenTranslations.specimenId, specimens.id),
        eq(specimenTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(eq(specimens.id, specimenId))
    .limit(1);

  if (!row) return null;

  const [places, gallery, hallLinks] = await Promise.all([
    db
      .select({
        countryName: specimenProvenances.countryName,
        countryCode: specimenProvenances.countryCode,
        region: specimenProvenances.region,
        locality: specimenProvenances.locality,
        note: specimenProvenances.note,
      })
      .from(specimenProvenances)
      .where(eq(specimenProvenances.specimenId, specimenId))
      .orderBy(asc(specimenProvenances.sortOrder)),
    db
      .select({ mediaId: specimenMedia.mediaId })
      .from(specimenMedia)
      .where(eq(specimenMedia.specimenId, specimenId))
      .orderBy(asc(specimenMedia.sortOrder)),
    db
      .select({ code: halls.code })
      .from(hallSpecimens)
      .innerJoin(halls, eq(halls.id, hallSpecimens.hallId))
      .where(eq(hallSpecimens.specimenId, specimenId)),
  ]);

  return {
    ...row,
    colors: row.colors ?? [],
    transparency: row.transparency ?? [],
    hallCodes: hallLinks.map((link) => link.code),
    galleryIds: gallery.map((entry) => entry.mediaId),
    provenances: places,
  };
}
