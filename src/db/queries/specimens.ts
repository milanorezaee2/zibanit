/**
 * GEMORIA — read model for the collection.
 *
 * Every public page that shows an object goes through this module. Components
 * render what they are given and own no query, no filter rule and no notion of
 * what "published" means.
 *
 * Rules enforced here, once, rather than in JSX:
 *
 *   • only `published`, non-deleted objects with a Persian translation are public
 *   • a missing scientific value is returned as `null`, never defaulted: the page
 *     omits the row instead of inventing a number
 *   • list queries are paginated in SQL; nothing ever loads "all specimens"
 *   • reads that join several tables do so in one statement, then fetch their
 *     children (gallery, provenance, relations) by id set — no N+1
 *   • an unreachable database degrades to an honest empty state instead of taking
 *     the page down with it
 */
import { and, asc, count, desc, eq, isNull, ne, or, sql } from 'drizzle-orm';
import type { MuseumDatabase } from '@/db/client';
import { resolveDb } from './executor';
import { articleSpecimens, articleTranslations, articles } from '@/db/schema/articles';
import { hallSpecimens, hallTranslations, halls } from '@/db/schema/halls';
import { mediaAssets, mediaTranslations } from '@/db/schema/media';
import {
  specimenMedia,
  specimenProvenances,
  specimenRelations,
  specimenTranslations,
  specimens,
} from '@/db/schema/specimens';
import { taxonomyTermTranslations, taxonomyTerms } from '@/db/schema/taxonomy';
import { DEFAULT_LOCALE } from '@/config/app';
import {
  mediaUrl,
  type ResolvedImage,
  type StorageDriverName,
} from '@/lib/media/storage';
import { normalizeQuery } from '@/lib/search/normalize';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface SpecimenImage extends ResolvedImage {
  readonly alt: string;
}

export interface SpecimenCard {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  /** The Latin/scientific designation, printed small beneath the Persian name. */
  readonly subtitle: string | null;
  readonly scientificName: string | null;
  readonly summary: string | null;
  readonly provenance: string | null;
  readonly weightCt: string | null;
  readonly mineralFamily: string | null;
  readonly image: SpecimenImage | null;
}

export type SortKey = 'newest' | 'oldest' | 'title-fa' | 'title-en';
export type MediaFilter = 'image' | 'video' | 'model' | 'panorama';

