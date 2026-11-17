/**
 * GEMORIA — classification term lookups for the dashboard.
 *
 * Only the museum-editable axes are here: mineral families, scientific groups,
 * specimen types and origin kinds. There is no "hall" axis by design — a hall is
 * a room, not a taxon.
 */
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { MuseumDatabase } from '@/db/client';
import { taxonomyTermTranslations, taxonomyTerms } from '@/db/schema/taxonomy';
import { DEFAULT_LOCALE } from '@/config/app';
import type { TaxonomyKind } from '@/content/mineral';

export interface TaxonomyOption {
  readonly id: string;
  readonly code: string;
  readonly label: string;
  readonly latinName: string | null;
}

/** All terms of the given kinds, labelled in Persian, grouped by kind. */
export async function getTaxonomyOptions(
  db?: MuseumDatabase,
  kinds: readonly TaxonomyKind[] = ['mineral_family', 'scientific_group', 'specimen_type', 'origin_kind'],
): Promise<Record<TaxonomyKind, readonly TaxonomyOption[]>> {
  const client =
    db ??
    (await (async () => {
      const { getDatabase } = await import('@/db/client');
      return (await getDatabase()).db;
    })());

  const empty = {} as Record<TaxonomyKind, readonly TaxonomyOption[]>;
  for (const kind of kinds) empty[kind] = [];

  const rows = await client
    .select({
      id: taxonomyTerms.id,
      kind: taxonomyTerms.kind,
      code: taxonomyTerms.code,
      latinName: taxonomyTerms.latinName,
      label: taxonomyTermTranslations.label,
    })
    .from(taxonomyTerms)
    .leftJoin(
      taxonomyTermTranslations,
      and(
        eq(taxonomyTermTranslations.termId, taxonomyTerms.id),
        eq(taxonomyTermTranslations.locale, DEFAULT_LOCALE),
      ),
    )
    .where(inArray(taxonomyTerms.kind, kinds as TaxonomyKind[]))
    .orderBy(asc(taxonomyTerms.kind), asc(taxonomyTerms.sortOrder), asc(taxonomyTerms.code));

  const grouped: Record<string, TaxonomyOption[]> = {};
  for (const row of rows) {
    const label = row.label ?? row.code;
    (grouped[row.kind] ??= []).push({
      id: row.id,
      code: row.code,
      label,
      latinName: row.latinName,
    });
  }

  return { ...empty, ...(grouped as Record<TaxonomyKind, readonly TaxonomyOption[]>) };
}
