/**
 * GEMORIA — search index maintenance.
 *
 * `specimen_translations.search_text` is the document PostgreSQL indexes, and
 * `search_tsv` is generated from it. The document has to contain every field a
 * visitor may search by — the Persian name, the Latin name, the formula, the slug,
 * the family, the locality — and those live in four different tables. A generated
 * column cannot read across tables, and a trigger across four tables is a rule
 * nobody can find six months later.
 *
 * So the document is written by one function, called by every path that can change
 * any of its inputs: the dashboard's create/update, the hall linker, the provenance
 * editor. `npm run search:reindex` runs the same function over the whole catalogue
 * if an import bypassed it.
 */
import { and, eq, inArray } from 'drizzle-orm';
import type { MuseumDatabase } from './client';
import { specimenProvenances, specimenTranslations, specimens } from './schema/specimens';
import { taxonomyTermTranslations, taxonomyTerms } from './schema/taxonomy';
import { DEFAULT_LOCALE } from '@/config/app';
import { buildSearchText, persianSortKey } from '@/lib/search/normalize';

/**
 * A transaction and a database expose the same query surface. Declaring the
 * narrower shape lets the index be recomputed inside a transaction — which is what
 * makes "the object and its search document are always consistent" true rather
 * than hoped for.
 */
export type QueryExecutor = Pick<MuseumDatabase, 'select' | 'update' | 'execute'>;

export type MuseumLocale = 'fa' | 'en' | 'ar';

export interface ReindexSummary {
  readonly specimenId: string;
  readonly locale: MuseumLocale;
  readonly document: string;
}

/** Rebuilds one translation's search document and sort key. */
export async function recomputeSpecimenSearchText(
  db: QueryExecutor,
  specimenId: string,
  locale: MuseumLocale = DEFAULT_LOCALE,
): Promise<ReindexSummary | null> {
  const [row] = await db
    .select({
      title: specimenTranslations.title,
      subtitle: specimenTranslations.subtitle,
      slug: specimenTranslations.slug,
      summary: specimenTranslations.summary,
      colors: specimenTranslations.colors,
      scientificName: specimens.scientificName,
      chemicalFormula: specimens.chemicalFormula,
      mineralFamilyId: specimens.mineralFamilyId,
      scientificGroupId: specimens.scientificGroupId,
      specimenTypeId: specimens.specimenTypeId,
      originKindId: specimens.originKindId,
    })
    .from(specimenTranslations)
    .innerJoin(specimens, eq(specimens.id, specimenTranslations.specimenId))
    .where(
      and(
        eq(specimenTranslations.specimenId, specimenId),
        eq(specimenTranslations.locale, locale),
      ),
    )
    .limit(1);

  if (!row) return null;

  const termIds = [
    row.mineralFamilyId,
    row.scientificGroupId,
    row.specimenTypeId,
    row.originKindId,
  ].filter((id): id is string => Boolean(id));

  const [labels, places] = await Promise.all([
    termIds.length === 0
      ? Promise.resolve([])
      : db
          .select({ label: taxonomyTermTranslations.label, latin: taxonomyTerms.latinName })
          .from(taxonomyTerms)
          .leftJoin(
            taxonomyTermTranslations,
            and(
              eq(taxonomyTermTranslations.termId, taxonomyTerms.id),
              eq(taxonomyTermTranslations.locale, locale),
            ),
          )
          .where(inArray(taxonomyTerms.id, termIds)),
    db
      .select({
        country: specimenProvenances.countryName,
        region: specimenProvenances.region,
        locality: specimenProvenances.locality,
      })
      .from(specimenProvenances)
      .where(eq(specimenProvenances.specimenId, specimenId)),
  ]);

  const document = buildSearchText({
    title: row.title,
    subtitle: row.subtitle,
    slug: row.slug,
    summary: row.summary,
    scientificName: row.scientificName,
    chemicalFormula: row.chemicalFormula,
    colors: row.colors,
    labels: labels.flatMap((entry) => [entry.label, entry.latin]),
    localities: places.flatMap((place) => [place.country, place.region, place.locality]),
  });

  await db
    .update(specimenTranslations)
    .set({
      searchText: document,
      titleSortKey: persianSortKey(row.title),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(specimenTranslations.specimenId, specimenId),
        eq(specimenTranslations.locale, locale),
      ),
    );

  return { specimenId, locale, document };
}

/**
 * Rebuilds every published document.
 *
 * Called by `npm run search:reindex` after a bulk import, and by the tests that
 * assert the index is complete. Returns how many documents were rewritten.
 */
export async function reindexAllSpecimens(db: QueryExecutor): Promise<number> {
  const rows = await db
    .select({ id: specimens.id })
    .from(specimens)
    .where(and(eq(specimens.status, 'published')));

  for (const row of rows) {
    await recomputeSpecimenSearchText(db, row.id);
  }

  return rows.length;
}
