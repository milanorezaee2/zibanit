/**
 * GEMORIA — read model for the public museum.
 *
 * The homepage never writes a specimen into JSX. It asks this module for what is
 * published and featured, and renders whatever comes back — including nothing.
 *
 * Two rules are enforced here rather than in components:
 *
 *   • only `published` objects with a Persian translation are public; drafts are
 *     invisible to visitors, not merely hidden by CSS
 *   • a database that is unreachable degrades to an honest empty state instead of
 *     taking the homepage down with it (a museum with a closed storeroom still
 *     opens its doors)
 */
import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDatabase } from '@/db/client';
import { mediaAssets } from '@/db/schema/media';
import { specimenTranslations, specimens } from '@/db/schema/specimens';
import { DEFAULT_LOCALE } from '@/config/app';

export interface SpecimenImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: string;
}

export interface FeaturedSpecimen {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly summary: string | null;
  /** Where it was found — free text until the atlas lands. */
  readonly provenance: string | null;
  /** Carat weight as a decimal string, never a float. */
  readonly weightCt: string | null;
  readonly image: SpecimenImage | null;
}

export type FeaturedResult =
  | { readonly state: 'ready'; readonly items: readonly FeaturedSpecimen[] }
  | { readonly state: 'empty'; readonly items: readonly [] }
  | { readonly state: 'unavailable'; readonly items: readonly []; readonly reason: string };

/**
 * Published, featured specimens for the homepage.
 *
 * `state` distinguishes "the museum has nothing to show yet" from "the database
 * could not be read" — they look similar to a visitor but mean very different
 * things to whoever is on call.
 */
export async function getFeaturedSpecimens(limit = 6): Promise<FeaturedResult> {
  try {
    const { db } = await getDatabase();

    const rows = await db
      .select({
        id: specimens.id,
        slug: specimenTranslations.slug,
        title: specimenTranslations.title,
        subtitle: specimenTranslations.subtitle,
        summary: specimenTranslations.summary,
        provenance: specimens.provenance,
        weightCt: specimens.weightCt,
        mediaKey: mediaAssets.storageKey,
        mediaWidth: mediaAssets.width,
        mediaHeight: mediaAssets.height,
      })
      .from(specimens)
      .innerJoin(
        specimenTranslations,
        and(
          eq(specimenTranslations.specimenId, specimens.id),
          eq(specimenTranslations.locale, DEFAULT_LOCALE),
        ),
      )
      .leftJoin(mediaAssets, eq(mediaAssets.id, specimens.primaryMediaId))
      .where(
        and(
          eq(specimens.status, 'published'),
          eq(specimens.isFeatured, true),
          isNull(specimens.deletedAt),
        ),
      )
      .orderBy(desc(specimens.publishedAt))
      .limit(limit);

    if (rows.length === 0) return { state: 'empty', items: [] };

    const items: FeaturedSpecimen[] = rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.subtitle,
      summary: row.summary,
      provenance: row.provenance,
      weightCt: row.weightCt,
      image:
        row.mediaKey && row.mediaWidth && row.mediaHeight
          ? {
              src: `/media/${row.mediaKey}`,
              width: row.mediaWidth,
              height: row.mediaHeight,
              alt: row.title,
            }
          : null,
    }));

    return { state: 'ready', items };
  } catch (error) {
    console.error(
      '[gemoria] featured specimens unavailable:',
      error instanceof Error ? error.message : 'unknown error',
    );
    return { state: 'unavailable', items: [], reason: 'database_unavailable' };
  }
}
