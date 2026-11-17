/**
 * GEMORIA — read model for the halls.
 *
 * The six halls are rows, not constants, because the dashboard can publish,
 * reorder and re-describe them. Everything a visitor sees on `/halls` and on a
 * hall's own page is read here; no component owns a hall's name or text.
 *
 * Only `published`, non-deleted halls with a Persian translation are public —
 * the same rule the specimen queries enforce, for the same reason: an unpublished
 * gallery must not be reachable, and a `notFound()` is the honest answer.
 */
import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import type { MuseumDatabase } from '@/db/client';
import { resolveDb } from './executor';
import { hallSpecimens, hallTranslations, halls } from '@/db/schema/halls';
import { specimens } from '@/db/schema/specimens';
import { DEFAULT_LOCALE } from '@/config/app';
import { buildAssetImage, type ResolvedImage } from '@/lib/media/storage';

export interface HallSummary {
  readonly id: string;
  readonly code: string;
  readonly slug: string;
  readonly title: string;
  readonly latinName: string;
  readonly summary: string;
  readonly description: string | null;
  readonly imageAlt: string;
  readonly sortOrder: number;
  readonly isFeatured: boolean;
  readonly image: ResolvedImage | null;
  readonly heroImage: ResolvedImage | null;
  /** Published objects currently on display in this hall. */
  readonly specimenCount: number;
}

export type HallsResult =
  | { readonly state: 'ready'; readonly items: readonly HallSummary[] }
  | { readonly state: 'empty'; readonly items: readonly [] }
  | { readonly state: 'unavailable'; readonly items: readonly []; readonly reason: string };

const publishedHall = and(
  eq(halls.status, 'published'),
  isNull(halls.deletedAt),
  eq(hallTranslations.locale, DEFAULT_LOCALE),
);

/**
 * The count is a correlated subquery rather than a `group by` over a joined
 * collection, because a hall with several objects would otherwise duplicate its
 * own row and need `distinct` on the descriptive columns — the classic way a
 * gallery query becomes slow as the collection grows.
 */
const specimenCountColumn = sql<number>`(
  select count(*)::int
  from ${hallSpecimens}
  join ${specimens} on ${specimens.id} = ${hallSpecimens.specimenId}
  where ${hallSpecimens.hallId} = ${halls.id}
    and ${specimens.status} = 'published'
    and ${specimens.deletedAt} is null
)`;

function toSummary(row: {
  id: string;
  code: string;
  slug: string;
  title: string;
  latinName: string;
  summary: string;
  description: string | null;
  imageAlt: string | null;
  sortOrder: number;
  isFeatured: boolean;
  coverImageKey: string | null;
  heroImageKey: string | null;
  specimenCount: number;
}): HallSummary {
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    latinName: row.latinName,
    summary: row.summary,
    description: row.description,
    imageAlt: row.imageAlt ?? row.title,
    sortOrder: row.sortOrder,
    isFeatured: row.isFeatured,
    image: buildAssetImage(row.coverImageKey),
    heroImage: buildAssetImage(row.heroImageKey) ?? buildAssetImage(row.coverImageKey),
    specimenCount: Number(row.specimenCount ?? 0),
  };
}

/** Every published hall, in the order a visitor walks through them. */
export async function getPublishedHalls(db?: MuseumDatabase): Promise<HallsResult> {
  try {
    const client = await resolveDb(db);

    const rows = await client
      .select({
        id: halls.id,
        code: halls.code,
        slug: hallTranslations.slug,
        title: hallTranslations.title,
        latinName: halls.latinName,
        summary: hallTranslations.summary,
        description: hallTranslations.description,
        imageAlt: hallTranslations.imageAlt,
        sortOrder: halls.sortOrder,
        isFeatured: halls.isFeatured,
        coverImageKey: halls.coverImageKey,
        heroImageKey: halls.heroImageKey,
        specimenCount: specimenCountColumn,
      })
      .from(halls)
      .innerJoin(hallTranslations, eq(hallTranslations.hallId, halls.id))
      .where(publishedHall)
      .orderBy(asc(halls.sortOrder), asc(halls.id));

    const items = rows.map(toSummary);
    return items.length === 0 ? { state: 'empty', items: [] } : { state: 'ready', items };
  } catch (error) {
    console.error('[gemoria] halls unavailable:', error instanceof Error ? error.message : 'unknown');
    return { state: 'unavailable', items: [], reason: 'database_unavailable' };
  }
}

/** One hall by its translated slug, or null when it is not public. */
export async function getHallBySlug(slug: string, db?: MuseumDatabase): Promise<HallSummary | null> {
  const client = await resolveDb(db);

  const rows = await client
    .select({
      id: halls.id,
      code: halls.code,
      slug: hallTranslations.slug,
      title: hallTranslations.title,
      latinName: halls.latinName,
      summary: hallTranslations.summary,
      description: hallTranslations.description,
      imageAlt: hallTranslations.imageAlt,
      sortOrder: halls.sortOrder,
      isFeatured: halls.isFeatured,
      coverImageKey: halls.coverImageKey,
      heroImageKey: halls.heroImageKey,
      specimenCount: specimenCountColumn,
    })
    .from(halls)
    .innerJoin(hallTranslations, eq(hallTranslations.hallId, halls.id))
    .where(and(eq(hallTranslations.slug, slug), publishedHall))
    .limit(1);

  const row = rows[0];
  return row ? toSummary(row) : null;
}

/** The other halls, for the «تالارهای مرتبط» rail at the foot of a hall page. */
export async function getOtherHalls(
  currentCode: string,
  limit = 3,
  db?: MuseumDatabase,
): Promise<readonly HallSummary[]> {
  const result = await getPublishedHalls(db);
  if (result.state !== 'ready') return [];

  return result.items.filter((hall) => hall.code !== currentCode).slice(0, limit);
}

/** Hall choices for a `<select>`: code and Persian title only. */
export async function getHallOptions(db?: MuseumDatabase): Promise<
  readonly { id: string; code: string; title: string }[]
> {
  const client = await resolveDb(db);

  return client
    .select({ id: halls.id, code: halls.code, title: hallTranslations.title })
    .from(halls)
    .innerJoin(hallTranslations, eq(hallTranslations.hallId, halls.id))
    .where(and(isNull(halls.deletedAt), eq(hallTranslations.locale, DEFAULT_LOCALE)))
    .orderBy(asc(halls.sortOrder));
}

/** Halls that are public but have no object yet — used by the index's honest note. */
export async function countHallsWithoutSpecimens(db?: MuseumDatabase): Promise<number> {
  const result = await getPublishedHalls(db);
  if (result.state !== 'ready') return 0;
  return result.items.filter((hall) => hall.specimenCount === 0).length;
}
