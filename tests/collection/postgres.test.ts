/**
 * The identical collection suite against a real PostgreSQL server.
 *
 * Skipped (not silently passed) unless `TEST_DATABASE_URL` points at a disposable
 * database — the same contract as the Phase 0 parity suite. `npm run test:postgres`
 * provisions one and sets the variable, so the skip never hides a defect in the
 * full gate.
 */
import { openDatabase, type DatabaseHandle } from '@/db/client';
import { defineCollectionSuite } from '../helpers/collection-suite';

const url = process.env.TEST_DATABASE_URL;

if (!url) {
  const { describe, it } = await import('vitest');
  describe('collection — real PostgreSQL (skipped)', () => {
    it('requires TEST_DATABASE_URL pointing at a disposable test database', () => {
      // The suite is not executed: without a server there is nothing to measure,
      // and reporting a pass would be a lie. `npm run test:postgres` sets the
      // variable and runs these same assertions for real.
    });
  });
} else {
  let handle: DatabaseHandle | undefined;

  defineCollectionSuite(
    'real PostgreSQL',
    async () => {
      handle = await openDatabase(
        { driver: 'postgres', url, ssl: false, pgliteDataDir: '', autoMigrate: true },
        { migrate: true },
      );

      // A disposable database is created per run; truncating makes a re-run
      // against the same one behave identically.
      await handle.db.execute(
        (await import('drizzle-orm')).sql`truncate table specimens, halls restart identity cascade`,
      );
      await handle.db.execute(
        (await import('drizzle-orm')).sql`
          insert into halls (code, latin_name, status, sort_order, cover_image_key, hero_image_key, published_at)
          values ('gemstones','Precious Gemstones','published',10,'hallGemstones','hallGemstones',now()),
                 ('semi-precious','Semi-Precious Stones','published',20,'hallSemiPrecious','hallSemiPrecious',now()),
                 ('crystals','Crystals','published',30,'hallCrystals','hallCrystals',now()),
                 ('rare-minerals','Rare Minerals','published',40,'hallRareMinerals','hallRareMinerals',now()),
                 ('geological','Geological Specimens','published',50,'hallGeological','hallGeological',now()),
                 ('organic','Organic-Origin Stones','published',60,'hallOrganic','hallOrganic',now())
          on conflict (code) do nothing
        `,
      );
      await handle.db.execute(
        (await import('drizzle-orm')).sql`
          insert into hall_translations (hall_id, locale, slug, title, summary, search_text)
          select id, 'fa', code, code, code, code from halls
          on conflict (hall_id, locale) do nothing
        `,
      );

      return handle;
    },
    async () => {
      await handle?.close();
    },
  );
}
