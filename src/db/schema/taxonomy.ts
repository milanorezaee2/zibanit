/**
 * GEMORIA — scientific classification.
 *
 * Classification is independent of the museum's display architecture. A hall is
 * where a visitor finds an object; a mineral family is what the object *is*. One
 * object may hang in three halls and still belong to exactly one mineral family,
 * which is why this is a table of its own and not a column on the hall.
 *
 * Four axes are modelled with one structure rather than four near-identical
 * tables, because they are all "a stable code, a Latin name and a Persian label":
 *
 *   mineral_family    بریل، کوارتز، فلدسپار — the species grouping
 *   scientific_group  سیلیکات، کربنات، اکسید — the chemical class
 *   specimen_type     بلور، برش، گِیود، نمونهٔ خام — the physical form on display
 *   origin_kind       معدنی، آلی — how the material came to exist
 *
 * The `kind` discriminator is an enum (the axes are structural); the terms are
 * rows the museum can extend without a migration.
 */
import { index, pgTable, smallint, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { localeEnum, taxonomyKindEnum } from './enums';

export const taxonomyTerms = pgTable(
  'taxonomy_terms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: taxonomyKindEnum('kind').notNull(),
    /**
     * Stable, language-neutral identifier used by imports and by the seed of the
     * six halls. Not a URL: the URL segment is the translated slug.
     */
    code: text('code').notNull(),
    /** The scientific or English designation, shown small beneath the Persian label. */
    latinName: text('latin_name'),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('taxonomy_terms_kind_code_key').on(table.kind, table.code),
    index('taxonomy_terms_kind_order_idx').on(table.kind, table.sortOrder),
  ],
);

export const taxonomyTermTranslations = pgTable(
  'taxonomy_term_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    termId: uuid('term_id')
      .notNull()
      .references(() => taxonomyTerms.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    label: text('label').notNull(),
    description: text('description'),
  },
  (table) => [
    unique('taxonomy_term_translations_term_locale_key').on(table.termId, table.locale),
  ],
);