export interface SpecimenQuery {
  readonly q?: string | null;
  readonly hall?: string | null;
  readonly family?: string | null;
  readonly color?: string | null;
  readonly hardness?: number | null;
  readonly transparency?: string | null;
  readonly country?: string | null;
  readonly media?: MediaFilter | null;
  readonly sort?: SortKey;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface SpecimenListResult {
  readonly state: 'ready' | 'empty' | 'unavailable';
  readonly items: readonly SpecimenCard[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
  /** True when filters are active — an empty result then means "no match". */
  readonly filtered: boolean;
  readonly reason?: string;
}

export type FeaturedResult =
  | { readonly state: 'ready'; readonly items: readonly SpecimenCard[] }
  | { readonly state: 'empty'; readonly items: readonly [] }
  | { readonly state: 'unavailable'; readonly items: readonly []; readonly reason: string };

export interface ProvenanceEntry {
  readonly id: string;
  readonly countryName: string | null;
  readonly countryCode: string | null;
  readonly region: string | null;
  readonly locality: string | null;
  readonly note: string | null;
  readonly latitude: string | null;
  readonly longitude: string | null;
  readonly isPrimary: boolean;
}

export interface GalleryEntry {
  readonly id: string;
  readonly kind: 'image' | 'video' | 'model' | 'panorama' | 'document';
  readonly role: 'gallery' | 'macro' | 'video' | 'model' | 'panorama' | 'primary';
  readonly caption: string | null;
  readonly image: SpecimenImage | null;
  readonly durationSeconds: string | null;
}

export interface ClassificationEntry {
  readonly kind: 'mineral_family' | 'scientific_group' | 'specimen_type' | 'origin_kind';
  readonly code: string;
  readonly label: string;
  readonly latinName: string | null;
}

export interface SpecimenDetail {
  readonly id: string;
  readonly inventoryNo: string;
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly scientificName: string | null;
  readonly summary: string | null;
  readonly story: string | null;
  readonly formation: string | null;
  readonly history: string | null;
  readonly notes: string | null;

  /* Scientific record — every value nullable. */
  readonly chemicalFormula: string | null;
  readonly crystalSystem: string | null;
  readonly mohsMin: string | null;
  readonly mohsMax: string | null;
  readonly densityMin: string | null;
  readonly densityMax: string | null;
  readonly refractiveIndexMin: string | null;
  readonly refractiveIndexMax: string | null;

  /* Descriptive record. */
  readonly colors: readonly string[];
  readonly transparency: readonly string[];
  readonly luster: string | null;
  readonly cleavage: string | null;
  readonly fracture: string | null;

  /* Accession. */
  readonly weightCt: string | null;
  readonly dimensionsMm: string | null;
  readonly pieces: number;
  readonly acquiredAt: string | null;
  readonly certificateRef: string | null;

  /** The curator's one-line origin note, when there is one. */
  readonly provenanceText: string | null;
  readonly image: SpecimenImage | null;
  readonly gallery: readonly GalleryEntry[];
  readonly classification: readonly ClassificationEntry[];
  readonly provenance: readonly ProvenanceEntry[];
  readonly halls: readonly { slug: string; title: string }[];
  readonly related: readonly SpecimenCard[];
  readonly articles: readonly { slug: string; title: string; excerpt: string | null }[];
  readonly publishedAt: string | null;
  readonly updatedAt: string;
}

export interface FilterOptions {
  readonly families: readonly { code: string; label: string; total: number }[];
  readonly colors: readonly { value: string; total: number }[];
  readonly countries: readonly { code: string; name: string; total: number }[];
  readonly transparency: readonly { value: string; total: number }[];
  readonly halls: readonly { code: string; title: string; total: number }[];
}

/* ── Shared plumbing ───────────────────────────────────────────────────────── */

/** Public visibility, expressed once. */
const publicSpecimen = and(
  eq(specimens.status, 'published'),
  isNull(specimens.deletedAt),
  eq(specimenTranslations.locale, DEFAULT_LOCALE),
);

function resolveImage(row: {
  key: string | null;
  width: number | null;
  height: number | null;
  driver: string | null;
  dominantHex: string | null;
  blurDataUrl: string | null;
  alt: string | null;
}, fallbackAlt: string): SpecimenImage | null {
  if (!row.key || !row.width || !row.height) return null;

  try {
    return {
      src: mediaUrl(row.key, (row.driver ?? 'local') as StorageDriverName),
      width: row.width,
      height: row.height,
      alt: row.alt ?? fallbackAlt,
      ...(row.blurDataUrl ? { blurDataURL: row.blurDataUrl } : {}),
      ...(row.dominantHex ? { dominantHex: row.dominantHex } : {}),
    };
  } catch {
    // An unsafe storage key is a data defect, not a page defect: the object is
    // shown without its photograph rather than crashing the gallery.
    console.error('[gemoria] refusing an unsafe media key');
    return null;
  }
}

/**
 * The card projection, joined once.
 *
 * `primary_media_id` is left-joined (an object may not be photographed yet), and
 * the media translation is left-joined for its Persian alternative text — a
 * screen reader reads "زمرد موزو، برش زمرد از موگوک" rather than "تصویر".
 */
function cardSelection() {
  return {
    id: specimens.id,
    slug: specimenTranslations.slug,
    title: specimenTranslations.title,
    subtitle: specimenTranslations.subtitle,
    scientificName: specimens.scientificName,
    summary: specimenTranslations.summary,
    provenance: specimens.provenance,
    weightCt: specimens.weightCt,
    familyLabel: taxonomyTermTranslations.label,
    mediaKey: mediaAssets.storageKey,
    mediaWidth: mediaAssets.width,
    mediaHeight: mediaAssets.height,
    mediaDriver: mediaAssets.storageDriver,
    mediaHex: mediaAssets.dominantHex,
    mediaAlt: mediaTranslations.altText,
  };
}

type CardRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  scientificName: string | null;
  summary: string | null;
  provenance: string | null;
  weightCt: string | null;
  familyLabel: string | null;
  mediaKey: string | null;
  mediaWidth: number | null;
  mediaHeight: number | null;
  mediaDriver: string | null;
  mediaHex: string | null;
  mediaAlt: string | null;
};

function toCard(row: CardRow): SpecimenCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    scientificName: row.scientificName,
    summary: row.summary,
    provenance: row.provenance,
    weightCt: row.weightCt,
    mineralFamily: row.familyLabel,
    image: resolveImage(
      {
        key: row.mediaKey,
        width: row.mediaWidth,
        height: row.mediaHeight,
        driver: row.mediaDriver,
        dominantHex: row.mediaHex,
        blurDataUrl: null,
        alt: row.mediaAlt,
      },
      row.title,
    ),
  };
}

