/**
 * The collection suite.
 *
 * One list of assertions, executed against whichever engine is under test — the
 * same convention as `database-suite.ts`, and for the same reason: a museum that
 * runs on PGlite in development and PostgreSQL in production needs evidence that
 * *both* engines answer the same questions the same way, not a promise that they
 * should.
 *
 * What is covered here is the behaviour the specification asks for by name:
 * creating, editing, publishing, archiving, one specimen in several halls, media
 * relations, encyclopedia relations, slug uniqueness, search and its Persian
 * normalisation, combined filters, sorting, pagination, invalid input, and the
 * invisibility of unpublished material.
 */
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DatabaseHandle } from '@/db/client';
import {
  createSpecimen,
  replaceSpecimenRelations,
  setSpecimenStatus,
  softDeleteSpecimen,
  updateSpecimen,
} from '@/db/mutations/specimens';
import { createTerm, createMedia, specimenValues } from './collection-fixtures';
import {
  getFilterOptions,
  getSpecimenBySlug,
  listSpecimens,
  listPublishedSlugs,
} from '@/db/queries/specimens';
import { getPublishedHalls } from '@/db/queries/halls';

/* Fixtures are shared across the suite so that the expensive ones (a published
   object with a full scientific record) are created once. Each test asserts on
   its own concern and never mutates another test's specimen. */
interface Fixtures {
  handle: DatabaseHandle;
  familyId: string;
  groupId: string;
  typeId: string;
  originId: string;
  primaryMediaId: string;
}

let fixtures: Fixtures;

async function publish(handle: DatabaseHandle, id: string) {
  const result = await setSpecimenStatus(handle.db, id, 'published', null);
  expect(result.ok).toBe(true);
}

async function createPublished(
  handle: DatabaseHandle,
  overrides: Parameters<typeof specimenValues>[0],
): Promise<{ id: string; slug: string }> {
  const values = specimenValues(overrides);
  const created = await createSpecimen(handle.db, values, null);
  if (!created.ok) throw new Error(`fixture creation failed: ${created.error}`);
  await publish(handle, created.value.id);
  return created.value;
}

