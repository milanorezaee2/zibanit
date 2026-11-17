/**
 * The database compatibility suite.
 *
 * One list of assertions, executed against whichever engine is under test:
 *
 *   • PGlite          — always, in-process, temporary directory
 *   • PostgreSQL      — when TEST_DATABASE_URL points at a disposable server
 *
 * The point is not "does PGlite work" but "do these two engines behave the same
 * for every feature the museum actually uses". Anything asserted here is a
 * construct the schema really relies on: enums, UUID defaults, numeric precision,
 * generated tsvector columns, GIN indexing, foreign keys, cascade deletes, unique
 * constraints and timestamps with time zone.
 *
 * If a future feature needs a construct that is not covered here, it gets added
 * here first — and will then be exercised on both engines forever.
 */
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DatabaseHandle } from '@/db/client';
import { checkPersianTextSearch } from '@/db/capabilities';
import { getMigrationStatus, hasSchema, countMigrationFiles } from '@/db/migrate';
import { mediaAssets, specimenTranslations, specimens, users } from '@/db/schema';


/**
 * Drizzle wraps driver errors ("Failed query: …") and keeps the engine's own
 * message on `cause`. Assertions about *why* a statement failed must therefore
 * inspect the whole chain, not just the outermost string.
 */
function errorChainText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;

  for (let depth = 0; depth < 6 && current; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = (current as Error & { cause?: unknown }).cause;
    } else {
      parts.push(String(current));
      break;
    }
  }

  return parts.join(' | ');
}

/**
 * Asserts that the database itself rejected a statement, matching the engine's
 * own message rather than the ORM's wrapper.
 */
async function expectDatabaseRejection(run: () => Promise<unknown>, pattern: RegExp): Promise<void> {
  let rejected = false;

  try {
    await run();
  } catch (error) {
    rejected = true;
    expect(errorChainText(error), 'engine reason').toMatch(pattern);
  }

  expect(rejected, 'the database was expected to reject this statement').toBe(true);
}