/* ── Homepage ──────────────────────────────────────────────────────────────── */

/**
 * Published, featured objects for the homepage.
 *
 * `state` distinguishes "the museum has nothing to show yet" from "the database
 * could not be read" — they look similar to a visitor but mean very different
 * things to whoever is on call.
 */
export async function getFeaturedSpecimens(
  limit = 6,
  db?: MuseumDatabase,
): Promise<FeaturedResult> {
  try {
    const client = await resolveDb(db);

    const rows = await client
      .select(cardSelection())
      .from(specimens)
      .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
      .leftJoin(mediaAssets, eq(mediaAssets.id, specimens.primaryMediaId))
      .leftJoin(
        mediaTranslations,
        and(eq(mediaTranslations.mediaId, mediaAssets.id), eq(mediaTranslations.locale, DEFAULT_LOCALE)),
      )
      .leftJoin(taxonomyTerms, eq(taxonomyTerms.id, specimens.mineralFamilyId))
      .leftJoin(
        taxonomyTermTranslations,
        and(
          eq(taxonomyTermTranslations.termId, taxonomyTerms.id),
          eq(taxonomyTermTranslations.locale, DEFAULT_LOCALE),
        ),
      )
      .where(and(publicSpecimen, eq(specimens.isFeatured, true)))
      .orderBy(desc(specimens.publishedAt), desc(specimens.createdAt))
      .limit(limit);

    const items = rows.map(toCard);
    return items.length === 0 ? { state: 'empty', items: [] } : { state: 'ready', items };
  } catch (error) {
    console.error(
      '[gemoria] featured specimens unavailable:',
      error instanceof Error ? error.message : 'unknown error',
    );
    return { state: 'unavailable', items: [], reason: 'database_unavailable' };
  }
}

/* ── Filtering, sorting, pagination ────────────────────────────────────────── */

const SORT_CLAUSES: Record<SortKey, ReturnType<typeof sql>[]> = {
  newest: [sql`${specimens.publishedAt} desc nulls last`, sql`${specimens.createdAt} desc`],
  oldest: [sql`${specimens.publishedAt} asc nulls first`, sql`${specimens.createdAt} asc`],
  // Persian alphabetical order comes from a materialised key, not from the
  // cluster's collation: see `persianSortKey()`.
  'title-fa': [sql`${specimenTranslations.titleSortKey} asc nulls last`],
  'title-en': [sql`lower(coalesce(${specimens.scientificName}, ${specimenTranslations.subtitle})) asc nulls last`],
};

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 48;

function clampPage(page: number | undefined): number {
  if (!page || !Number.isFinite(page) || page < 1) return 1;
  return Math.min(Math.floor(page), 10_000);
}

function clampPageSize(size: number | undefined): number {
  if (!size || !Number.isFinite(size) || size < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(size), MAX_PAGE_SIZE);
}

/**
 * Builds the WHERE clause for a visitor's query.
 *
 * Every user-supplied value is a bound parameter — `sql` template interpolation,
 * never string concatenation — so the filter options cannot carry SQL. The only
 * `sql.raw` in this module is the count expression, which contains no input.
 */