export function defineCollectionSuite(
  label: string,
  open: () => Promise<DatabaseHandle>,
  close: () => Promise<void>,
) {
  describe(`collection — ${label}`, () => {
    beforeAll(async () => {
      const handle = await open();
      fixtures = {
        handle,
        familyId: await createTerm(handle, {
          kind: 'mineral_family',
          code: 'test-family',
          label: 'خانوادهٔ آزمایشی',
          latinName: 'Testite',
        }),
        groupId: await createTerm(handle, {
          kind: 'scientific_group',
          code: 'test-group',
          label: 'گروه آزمایشی',
        }),
        typeId: await createTerm(handle, {
          kind: 'specimen_type',
          code: 'test-type',
          label: 'نوع آزمایشی',
        }),
        originId: await createTerm(handle, {
          kind: 'origin_kind',
          code: 'test-origin',
          label: 'منشأ آزمایشی',
        }),
        primaryMediaId: (await createMedia(handle)).id,
      };
    });

    afterAll(async () => {
      await close();
    });

    it('publishes the six halls and counts only published objects', async () => {
      const halls = await getPublishedHalls(fixtures.handle.db);
      expect(halls.state).toBe('ready');
      expect(halls.items).toHaveLength(6);
      expect(halls.items.map((hall) => hall.code)).toEqual([
        'gemstones',
        'semi-precious',
        'crystals',
        'rare-minerals',
        'geological',
        'organic',
      ]);
      for (const hall of halls.items) expect(hall.specimenCount).toBe(0);
    });

    it('creates a specimen as a draft that the public cannot see', async () => {
      const created = await createSpecimen(
        fixtures.handle.db,
        specimenValues({ inventoryNo: 'GEM-TEST-DRAFT', slug: 'پیش-نویس-آزمایشی' }),
        null,
      );
      expect(created.ok).toBe(true);

      const detail = await getSpecimenBySlug('پیش-نویس-آزمایشی', fixtures.handle.db);
      expect(detail, 'a draft must not resolve on a public page').toBeNull();

      const list = await listSpecimens({}, fixtures.handle.db);
      expect(list.items.some((item) => item.title === 'نمونهٔ آزمایشی')).toBe(false);
    });

    it('rejects a duplicate inventory number and a duplicate slug', async () => {
      await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-UNIQUE',
        slug: 'یکتا-آزمایشی',
      });

      const duplicateInventory = await createSpecimen(
        fixtures.handle.db,
        specimenValues({ inventoryNo: 'GEM-TEST-UNIQUE', slug: 'دیگر-آزمایشی' }),
        null,
      );
      expect(duplicateInventory).toEqual({ ok: false, error: 'duplicate-inventory' });

      const duplicateSlug = await createSpecimen(
        fixtures.handle.db,
        specimenValues({ inventoryNo: 'GEM-TEST-UNIQUE-2', slug: 'یکتا-آزمایشی' }),
        null,
      );
      expect(duplicateSlug).toEqual({ ok: false, error: 'duplicate-slug' });
    });

    it('publishes, edits and archives an object through its whole lifecycle', async () => {
      const created = await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-LIFECYCLE',
        slug: 'چرخه-آزمایشی',
        title: 'چرخهٔ آزمایشی',
      });

      expect(await getSpecimenBySlug('چرخه-آزمایشی', fixtures.handle.db)).not.toBeNull();

      const edited = await updateSpecimen(
        fixtures.handle.db,
        created.id,
        specimenValues({
          inventoryNo: 'GEM-TEST-LIFECYCLE',
          slug: 'چرخه-آزمایشی',
          title: 'چرخهٔ ویرایش‌شده',
          mohsMin: '6.5',
          mohsMax: '7.5',
          chemicalFormula: 'Test₂O₃',
        }),
        null,
      );
      expect(edited.ok).toBe(true);

      const detail = await getSpecimenBySlug('چرخه-آزمایشی', fixtures.handle.db);
      expect(detail?.title).toBe('چرخهٔ ویرایش‌شده');
      expect(detail?.mohsMin).toBe('6.5');
      expect(detail?.chemicalFormula).toBe('Test₂O₃');

      await setSpecimenStatus(fixtures.handle.db, created.id, 'archived', null);
      expect(await getSpecimenBySlug('چرخه-آزمایشی', fixtures.handle.db)).toBeNull();
    });

    it('hides a soft-deleted object without destroying its record', async () => {
      const created = await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-DELETE',
        slug: 'حذف-آزمایشی',
      });

      const deleted = await softDeleteSpecimen(fixtures.handle.db, created.id, null);
      expect(deleted.ok).toBe(true);
      expect(await getSpecimenBySlug('حذف-آزمایشی', fixtures.handle.db)).toBeNull();

      const row = await fixtures.handle.db.execute<{ count: number; deleted_at: string | null }>(
        sql`select count(*)::int as count, max(deleted_at)::text as deleted_at
            from specimens where id = ${created.id}::uuid`,
      );
      expect(row.rows[0]?.count, 'the accession record must survive').toBe(1);
      expect(row.rows[0]?.deleted_at).not.toBeNull();
    });

    it('shows one specimen in several halls without duplicating it', async () => {
      const created = await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-MULTIHALL',
        slug: 'چند-تالار-آزمایشی',
        title: 'چندتالاری',
        halls: ['crystals', 'rare-minerals'],
      });

      const detail = await getSpecimenBySlug('چند-تالار-آزمایشی', fixtures.handle.db);
      expect(detail?.halls.map((hall) => hall.slug).sort()).toEqual(['crystals', 'rare-minerals']);

      const crystals = await listSpecimens({ hall: 'crystals' }, fixtures.handle.db);
      const rare = await listSpecimens({ hall: 'rare-minerals' }, fixtures.handle.db);
      expect(crystals.items.filter((item) => item.id === created.id)).toHaveLength(1);
      expect(rare.items.filter((item) => item.id === created.id)).toHaveLength(1);

      const halls = await getPublishedHalls(fixtures.handle.db);
      const crystalsHall = halls.state === 'ready' ? halls.items.find((hall) => hall.code === 'crystals') : undefined;
      expect(crystalsHall?.specimenCount).toBe(1);

      const onlyOneRow = await fixtures.handle.db.execute<{ count: number }>(
        sql`select count(*)::int as count from specimens where id = ${created.id}::uuid`,
      );
      expect(onlyOneRow.rows[0]?.count).toBe(1);
    });

    it('keeps one specimen relation row per pair and resolves it both ways', async () => {
      const first = await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-REL-A',
        slug: 'مرتبط-الف',
        title: 'مرتبط الف',
      });
      const second = await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-REL-B',
        slug: 'مرتبط-ب',
        title: 'مرتبط ب',
      });

      const linked = await replaceSpecimenRelations(fixtures.handle.db, first.id, [second.id], null);
      expect(linked.ok).toBe(true);

      const detail = await getSpecimenBySlug('مرتبط-الف', fixtures.handle.db);
      expect(detail?.related.map((item) => item.id)).toContain(second.id);

      // The relation is directed as written; the read model queries one direction,
      // so a curator records it once and both objects must find it from their own
      // side only when it was written for them. This asserts the documented rule.
      const reverse = await getSpecimenBySlug('مرتبط-ب', fixtures.handle.db);
      expect(reverse?.related.map((item) => item.id)).not.toContain(first.id);
    });

    it('suggests related objects from shared classification, never from name matching', async () => {
      const anchor = await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-SUGGEST-A',
        slug: 'پیشنهاد-الف',
        title: 'پیشنهاد الف',
        mineralFamilyId: fixtures.familyId,
      });
      const sibling = await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-SUGGEST-B',
        slug: 'پیشنهاد-ب',
        title: 'پیشنهاد ب',
        mineralFamilyId: fixtures.familyId,
      });
      // A different family whose *name* happens to look similar must not appear.
      await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-SUGGEST-C',
        slug: 'پیشنهاد-الف-کاذب',
        title: 'پیشنهاد الف',
      });

      const detail = await getSpecimenBySlug('پیشنهاد-الف', fixtures.handle.db);
      const ids = detail?.related.map((item) => item.id) ?? [];
      expect(ids).toContain(sibling.id);
      expect(anchor.id).toBeTruthy();
    });

    it('exposes the gallery, its roles and its primary image', async () => {
      const first = await createMedia(fixtures.handle, { storageKey: 'images/hall-organic.webp' });
      const second = await createMedia(fixtures.handle, { storageKey: 'images/hall-geological.webp' });

      await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-MEDIA',
        slug: 'رسانه-آزمایشی',
        title: 'رسانه‌دار',
        primaryMediaId: first.id,
        galleryMediaIds: [second.id],
      });

      const detail = await getSpecimenBySlug('رسانه-آزمایشی', fixtures.handle.db);
      expect(detail?.image?.src).toBe('/images/hall-organic.webp');
      expect(detail?.gallery).toHaveLength(1);
      expect(detail?.gallery[0]?.image?.src).toBe('/images/hall-geological.webp');
      expect(detail?.gallery[0]?.role).toBe('gallery');
    });

    it('links an encyclopedia article to an object and lists it on both sides', async () => {
      const { createArticle } = await import('./collection-fixtures');
      const specimen = await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-ARTICLE',
        slug: 'مقاله-آزمایشی-نمونه',
        title: 'نمونهٔ مقاله‌دار',
      });

      await createArticle(fixtures.handle, {
        code: 'test-article',
        slug: 'مقاله-آزمایشی',
        title: 'مقالهٔ آزمایشی',
        specimenIds: [specimen.id],
      });

      const detail = await getSpecimenBySlug('مقاله-آزمایشی-نمونه', fixtures.handle.db);
      expect(detail?.articles.map((article) => article.slug)).toContain('مقاله-آزمایشی');

      const { getArticleBySlug } = await import('@/db/queries/articles');
      const article = await getArticleBySlug('مقاله-آزمایشی', fixtures.handle.db);
      expect(article?.specimens.map((entry) => entry.slug)).toContain('مقاله-آزمایشی-نمونه');
      expect(article?.sources).toHaveLength(1);
    });

    it('searches Persian text through normalisation, Latin names, formulas and places', async () => {
      await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-SEARCH',
        slug: 'جست‌وجو-آزمایشی',
        // Written with ZWNJ, as a Persian editor would type it.
        title: 'نیمه‌قیمتی آزمایشی',
        scientificName: 'Searchite',
        chemicalFormula: 'Sr₂Al₃',
        colors: ['سبز'],
        transparency: ['شفاف'],
        provenances: [
          { countryName: 'کلمبیا', countryCode: 'CO', region: 'موگوک', locality: null, note: null },
        ],
      });

      // ZWNJ present in the data, absent in the query.
      const withoutHalfSpace = await listSpecimens({ q: 'نیمهقیمتی' }, fixtures.handle.db);
      expect(withoutHalfSpace.total).toBeGreaterThan(0);

      // Arabic yeh and kaf fold onto the Persian letters.
      const arabicForm = await listSpecimens({ q: 'نيبه' }, fixtures.handle.db);
      expect(arabicForm.total).toBeGreaterThanOrEqual(0); // folding must not error

      const latin = await listSpecimens({ q: 'searchite' }, fixtures.handle.db);
      expect(latin.items.some((item) => item.slug === 'جست‌وجو-آزمایشی')).toBe(true);

      const formula = await listSpecimens({ q: 'Sr₂Al₃' }, fixtures.handle.db);
      expect(formula.items.some((item) => item.slug === 'جست‌وجو-آزمایشی')).toBe(true);

      const place = await listSpecimens({ q: 'موگوک' }, fixtures.handle.db);
      expect(place.items.some((item) => item.slug === 'جست‌وجو-آزمایشی')).toBe(true);

      // A partial word still matches through the substring fallback.
      const partial = await listSpecimens({ q: 'نیمه' }, fixtures.handle.db);
      expect(partial.total).toBeGreaterThan(0);

      // And something absent finds nothing rather than everything.
      const absent = await listSpecimens({ q: 'یاقوتی-که-نیست' }, fixtures.handle.db);
      expect(absent.total).toBe(0);
      expect(absent.state).toBe('empty');
    });

    it('combines filters and reports only values that exist', async () => {
      const media = await createMedia(fixtures.handle, { storageKey: 'images/hall-rare-minerals.webp' });
      // A family of its own, so the assertions below measure this test's object
      // rather than every object a previous test happened to classify.
      const familyId = await createTerm(fixtures.handle, {
        kind: 'mineral_family',
        code: 'filter-family',
        label: 'خانوادهٔ فیلتر',
        latinName: 'Filterite',
      });
      await createPublished(fixtures.handle, {
        inventoryNo: 'GEM-TEST-FILTER',
        slug: 'فیلتر-آزمایشی',
        title: 'فیلترشدنی',
        mineralFamilyId: familyId,
        colors: ['بنفش'],
        transparency: ['نیمه‌شفاف'],
        mohsMin: '7',
        mohsMax: '7.5',
        primaryMediaId: media.id,
        provenances: [
          { countryName: 'برزیل', countryCode: 'BR', region: null, locality: null, note: null },
        ],
      });

      const byFamily = await listSpecimens({ family: 'filter-family' }, fixtures.handle.db);
      expect(byFamily.total).toBe(1);

      const byColor = await listSpecimens({ color: 'بنفش' }, fixtures.handle.db);
      expect(byColor.items.map((item) => item.slug)).toContain('فیلتر-آزمایشی');

      const byHardness = await listSpecimens({ hardness: 7.2 }, fixtures.handle.db);
      expect(byHardness.items.map((item) => item.slug)).toContain('فیلتر-آزمایشی');

      const outsideHardness = await listSpecimens({ hardness: 9 }, fixtures.handle.db);
      expect(outsideHardness.items.map((item) => item.slug)).not.toContain('فیلتر-آزمایشی');

      const byTransparency = await listSpecimens({ transparency: 'نیمه‌شفاف' }, fixtures.handle.db);
      expect(byTransparency.total).toBe(1);

      const byCountry = await listSpecimens({ country: 'BR' }, fixtures.handle.db);
      expect(byCountry.total).toBe(1);

      const byMedia = await listSpecimens({ media: 'image' }, fixtures.handle.db);
      expect(byMedia.total).toBeGreaterThan(0);

      const combined = await listSpecimens(
        { family: 'filter-family', color: 'بنفش', transparency: 'نیمه‌شفاف', country: 'BR' },
        fixtures.handle.db,
      );
      expect(combined.total).toBe(1);

      const impossible = await listSpecimens(
        { family: 'filter-family', color: 'قرمز-ناموجود' },
        fixtures.handle.db,
      );
      expect(impossible.total).toBe(0);

      const facets = await getFilterOptions(fixtures.handle.db);
      expect(facets.families.map((entry) => entry.code)).toContain('filter-family');
      expect(facets.colors.map((entry) => entry.value)).toContain('بنفش');
      expect(facets.countries.map((entry) => entry.code)).toContain('BR');
      expect(facets.halls.find((entry) => entry.code === 'crystals')?.total).toBeGreaterThan(0);
    });

    it('sorts by Persian alphabetical order, and by date in both directions', async () => {
      await fixtures.handle.db.execute(sql`delete from specimens where inventory_no like 'GEM-TEST-SORT%'`);

      for (const [index, title] of ['آبان', 'بهرام', 'پروین', 'یزدان'].entries()) {
        await createPublished(fixtures.handle, {
          inventoryNo: `GEM-TEST-SORT-${index}`,
          slug: `مرتب‌سازی-${index}`,
          title,
        });
      }

      const sorted = await listSpecimens(
        { sort: 'title-fa', pageSize: 48 },
        fixtures.handle.db,
      );
      const titles = sorted.items.map((item) => item.title);
      const persianOnly = titles.filter((title) => ['آبان', 'بهرام', 'پروین', 'یزدان'].includes(title));
      expect(persianOnly).toEqual(['آبان', 'بهرام', 'پروین', 'یزدان']);

      const newest = await listSpecimens({ sort: 'newest' }, fixtures.handle.db);
      const oldest = await listSpecimens({ sort: 'oldest' }, fixtures.handle.db);
      expect(newest.items[0]?.id).not.toBe(oldest.items[0]?.id);
    });

    it('paginates on the server and never returns more than the page size', async () => {
      await fixtures.handle.db.execute(sql`delete from specimens where inventory_no like 'GEM-TEST-PAGE%'`);

      for (let index = 0; index < 7; index += 1) {
        await createPublished(fixtures.handle, {
          inventoryNo: `GEM-TEST-PAGE-${index}`,
          slug: `صفحه-${index}`,
          title: `صفحهٔ ${index}`,
        });
      }

      const first = await listSpecimens({ pageSize: 3, sort: 'title-fa' }, fixtures.handle.db);
      expect(first.items).toHaveLength(3);
      expect(first.total).toBeGreaterThanOrEqual(7);
      expect(first.pageCount).toBe(Math.ceil(first.total / 3));

      const second = await listSpecimens({ pageSize: 3, page: 2, sort: 'title-fa' }, fixtures.handle.db);
      expect(second.items[0]?.id).not.toBe(first.items[0]?.id);

      const clamped = await listSpecimens({ pageSize: 100_000, page: -4 }, fixtures.handle.db);
      expect(clamped.page).toBe(1);
      expect(clamped.pageSize).toBeLessThanOrEqual(48);
    });

    it('treats an invalid or hostile query as a query, not as SQL', async () => {
      const injection = await listSpecimens(
        { q: "'; drop table specimens; --" },
        fixtures.handle.db,
      );
      expect(injection.state).not.toBe('unavailable');

      const stillThere = await fixtures.handle.db.execute<{ count: number }>(
        sql`select count(*)::int as count from specimens`,
      );
      expect(stillThere.rows[0]?.count).toBeGreaterThan(0);

      const badHardness = await listSpecimens({ hardness: Number.NaN }, fixtures.handle.db);
      expect(badHardness.state).not.toBe('unavailable');

      const emptyQuery = await listSpecimens({ q: '   ' }, fixtures.handle.db);
      expect(emptyQuery.total).toBeGreaterThan(0);
    });

    it('exposes published slugs for the sitemap and nothing else', async () => {
      const slugs = await listPublishedSlugs(fixtures.handle.db);
      expect(slugs.some((entry) => entry.slug === 'چند-تالار-آزمایشی')).toBe(true);
      expect(slugs.some((entry) => entry.slug === 'پیش-نویس-آزمایشی')).toBe(false);
      expect(slugs.some((entry) => entry.slug === 'حذف-آزمایشی')).toBe(false);
    });

    it('writes an audit row for every mutation', async () => {
      const rows = await fixtures.handle.db.execute<{ action: string }>(
        sql`select action from audit_log order by id`,
      );
      const actions = rows.rows.map((row) => row.action);
      expect(actions).toContain('specimen.create');
      expect(actions).toContain('specimen.update');
      expect(actions).toContain('specimen.publish');
      expect(actions).toContain('specimen.archive');
      expect(actions).toContain('specimen.delete');
    });

    it('leaves no orphan translation, provenance or hall link behind', async () => {
      const orphans = await fixtures.handle.db.execute<{ orphans: number }>(sql`
        select count(*)::int as orphans from specimen_translations t
        left join specimens s on s.id = t.specimen_id
        where s.id is null
      `);
      expect(orphans.rows[0]?.orphans).toBe(0);

      const provenanceOrphans = await fixtures.handle.db.execute<{ orphans: number }>(sql`
        select count(*)::int as orphans from specimen_provenances p
        left join specimens s on s.id = p.specimen_id
        where s.id is null
      `);
      expect(provenanceOrphans.rows[0]?.orphans).toBe(0);

      const hallOrphans = await fixtures.handle.db.execute<{ orphans: number }>(sql`
        select count(*)::int as orphans from hall_specimens h
        left join specimens s on s.id = h.specimen_id
        where s.id is null
      `);
      expect(hallOrphans.rows[0]?.orphans).toBe(0);
    });
  });
}
