/**
 * Fixtures for the collection suites.
 *
 * Rules these follow:
 *
 *   • every value is obviously a test value (`GEM-TEST-…`, «آزمایشی»), so a
 *     screenshot or a log line can never be mistaken for museum content
 *   • nothing is invented *science*: the classification labels are labelled as
 *     fixtures, and the numeric values are chosen to exercise the queries, not to
 *     claim anything about a real mineral
 *   • fixtures are created through the real mutation service wherever the service
 *     is what is under test — a fixture that bypasses the code proves nothing
 */
import { eq } from 'drizzle-orm';
import type { MigrationHandle } from './migration-handle';
import { mediaAssets, mediaTranslations } from '@/db/schema/media';
import { taxonomyTermTranslations, taxonomyTerms } from '@/db/schema/taxonomy';
import { articleSpecimens, articleSources, articleTranslations, articles } from '@/db/schema/articles';
import type { SpecimenFormValues } from '@/lib/validation/specimen';

export type { MigrationHandle };

let mediaCounter = 0;

/** A media asset backed by a file that really exists in `public/`. */
export async function createMedia(
  handle: MigrationHandle,
  overrides: Partial<{
    storageKey: string;
    altText: string;
    width: number;
    height: number;
    kind: 'image' | 'video' | 'model' | 'panorama';
  }> = {},
): Promise<{ id: string; storageKey: string }> {
  mediaCounter += 1;
  const storageKey = overrides.storageKey ?? `images/hall-crystals.webp`;

  const [asset] = await handle.db
    .insert(mediaAssets)
    .values({
      kind: overrides.kind ?? 'image',
      status: 'ready',
      storageDriver: 'local',
      storageKey,
      mimeType: overrides.kind === 'video' ? 'video/mp4' : 'image/webp',
      width: overrides.width ?? 960,
      height: overrides.height ?? 1200,
    })
    .returning({ id: mediaAssets.id });

  await handle.db.insert(mediaTranslations).values({
    mediaId: asset!.id,
    locale: 'fa',
    altText: overrides.altText ?? `تصویر آزمایشی ${mediaCounter}`,
    caption: null,
  });

  return { id: asset!.id, storageKey };
}

/** A classification term, with its Persian label. */
export async function createTerm(
  handle: MigrationHandle,
  input: {
    kind: 'mineral_family' | 'scientific_group' | 'specimen_type' | 'origin_kind';
    code: string;
    label: string;
    latinName?: string | null;
  },
): Promise<string> {
  const [term] = await handle.db
    .insert(taxonomyTerms)
    .values({ kind: input.kind, code: input.code, latinName: input.latinName ?? null })
    .returning({ id: taxonomyTerms.id });

  await handle.db
    .insert(taxonomyTermTranslations)
    .values({ termId: term!.id, locale: 'fa', label: input.label });

  return term!.id;
}

/** A published article linked to the given specimens. */
export async function createArticle(
  handle: MigrationHandle,
  input: {
    code: string;
    slug: string;
    title: string;
    body?: string | null;
    specimenIds?: readonly string[];
    status?: 'draft' | 'published';
  },
): Promise<string> {
  const [article] = await handle.db
    .insert(articles)
    .values({
      code: input.code,
      status: input.status ?? 'published',
      publishedAt: input.status === 'draft' ? null : new Date(),
    })
    .returning({ id: articles.id });

  await handle.db.insert(articleTranslations).values({
    articleId: article!.id,
    locale: 'fa',
    slug: input.slug,
    title: input.title,
    excerpt: 'خلاصهٔ آزمایشی',
    body: input.body ?? 'متن آزمایشی مقاله.',
    searchText: input.title,
  });

  await handle.db.insert(articleSources).values({
    articleId: article!.id,
    title: 'منبع آزمایشی',
    publisher: 'آزمون',
    year: 2024,
  });

  if (input.specimenIds && input.specimenIds.length > 0) {
    await handle.db.insert(articleSpecimens).values(
      input.specimenIds.map((specimenId, index) => ({
        articleId: article!.id,
        specimenId,
        sortOrder: index * 10,
      })),
    );
  }

  return article!.id;
}

/** A complete, valid specimen form payload. Overrides are shallow, by design. */
export function specimenValues(
  overrides: Partial<SpecimenFormValues> = {},
): SpecimenFormValues {
  return {
    inventoryNo: 'GEM-TEST-0001',
    slug: 'نمونه-آزمایشی',
    title: 'نمونهٔ آزمایشی',
    subtitle: 'Test Specimen',
    scientificName: 'Testite',
    summary: 'خلاصهٔ آزمایشی برای آزمون جست‌وجو.',
    story: null,
    formation: null,
    history: null,
    notes: null,
    chemicalFormula: null,
    crystalSystem: null,
    mohsMin: null,
    mohsMax: null,
    densityMin: null,
    densityMax: null,
    refractiveIndexMin: null,
    refractiveIndexMax: null,
    colors: [],
    transparency: [],
    luster: null,
    cleavage: null,
    fracture: null,
    mineralFamilyId: null,
    scientificGroupId: null,
    specimenTypeId: null,
    originKindId: null,
    halls: [],
    provenances: [],
    primaryMediaId: null,
    galleryMediaIds: [],
    seoTitle: null,
    seoDescription: null,
    weightCt: null,
    dimensionsMm: null,
    pieces: 1,
    acquiredAt: null,
    certificateRef: null,
    isFeatured: false,
    isHighlight: false,
    ...overrides,
  };
}

/** Hall rows are seeded by the migration; this reads one back by code. */
export async function hallIdByCode(handle: MigrationHandle, code: string): Promise<string> {
  const { halls } = await import('@/db/schema/halls');
  const [row] = await handle.db
    .select({ id: halls.id })
    .from(halls)
    .where(eq(halls.code, code))
    .limit(1);

  if (!row) throw new Error(`Hall ${code} was not seeded by the migration.`);
  return row.id;
}