function buildConditions(query: SpecimenQuery) {
  const conditions = [publicSpecimen];

  const normalized = query.q ? normalizeQuery(query.q) : '';

  if (normalized.length > 0) {
    /*
     * Two mechanisms, on purpose:
     *
     *   • full-text search on the generated tsvector — the indexed path, and the
     *     one that scales; it handles «زمرد» and «زمرد موزو»
     *   • a substring fallback on the same normalised text, so a partial word
     *     («مرو») still finds «مروارید», and so that a cluster which cannot
     *     tokenise Persian (SQL_ASCII) degrades in speed instead of in behaviour
     */
    conditions.push(
      sql`(
        ${specimenTranslations.searchTsv} @@ plainto_tsquery('simple', ${normalized})
        or ${specimenTranslations.searchText} ilike ${`%${normalized}%`}
      )`,
    );
  }

  if (query.hall) {
    const hallCode = query.hall;
    conditions.push(
      sql`exists (
        select 1 from ${hallSpecimens}
        join ${halls} on ${halls.id} = ${hallSpecimens.hallId}
        where ${hallSpecimens.specimenId} = ${specimens.id}
          and ${halls.code} = ${hallCode}
          and ${halls.status} = 'published'
          and ${halls.deletedAt} is null
      )`,
    );
  }

  if (query.family) {
    const familyCode = query.family;
    conditions.push(
      sql`exists (
        select 1 from ${taxonomyTerms}
        where ${taxonomyTerms.id} = ${specimens.mineralFamilyId}
          and ${taxonomyTerms.code} = ${familyCode}
      )`,
    );
  }

  if (query.color) {
    conditions.push(sql`${specimenTranslations.colors} @> array[${query.color}]::text[]`);
  }

  if (query.transparency) {
    conditions.push(sql`${specimenTranslations.transparency} @> array[${query.transparency}]::text[]`);
  }

  if (typeof query.hardness === 'number' && Number.isFinite(query.hardness)) {
    const hardness = Math.min(Math.max(query.hardness, 1), 10);
    // The probe number falls inside the recorded range, or is that single value.
    conditions.push(
      sql`${specimens.mohsMin} is not null
          and ${specimens.mohsMin} <= ${hardness}
          and coalesce(${specimens.mohsMax}, ${specimens.mohsMin}) >= ${hardness}`,
    );
  }

  if (query.country) {
    const country = query.country;
    conditions.push(
      sql`exists (
        select 1 from ${specimenProvenances}
        where ${specimenProvenances.specimenId} = ${specimens.id}
          and (${specimenProvenances.countryCode} = ${country}
               or ${specimenProvenances.countryName} = ${country})
      )`,
    );
  }

  if (query.media) {
    if (query.media === 'image') {
      conditions.push(sql`${specimens.primaryMediaId} is not null`);
    } else {
      const role = query.media;
      conditions.push(
        sql`exists (
          select 1 from ${specimenMedia}
          where ${specimenMedia.specimenId} = ${specimens.id}
            and ${specimenMedia.role} = ${role}::specimen_media_role
        )`,
      );
    }
  }

  return conditions;
}

/** One page of the collection. */
export async function listSpecimens(
  query: SpecimenQuery = {},
  db?: MuseumDatabase,
): Promise<SpecimenListResult> {
  const page = clampPage(query.page);
  const pageSize = clampPageSize(query.pageSize);
  const sort: SortKey = query.sort ?? 'newest';
  const present = (value: unknown): boolean =>
    value !== null && value !== undefined && value !== '';
  const filtered = [
    query.q,
    query.hall,
    query.family,
    query.color,
    query.transparency,
    query.hardness,
    query.country,
    query.media,
  ].some(present);

  try {
    const client = await resolveDb(db);
    const conditions = buildConditions(query);
    const where = and(...conditions);

    const [rows, totals] = await Promise.all([
      client
        .select(cardSelection())
        .from(specimens)
        .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
        .leftJoin(mediaAssets, eq(mediaAssets.id, specimens.primaryMediaId))
        .leftJoin(
          mediaTranslations,
          and(
            eq(mediaTranslations.mediaId, mediaAssets.id),
            eq(mediaTranslations.locale, DEFAULT_LOCALE),
          ),
        )
        .leftJoin(taxonomyTerms, eq(taxonomyTerms.id, specimens.mineralFamilyId))
        .leftJoin(
          taxonomyTermTranslations,
          and(
            eq(taxonomyTermTranslations.termId, taxonomyTerms.id),
            eq(taxonomyTermTranslations.locale, DEFAULT_LOCALE),
          ),
        )
        .where(where)
        .orderBy(...SORT_CLAUSES[sort])
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      client
        .select({ total: count() })
        .from(specimens)
        .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
        .where(where),
    ]);

    const total = Number(totals[0]?.total ?? 0);
    const items = rows.map(toCard);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return {
      state: items.length === 0 ? 'empty' : 'ready',
      items,
      total,
      page,
      pageSize,
      pageCount,
      filtered,
    };
  } catch (error) {
    console.error(
      '[gemoria] specimen list unavailable:',
      error instanceof Error ? error.message : 'unknown error',
    );
    return {
      state: 'unavailable',
      items: [],
      total: 0,
      page,
      pageSize,
      pageCount: 1,
      filtered,
      reason: 'database_unavailable',
    };
  }
}

/** Specimens hanging in one hall, paginated and filterable within that hall. */
export async function listHallSpecimens(
  hallCode: string,
  query: Omit<SpecimenQuery, 'hall'> = {},
  db?: MuseumDatabase,
): Promise<SpecimenListResult> {
  return listSpecimens({ ...query, hall: hallCode }, db);
}

/* ── One object ────────────────────────────────────────────────────────────── */

