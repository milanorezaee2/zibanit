/**
 * GEMORIA — the objects of the museum.
 *
 * This is the core pair of Phase 0: `specimens` holds language-neutral facts
 * (inventory number, status, weight, provenance, relationships) and
 * `specimen_translations` holds everything a visitor reads. Slugs live on the
 * translation, so the same object can be `/specimens/زمرد-موزو` in Persian and
 * `/en/specimens/emerald-muzo` later without breaking a single link.
 *
 * Phase 1B adds the scientific record (formula, crystal system, hardness,
 * density, optics), the classification links, the provenance table, the gallery
 * join and curated relations. Every scientific column is nullable, because
 * «همه ویژگی‌ها برای تمام نمونه‌ها قابل استفاده نیستند»: a cut emerald has a
 * refractive index and a sedimentary core sample does not, and inventing a value
 * to fill the gap would be fabricating science.
 */
import { sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import {
  crystalSystemEnum,
  localeEnum,
  publicationStatusEnum,
  specimenMediaRoleEnum,
  specimenRelationKindEnum,
} from './enums';
import { users } from './identity';
import { mediaAssets } from './media';
import { taxonomyTerms } from './taxonomy';
import { tsvector } from './types';

export const specimens = pgTable(
  'specimens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Stable, language-neutral accession number. Never shown as a URL. */
    inventoryNo: text('inventory_no').notNull().unique(),
    status: publicationStatusEnum('status').notNull().default('draft'),
    /* ── Identity of the object ───────────────────────────────────────────── */

    /**
     * The scientific (or English) designation — «Beryl», «Emerald», «Quartz».
     * Language-neutral by nature: a mineral name is not translated, it is
     * transliterated. The Persian display name lives on the translation.
     */
    scientificName: text('scientific_name'),

    /* ── Scientific record: every field nullable, none ever guessed ───────── */

    chemicalFormula: text('chemical_formula'),
    crystalSystem: crystalSystemEnum('crystal_system'),
    /**
     * Hardness, density and refractive index are *ranges* in real mineralogy:
     * quartz is 7, beryl 7.5–8, and a solid is only sometimes narrower than the
     * species. Two columns store the measured range; the reader shows one number
     * when both ends agree.
     */
    mohsMin: numeric('mohs_min', { precision: 3, scale: 1 }),
    mohsMax: numeric('mohs_max', { precision: 3, scale: 1 }),
    /** g/cm³ */
    densityMin: numeric('density_min', { precision: 5, scale: 2 }),
    densityMax: numeric('density_max', { precision: 5, scale: 2 }),
    refractiveIndexMin: numeric('refractive_index_min', { precision: 5, scale: 3 }),
    refractiveIndexMax: numeric('refractive_index_max', { precision: 5, scale: 3 }),

    /* ── Classification links (independent of the halls) ─────────────────── */

    mineralFamilyId: uuid('mineral_family_id').references(() => taxonomyTerms.id, {
      onDelete: 'set null',
    }),
    scientificGroupId: uuid('scientific_group_id').references(() => taxonomyTerms.id, {
      onDelete: 'set null',
    }),
    specimenTypeId: uuid('specimen_type_id').references(() => taxonomyTerms.id, {
      onDelete: 'set null',
    }),
    originKindId: uuid('origin_kind_id').references(() => taxonomyTerms.id, {
      onDelete: 'set null',
    }),

    /* ── Physical record of the accession ────────────────────────────────── */

    /** Carat weight is measured, so it is exact decimal — never a float. */
    weightCt: numeric('weight_ct', { precision: 10, scale: 3 }),
    dimensionsMm: text('dimensions_mm'),
    pieces: smallint('pieces').notNull().default(1),
    provenance: text('provenance'),
    certificateRef: text('certificate_ref'),
    acquiredAt: date('acquired_at'),
    isFeatured: boolean('is_featured').notNull().default(false),
    isHighlight: boolean('is_highlight').notNull().default(false),
    primaryMediaId: uuid('primary_media_id').references(() => mediaAssets.id, {
      onDelete: 'set null',
    }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    /** Soft delete: published museum objects are archived, not destroyed. */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('specimens_status_published_idx').on(table.status, table.publishedAt),
    index('specimens_featured_idx').on(table.isFeatured),
    index('specimens_primary_media_idx').on(table.primaryMediaId),
    /* The collection list sorts by «newest» / «oldest» and filters by status. */
    index('specimens_status_updated_idx').on(table.status, table.updatedAt),
    /* Filtering by classification, without a hall in the predicate. */
    index('specimens_family_idx').on(table.mineralFamilyId),
    index('specimens_group_idx').on(table.scientificGroupId),
    index('specimens_type_idx').on(table.specimenTypeId),
    index('specimens_scientific_name_idx').on(table.scientificName),
    index('specimens_deleted_idx').on(table.deletedAt),
  ],
);

export const specimenTranslations = pgTable(
  'specimen_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    specimenId: uuid('specimen_id')
      .notNull()
      .references(() => specimens.id, { onDelete: 'cascade' }),
    locale: localeEnum('locale').notNull(),
    /** Unique per locale, not globally: /specimens/زمرد and /en/specimens/emerald. */
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    summary: text('summary'),
    /** The scientific introduction: what the material is. */
    story: text('story'),
    /** How it formed — a separate question from what it is. */
    formation: text('formation'),
    /** Documentary history of this accession, once there is a source for it. */
    history: text('history'),
    /** Supplementary notes: condition, preparation, curatorial remarks. */
    notes: text('notes'),

    /* ── Descriptive attributes, per locale ───────────────────────────────
       Colours and transparency are plural by nature — an ametrine is two
       colours, a bicolour tourmaline is three. Storing them as arrays keeps one
       object in one row, and GIN indexes make containment filters («everything
       green») a real indexed query rather than a LIKE over a joined string. */

    colors: text('colors').array(),
    transparency: text('transparency').array(),
    luster: text('luster'),
    cleavage: text('cleavage'),
    fracture: text('fracture'),

    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    /**
     * A sort key in Persian alphabetical order, computed by
     * `persianSortKey()` when the record is written.
     *
     * `ORDER BY title` would sort by the *cluster's* collation: with C.UTF-8 that
     * is code-point order, in which «آب» sorts after «یاقوت». The museum cannot
     * require a cluster-level ICU locale it does not control, so the order is
     * materialised instead: deterministic, identical on PGlite and PostgreSQL, and
     * indexable. Latin names sort after every Persian letter.
     */
    titleSortKey: text('title_sort_key'),
    /** Normalised Persian text; `search_tsv` is derived from it by the database. */
    searchText: text('search_text'),
    searchTsv: tsvector('search_tsv').generatedAlwaysAs(
      sql`to_tsvector('simple', coalesce(search_text, ''))`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('specimen_translations_specimen_locale_key').on(table.specimenId, table.locale),
    unique('specimen_translations_locale_slug_key').on(table.locale, table.slug),
    index('specimen_translations_search_idx').using('gin', table.searchTsv),
    index('specimen_translations_locale_idx').on(table.locale),
    index('specimen_translations_sort_idx').on(table.titleSortKey),
    /* Facet filters run on the translation because colours and transparency are
       written words, not codes: a curator types «سبز آبی», not #2E8B57. */
    index('specimen_translations_colors_idx').using('gin', table.colors),
    index('specimen_translations_transparency_idx').using('gin', table.transparency),
  ],
);

/**
 * Where an object came from.
 *
 * A separate table because an object can have more than one locality (a suite of
 * specimens from one pocket, a material found on three continents), and because
 * the atlas will attach coordinates to a *place*, not to a specimen. `latitude`
 * and `longitude` are already here so that the atlas phase adds a map, not a
 * migration — and they are nullable, because a locality known only as
 * «منطقهٔ موگوک» has no honest coordinate.
 */
export const specimenProvenances = pgTable(
  'specimen_provenances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    specimenId: uuid('specimen_id')
      .notNull()
      .references(() => specimens.id, { onDelete: 'cascade' }),
    /** ISO 3166-1 alpha-2, upper-cased by the service layer. */
    countryCode: text('country_code'),
    countryName: text('country_name'),
    region: text('region'),
    /** Mine, pit, quarry or discovery site. */
    locality: text('locality'),
    note: text('note'),
    latitude: numeric('latitude', { precision: 9, scale: 6 }),
    longitude: numeric('longitude', { precision: 9, scale: 6 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('specimen_provenances_specimen_idx').on(table.specimenId, table.sortOrder),
    index('specimen_provenances_country_idx').on(table.countryCode),
  ],
);

/**
 * The gallery.
 *
 * `specimens.primary_media_id` remains the single source of truth for the featured
 * photograph (the homepage query depends on it, and so does Open Graph). This table
 * holds every *additional* attachment and its role, so a video does not have to
 * masquerade as an image and a 3D model has a place to arrive when one exists.
 */
export const specimenMedia = pgTable(
  'specimen_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    specimenId: uuid('specimen_id')
      .notNull()
      .references(() => specimens.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => mediaAssets.id, { onDelete: 'cascade' }),
    role: specimenMediaRoleEnum('role').notNull().default('gallery'),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('specimen_media_specimen_media_key').on(table.specimenId, table.mediaId),
    index('specimen_media_specimen_order_idx').on(table.specimenId, table.sortOrder),
    index('specimen_media_media_idx').on(table.mediaId),
  ],
);

/**
 * Curated relations between objects.
 *
 * «ارتباط نمونه‌ها نباید صرفاً با مقایسه رشته نام‌ها تعیین شود.» — so it is not:
 * a relation is a row a curator wrote. The *suggested* related specimens on a page
 * additionally use shared classification and shared locality, both of which are
 * foreign keys and geographic rows, not string comparisons.
 *
 * A relation is directed as written (A→B); the read model queries both directions
 * so that a curator only has to record it once.
 */
export const specimenRelations = pgTable(
  'specimen_relations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    specimenId: uuid('specimen_id')
      .notNull()
      .references(() => specimens.id, { onDelete: 'cascade' }),
    relatedSpecimenId: uuid('related_specimen_id')
      .notNull()
      .references(() => specimens.id, { onDelete: 'cascade' }),
    kind: specimenRelationKindEnum('kind').notNull().default('related'),
    note: text('note'),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('specimen_relations_pair_key').on(table.specimenId, table.relatedSpecimenId),
    index('specimen_relations_specimen_idx').on(table.specimenId, table.sortOrder),
    index('specimen_relations_related_idx').on(table.relatedSpecimenId),
  ],
);