export function defineDatabaseSuite(label: string, open: () => Promise<DatabaseHandle>, close: () => Promise<void>) {
  describe(`database compatibility — ${label}`, () => {
    let handle: DatabaseHandle;

    beforeAll(async () => {
      handle = await open();
    });

    afterAll(async () => {
      await close();
    });

    it('applies every migration from an empty database', async () => {
      const status = await getMigrationStatus(handle);
      expect(status.available).toBeGreaterThan(0);
      expect(status.available).toBe(countMigrationFiles());
      expect(status.applied).toBe(status.available);
      expect(status.upToDate).toBe(true);
    });

    it('is idempotent — re-running migrations changes nothing', async () => {
      const before = await getMigrationStatus(handle);
      const { runMigrations } = await import('@/db/migrate');
      await runMigrations(handle);
      const after = await getMigrationStatus(handle);
      expect(after.applied).toBe(before.applied);
    });

    it('creates all eight Phase 0 tables', async () => {
      expect(await hasSchema(handle)).toBe(true);

      const result = await handle.db.execute<{ table_name: string }>(
        sql`select table_name from information_schema.tables
            where table_schema = 'public' order by table_name`,
      );
      expect(result.rows.map((row) => row.table_name)).toEqual([
        'app_settings',
        'audit_log',
        'media_assets',
        'media_translations',
        'sessions',
        'specimen_translations',
        'specimens',
        'users',
      ]);
    });

    it('supports enum types and rejects values outside them', async () => {
      await handle.db.execute(sql`insert into users (email, display_name, role)
        values ('curator@gemoria.test', 'کیوریتور', 'curator')`);

      await expectDatabaseRejection(
        () =>
          handle.db.execute(sql`insert into users (email, display_name, role)
            values ('nobody@gemoria.test', 'ناشناس', 'not_a_role')`),
        /invalid input value for enum/i,
      );
    });

    it('generates UUID primary keys in the database', async () => {
      const result = await handle.db.execute<{ id: string }>(
        sql`insert into users (email, display_name) values ('uuid@gemoria.test', 'شناسه')
            returning id`,
      );
      const id = result.rows[0]?.id;
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('keeps carat weight as exact decimal, not floating point', async () => {
      await handle.db.insert(specimens).values({
        inventoryNo: 'GEM-TEST-CARAT',
        weightCt: '24.137',
      });

      const result = await handle.db.execute<{ weight: string }>(
        sql`select weight_ct::text as weight from specimens where inventory_no = 'GEM-TEST-CARAT'`,
      );
      expect(result.rows[0]?.weight).toBe('24.137');

      await handle.db.execute(sql`delete from specimens where inventory_no = 'GEM-TEST-CARAT'`);
    });

    it('derives search_tsv from search_text via a generated column', async () => {
      const [owner] = await handle.db
        .insert(specimens)
        .values({ inventoryNo: 'GEM-TEST-FTS', status: 'published' })
        .returning({ id: specimens.id });
      expect(owner?.id).toBeTruthy();

      await handle.db.insert(specimenTranslations).values({
        specimenId: owner!.id,
        locale: 'fa',
        slug: 'زمرد-موزو',
        title: 'زمرد موزو',
        searchText: 'زمرد موزو کلمبیا بریل سبز',
      });

      // Persian text, matched through a real tsquery — no extensions involved.
      const result = await handle.db.execute<{ title: string }>(
        sql`select title from specimen_translations
            where search_tsv @@ to_tsquery('simple', 'زمرد')`,
      );
      expect(result.rows.map((row) => row.title)).toEqual(['زمرد موزو']);

      // And a term that is not present must not match.
      const miss = await handle.db.execute<{ title: string }>(
        sql`select title from specimen_translations
            where search_tsv @@ to_tsquery('simple', 'یاقوت')`,
      );
      expect(miss.rows).toHaveLength(0);
    });

    it('has a GIN index on the search column', async () => {
      const result = await handle.db.execute<{ indexname: string }>(
        sql`select indexname from pg_indexes
            where tablename = 'specimen_translations'
              and indexdef ilike '%using gin%'`,
      );
      expect(result.rows.map((row) => row.indexname)).toContain(
        'specimen_translations_search_idx',
      );
    });

    it('enforces slug uniqueness per locale, not globally', async () => {
      const [specimen] = await handle.db
        .insert(specimens)
        .values({ inventoryNo: 'GEM-TEST-SLUG' })
        .returning({ id: specimens.id });

      await handle.db.insert(specimenTranslations).values({
        specimenId: specimen!.id,
        locale: 'fa',
        slug: 'shared-slug',
        title: 'فارسی',
      });

      // Same slug in a different locale is allowed…
      await handle.db.insert(specimenTranslations).values({
        specimenId: specimen!.id,
        locale: 'en',
        slug: 'shared-slug',
        title: 'English',
      });

      // …but the same slug in the same locale is not.
      await expectDatabaseRejection(
        () =>
          handle.db.insert(specimenTranslations).values({
            specimenId: specimen!.id,
            locale: 'fa',
            slug: 'shared-slug',
            title: 'تکراری',
          }),
        /duplicate key value|unique constraint/i,
      );

      await handle.db.execute(sql`delete from specimens where inventory_no = 'GEM-TEST-SLUG'`);
    });

    it('cascades translation deletes with their specimen', async () => {
      const [specimen] = await handle.db
        .insert(specimens)
        .values({ inventoryNo: 'GEM-TEST-CASCADE' })
        .returning({ id: specimens.id });

      await handle.db.insert(specimenTranslations).values({
        specimenId: specimen!.id,
        locale: 'fa',
        slug: 'cascade-فارسی',
        title: 'آبشاری',
      });

      await handle.db.execute(sql`delete from specimens where inventory_no = 'GEM-TEST-CASCADE'`);

      const orphan = await handle.db.execute<{ count: number }>(
        sql`select count(*)::int as count from specimen_translations where specimen_id = ${specimen!.id}::uuid`,
      );
      expect(orphan.rows[0]?.count).toBe(0);
    });

    it('rejects rows that violate a foreign key', async () => {
      await expectDatabaseRejection(
        () =>
          handle.db.insert(mediaAssets).values({
            kind: 'image',
            storageKey: 'media/orphan.webp',
            mimeType: 'image/webp',
            createdBy: '00000000-0000-4000-8000-000000000000',
          }),
        /violates foreign key constraint/i,
      );
    });

    it('stores timezone-aware timestamps', async () => {
      const result = await handle.db.execute<{ data_type: string }>(
        sql`select data_type from information_schema.columns
            where table_name = 'users' and column_name = 'created_at'`,
      );
      expect(result.rows[0]?.data_type).toBe('timestamp with time zone');
    });

    it('round-trips Persian text and JSONB settings', async () => {
      await handle.db.execute(sql`insert into app_settings (key, value)
        values ('museum.title', ${JSON.stringify({ fa: 'گموریا', tagline: 'سنگِ امپراتوریها' })}::jsonb)`);

      const result = await handle.db.execute<{ title: string; tagline: string }>(
        sql`select value->>'fa' as title, value->>'tagline' as tagline
            from app_settings where key = 'museum.title'`,
      );
      expect(result.rows[0]).toEqual({ title: 'گموریا', tagline: 'سنگِ امپراتوریها' });
    });

    it('can tokenise Persian text (UTF-8 cluster requirement)', async () => {
      const capability = await checkPersianTextSearch(handle);

      // A failure here is a genuine production defect, not a test nuisance: on a
      // cluster initialised with the default SQL_ASCII/C locale, PostgreSQL
      // discards Persian words while tokenising and every search quietly returns
      // nothing. The parity harness provisions its cluster with
      // `--encoding=UTF8 --locale=C.UTF-8` for exactly this reason.
      expect(capability.supported, capability.detail).toBe(true);
      expect(capability.encoding.toUpperCase()).toContain('UTF8');
      expect(capability.sample).toContain('زمرد');
    });

    it('exposes the same migration ledger through the health path', async () => {
      const status = await getMigrationStatus(handle);
      expect(status.lastAppliedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(status.folder).toMatch(/migrations$/);
    });
  });
}