/**
 * The full record for `/specimens/[slug]`.
 *
 * One statement for the specimen, its translation and its four classification
 * axes; then three small lookups by id (provenance, gallery, relations) and two
 * more for halls and articles. Five round trips in total for a page that would be
 * a dozen separate queries if each section fetched itself.
 */
export async function getSpecimenBySlug(
  slug: string,
  db?: MuseumDatabase,
): Promise<SpecimenDetail | null> {
  const client = await resolveDb(db);

  const family = taxonomyTerms;

  const rows = await client
    .select({
      id: specimens.id,
      inventoryNo: specimens.inventoryNo,
      slug: specimenTranslations.slug,
      title: specimenTranslations.title,
      subtitle: specimenTranslations.subtitle,
      scientificName: specimens.scientificName,
      summary: specimenTranslations.summary,
      story: specimenTranslations.story,
      formation: specimenTranslations.formation,
      history: specimenTranslations.history,
      notes: specimenTranslations.notes,
      chemicalFormula: specimens.chemicalFormula,
      crystalSystem: specimens.crystalSystem,
      mohsMin: specimens.mohsMin,
      mohsMax: specimens.mohsMax,
      densityMin: specimens.densityMin,
      densityMax: specimens.densityMax,
      refractiveIndexMin: specimens.refractiveIndexMin,
      refractiveIndexMax: specimens.refractiveIndexMax,
      colors: specimenTranslations.colors,
      transparency: specimenTranslations.transparency,
      luster: specimenTranslations.luster,
      cleavage: specimenTranslations.cleavage,
      fracture: specimenTranslations.fracture,
      weightCt: specimens.weightCt,
      dimensionsMm: specimens.dimensionsMm,
      pieces: specimens.pieces,
      acquiredAt: specimens.acquiredAt,
      certificateRef: specimens.certificateRef,
      provenanceText: specimens.provenance,
      publishedAt: specimens.publishedAt,
      updatedAt: specimens.updatedAt,
      mediaKey: mediaAssets.storageKey,
      mediaWidth: mediaAssets.width,
      mediaHeight: mediaAssets.height,
      mediaDriver: mediaAssets.storageDriver,
      mediaHex: mediaAssets.dominantHex,
      mediaAlt: mediaTranslations.altText,
      familyCode: family.code,
      familyLabel: taxonomyTermTranslations.label,
      familyLatin: family.latinName,
    })
    .from(specimens)
    .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
    .leftJoin(mediaAssets, eq(mediaAssets.id, specimens.primaryMediaId))
    .leftJoin(
      mediaTranslations,
      and(
        eq(mediaTranslations.mediaId, mediaAssets.id),
        eq(mediaTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .leftJoin(family, eq(family.id, specimens.mineralFamilyId))
    .leftJoin(
      taxonomyTermTranslations,
      and(
        eq(taxonomyTermTranslations.termId, family.id),
        eq(taxonomyTermTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(and(eq(specimenTranslations.slug, slug), publicSpecimen))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const [classification, provenance, gallery, hallsOfSpecimen, articleRows] = await Promise.all([
    loadClassification(client, row.id),
    loadProvenance(client, row.id),
    loadGallery(client, row.id, row.title),
    loadHalls(client, row.id),
    loadArticles(client, row.id),
  ]);

  const related = await loadRelated(client, row.id);

  return {
    id: row.id,
    inventoryNo: row.inventoryNo,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    scientificName: row.scientificName,
    summary: row.summary,
    story: row.story,
    formation: row.formation,
    history: row.history,
    notes: row.notes,
    chemicalFormula: row.chemicalFormula,
    crystalSystem: row.crystalSystem,
    mohsMin: row.mohsMin,
    mohsMax: row.mohsMax,
    densityMin: row.densityMin,
    densityMax: row.densityMax,
    refractiveIndexMin: row.refractiveIndexMin,
    refractiveIndexMax: row.refractiveIndexMax,
    colors: row.colors ?? [],
    transparency: row.transparency ?? [],
    luster: row.luster,
    cleavage: row.cleavage,
    fracture: row.fracture,
    weightCt: row.weightCt,
    dimensionsMm: row.dimensionsMm,
    pieces: row.pieces,
    acquiredAt: row.acquiredAt,
    certificateRef: row.certificateRef,
    provenanceText: row.provenanceText,
    image: resolveImage(
      {
        key: row.mediaKey,
        width: row.mediaWidth,
        height: row.mediaHeight,
        driver: row.mediaDriver,
        dominantHex: row.mediaHex,
        blurDataUrl: null,
        alt: row.mediaAlt,
      },
      row.title,
    ),
    gallery,
    classification,
    provenance,
    halls: hallsOfSpecimen,
    related,
    articles: articleRows,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function loadClassification(
  db: MuseumDatabase,
  specimenId: string,
): Promise<readonly ClassificationEntry[]> {
  const rows = await db
    .select({
      kind: taxonomyTerms.kind,
      code: taxonomyTerms.code,
      label: taxonomyTermTranslations.label,
      latinName: taxonomyTerms.latinName,
    })
    .from(specimens)
    .innerJoin(
      taxonomyTerms,
      or(
        eq(taxonomyTerms.id, specimens.mineralFamilyId),
        eq(taxonomyTerms.id, specimens.scientificGroupId),
        eq(taxonomyTerms.id, specimens.specimenTypeId),
        eq(taxonomyTerms.id, specimens.originKindId),
      ),
    )
    .leftJoin(
      taxonomyTermTranslations,
      and(
        eq(taxonomyTermTranslations.termId, taxonomyTerms.id),
        eq(taxonomyTermTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(eq(specimens.id, specimenId));

  const order: ClassificationEntry['kind'][] = [
    'mineral_family',
    'scientific_group',
    'specimen_type',
    'origin_kind',
  ];

  return rows
    .filter((entry): entry is typeof entry & { label: string } => Boolean(entry.label))
    .map((entry) => ({
      kind: entry.kind,
      code: entry.code,
      label: entry.label,
      latinName: entry.latinName,
    }))
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

async function loadProvenance(
  db: MuseumDatabase,
  specimenId: string,
): Promise<readonly ProvenanceEntry[]> {
  const rows = await db
    .select({
      id: specimenProvenances.id,
      countryName: specimenProvenances.countryName,
      countryCode: specimenProvenances.countryCode,
      region: specimenProvenances.region,
      locality: specimenProvenances.locality,
      note: specimenProvenances.note,
      latitude: specimenProvenances.latitude,
      longitude: specimenProvenances.longitude,
      isPrimary: specimenProvenances.isPrimary,
    })
    .from(specimenProvenances)
    .where(eq(specimenProvenances.specimenId, specimenId))
    .orderBy(desc(specimenProvenances.isPrimary), asc(specimenProvenances.sortOrder));

  return rows;
}

async function loadGallery(
  db: MuseumDatabase,
  specimenId: string,
  fallbackAlt: string,
): Promise<readonly GalleryEntry[]> {
  const rows = await db
    .select({
      id: specimenMedia.id,
      kind: mediaAssets.kind,
      role: specimenMedia.role,
      caption: mediaTranslations.caption,
      key: mediaAssets.storageKey,
      width: mediaAssets.width,
      height: mediaAssets.height,
      driver: mediaAssets.storageDriver,
      dominantHex: mediaAssets.dominantHex,
      alt: mediaTranslations.altText,
      durationSeconds: mediaAssets.durationSeconds,
    })
    .from(specimenMedia)
    .innerJoin(mediaAssets, eq(mediaAssets.id, specimenMedia.mediaId))
    .leftJoin(
      mediaTranslations,
      and(
        eq(mediaTranslations.mediaId, mediaAssets.id),
        eq(mediaTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(and(eq(specimenMedia.specimenId, specimenId), isNull(mediaAssets.deletedAt)))
    .orderBy(asc(specimenMedia.sortOrder), asc(specimenMedia.id));

  return rows.map((entry) => ({
    id: entry.id,
    kind: entry.kind,
    role: entry.role,
    caption: entry.caption,
    image:
      entry.kind === 'image' || entry.kind === 'panorama'
        ? resolveImage(
            {
              key: entry.key,
              width: entry.width,
              height: entry.height,
              driver: entry.driver,
              dominantHex: entry.dominantHex,
              blurDataUrl: null,
              alt: entry.alt,
            },
            fallbackAlt,
          )
        : null,
    durationSeconds: entry.durationSeconds,
  }));
}

async function loadHalls(
  db: MuseumDatabase,
  specimenId: string,
): Promise<readonly { slug: string; title: string }[]> {
  return db
    .select({ slug: hallTranslations.slug, title: hallTranslations.title })
    .from(hallSpecimens)
    .innerJoin(halls, eq(halls.id, hallSpecimens.hallId))
    .innerJoin(
      hallTranslations,
      and(
        eq(hallTranslations.hallId, halls.id),
        eq(hallTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(
      and(
        eq(hallSpecimens.specimenId, specimenId),
        eq(halls.status, 'published'),
        isNull(halls.deletedAt),
      ),
    )
    .orderBy(asc(halls.sortOrder));
}

async function loadArticles(
  db: MuseumDatabase,
  specimenId: string,
): Promise<readonly { slug: string; title: string; excerpt: string | null }[]> {
  return db
    .select({
      slug: articleTranslations.slug,
      title: articleTranslations.title,
      excerpt: articleTranslations.excerpt,
    })
    .from(articleSpecimens)
    .innerJoin(articles, eq(articles.id, articleSpecimens.articleId))
    .innerJoin(
      articleTranslations,
      and(
        eq(articleTranslations.articleId, articles.id),
        eq(articleTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(
      and(
        eq(articleSpecimens.specimenId, specimenId),
        eq(articles.status, 'published'),
        isNull(articles.deletedAt),
      ),
    )
    .orderBy(asc(articleSpecimens.sortOrder));
}

/**
 * Related objects: curated first, then suggested.
 *
 * Suggestions use the *classification foreign keys* the curator set and the
 * provenance rows that were recorded — never a string comparison between names.
 * A suggested object is by definition one that shares a mineral family, a
 * specimen type or a locality with this one.
 */
async function loadRelated(db: MuseumDatabase, specimenId: string): Promise<readonly SpecimenCard[]> {
  const curated = await db
    .select(cardSelection())
    .from(specimenRelations)
    .innerJoin(specimens, eq(specimens.id, specimenRelations.relatedSpecimenId))
    .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
    .leftJoin(mediaAssets, eq(mediaAssets.id, specimens.primaryMediaId))
    .leftJoin(
      mediaTranslations,
      and(
        eq(mediaTranslations.mediaId, mediaAssets.id),
        eq(mediaTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .leftJoin(taxonomyTerms, eq(taxonomyTerms.id, specimens.mineralFamilyId))
    .leftJoin(
      taxonomyTermTranslations,
      and(
        eq(taxonomyTermTranslations.termId, taxonomyTerms.id),
        eq(taxonomyTermTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(
      and(
        eq(specimenRelations.specimenId, specimenId),
        publicSpecimen,
        ne(specimens.id, specimenId),
      ),
    )
    .orderBy(asc(specimenRelations.sortOrder))
    .limit(6);

  if (curated.length >= 6) return curated.map(toCard);

  const curatedIds = new Set(curated.map((entry) => entry.id));
  const seen = new Set<string>([specimenId, ...curatedIds]);

  const suggested = await db
    .select(cardSelection())
    .from(specimens)
    .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
    .leftJoin(mediaAssets, eq(mediaAssets.id, specimens.primaryMediaId))
    .leftJoin(
      mediaTranslations,
      and(
        eq(mediaTranslations.mediaId, mediaAssets.id),
        eq(mediaTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .leftJoin(taxonomyTerms, eq(taxonomyTerms.id, specimens.mineralFamilyId))
    .leftJoin(
      taxonomyTermTranslations,
      and(
        eq(taxonomyTermTranslations.termId, taxonomyTerms.id),
        eq(taxonomyTermTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(
      and(
        publicSpecimen,
        ne(specimens.id, specimenId),
        or(
          sql`${specimens.mineralFamilyId} in (
            select mineral_family_id from ${specimens} where id = ${specimenId} and mineral_family_id is not null
          )`,
          sql`${specimens.specimenTypeId} in (
            select specimen_type_id from ${specimens} where id = ${specimenId} and specimen_type_id is not null
          )`,
          sql`exists (
            select 1 from ${specimenProvenances} own
            join ${specimenProvenances} other on (
              other.country_code is not null
              and other.country_code = own.country_code
            )
            where own.specimen_id = ${specimenId}
              and other.specimen_id = ${specimens.id}
          )`,
        ),
      ),
    )
    .orderBy(desc(specimens.isFeatured), desc(specimens.publishedAt))
    .limit(12);

  const items = [...curated.map(toCard)];

  for (const candidate of suggested) {
    if (items.length >= 6) break;
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    items.push(toCard(candidate));
  }

  return items;
}

/* ── Facets ────────────────────────────────────────────────────────────────── */

/**
 * The values that actually exist in the collection.
 *
 * A filter list must not offer «یاقوت» when no ruby is on display: the visitor
 * would apply a filter and find an empty gallery. Every facet is therefore
 * computed from published rows only.
 */
export async function getFilterOptions(db?: MuseumDatabase): Promise<FilterOptions> {
  const client = await resolveDb(db);

  const [families, countries, colorRows, transparencyRows, hallRows] = await Promise.all([
    client
      .select({
        code: taxonomyTerms.code,
        label: taxonomyTermTranslations.label,
        total: count(),
      })
      .from(specimens)
      .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
      .innerJoin(taxonomyTerms, eq(taxonomyTerms.id, specimens.mineralFamilyId))
      .innerJoin(
        taxonomyTermTranslations,
        and(
          eq(taxonomyTermTranslations.termId, taxonomyTerms.id),
          eq(taxonomyTermTranslations.locale, DEFAULT_LOCALE),
        ),
      )
      .where(publicSpecimen)
      .groupBy(taxonomyTerms.code, taxonomyTermTranslations.label)
      .orderBy(asc(taxonomyTermTranslations.label)),
    client
      .select({
        code: specimenProvenances.countryCode,
        name: specimenProvenances.countryName,
        total: sql<number>`count(distinct ${specimens.id})::int`,
      })
      .from(specimens)
      .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
      .innerJoin(specimenProvenances, eq(specimenProvenances.specimenId, specimens.id))
      .where(publicSpecimen)
      .groupBy(specimenProvenances.countryCode, specimenProvenances.countryName)
      .orderBy(asc(specimenProvenances.countryName)),
    /*
     * Colours and transparency are arrays, so their facets come from `unnest`.
     * Written as SQL rather than through the query builder because a lateral
     * `unnest` is exactly what this is, and pretending otherwise would produce a
     * join the planner cannot use. Every value is still a bound parameter and the
     * only interpolations are column and table identifiers.
     */
    client.execute<{ value: string; total: number }>(sql`
      select unnest(t.colors) as value, count(distinct s.id)::int as total
      from specimens s
      join specimen_translations t on t.specimen_id = s.id
      where s.status = 'published' and s.deleted_at is null and t.locale = ${DEFAULT_LOCALE}
        and t.colors is not null
      group by 1
      order by 1
    `),
    client.execute<{ value: string; total: number }>(sql`
      select unnest(t.transparency) as value, count(distinct s.id)::int as total
      from specimens s
      join specimen_translations t on t.specimen_id = s.id
      where s.status = 'published' and s.deleted_at is null and t.locale = ${DEFAULT_LOCALE}
        and t.transparency is not null
      group by 1
      order by 1
    `),
    client
      .select({
        code: halls.code,
        title: hallTranslations.title,
        total: count(),
      })
      .from(hallSpecimens)
      .innerJoin(specimens, eq(specimens.id, hallSpecimens.specimenId))
      .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
      .innerJoin(halls, eq(halls.id, hallSpecimens.hallId))
      .innerJoin(
        hallTranslations,
        and(
          eq(hallTranslations.hallId, halls.id),
          eq(hallTranslations.locale, DEFAULT_LOCALE),
        ),
      )
      .where(and(publicSpecimen, eq(halls.status, 'published'), isNull(halls.deletedAt)))
      .groupBy(halls.code, hallTranslations.title, halls.sortOrder)
      .orderBy(asc(halls.sortOrder)),
  ]);

  return {
    families: families
      .filter((entry) => Boolean(entry.label))
      .map((entry) => ({ code: entry.code, label: entry.label, total: Number(entry.total) })),
    colors: colorRows.rows.map((entry) => ({ value: entry.value, total: Number(entry.total) })),
    countries: countries
      .filter((entry) => Boolean(entry.code) && Boolean(entry.name))
      .map((entry) => ({
        code: entry.code as string,
        name: entry.name as string,
        total: Number(entry.total),
      })),
    transparency: transparencyRows.rows.map((entry) => ({
      value: entry.value,
      total: Number(entry.total),
    })),
    halls: hallRows.map((entry) => ({
      code: entry.code,
      title: entry.title,
      total: Number(entry.total),
    })),
  };
}

/** Used by the sitemap: every public object, slug and date only. */
export async function listPublishedSlugs(
  db?: MuseumDatabase,
): Promise<readonly { slug: string; updatedAt: string }[]> {
  const client = await resolveDb(db);

  const rows = await client
    .select({ slug: specimenTranslations.slug, updatedAt: specimens.updatedAt })
    .from(specimens)
    .innerJoin(specimenTranslations, eq(specimenTranslations.specimenId, specimens.id))
    .where(publicSpecimen)
    .orderBy(desc(specimens.updatedAt))
    .limit(5_000);

  return rows.map((row) => ({ slug: row.slug, updatedAt: row.updatedAt.toISOString() }));
}

