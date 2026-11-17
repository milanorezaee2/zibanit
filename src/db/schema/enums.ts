/**
 * GEMORIA — PostgreSQL enums.
 *
 * Enums are used for closed vocabularies that the application switches on
 * (status machines, roles, media kinds, the seven crystal systems). Anything the
 * museum staff will want to extend themselves — mineral families, scientific
 * groups, specimen types, colours — belongs in a table, not an enum.
 *
 * Values are additive-only: never reorder, never rename. Extending an enum is a
 * migration (`ALTER TYPE ... ADD VALUE`); removing one is a data migration.
 */
import { pgEnum } from 'drizzle-orm/pg-core';

/** Languages the museum can be published in. Phase 0 enables `fa` only. */
export const localeEnum = pgEnum('locale', ['fa', 'en', 'ar']);

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'curator',
  'editor',
  'media_manager',
  'seo_manager',
  'viewer',
]);

export const userStatusEnum = pgEnum('user_status', ['invited', 'active', 'suspended']);

/** The editorial lifecycle of every object in the museum. */
export const publicationStatusEnum = pgEnum('publication_status', [
  'draft',
  'scheduled',
  'published',
  'archived',
]);

export const mediaKindEnum = pgEnum('media_kind', [
  'image',
  'video',
  'model',
  'panorama',
  'document',
]);

export const mediaStatusEnum = pgEnum('media_status', [
  'uploading',
  'processing',
  'ready',
  'failed',
]);

/**
 * The seven crystal systems.
 *
 * A genuinely closed scientific vocabulary: crystallography has had exactly these
 * seven classes since the 19th century and the museum will never invent an eighth.
 * Keeping them as an enum makes an invalid value impossible at the database level
 * instead of relying on a form's dropdown. Persian labels live in
 * `src/content/mineral.ts`, because they are interface text, not data.
 */
export const crystalSystemEnum = pgEnum('crystal_system', [
  'triclinic',
  'monoclinic',
  'orthorhombic',
  'tetragonal',
  'trigonal',
  'hexagonal',
  'cubic',
]);

/**
 * The four independent axes of classification (Phase 1B).
 *
 * Deliberately *not* the halls: a specimen in the "Crystals" hall is not thereby
 * classified scientifically as a crystal, and one object may hang in three halls
 * while belonging to exactly one mineral family. The kinds are structural; the
 * terms inside them are museum-editable rows.
 */
export const taxonomyKindEnum = pgEnum('taxonomy_kind', [
  'mineral_family',
  'scientific_group',
  'specimen_type',
  'origin_kind',
]);

/** The role a media asset plays in a specimen's gallery. */
export const specimenMediaRoleEnum = pgEnum('specimen_media_role', [
  'gallery',
  'macro',
  'video',
  'model',
  'panorama',
]);

/** How two specimens are connected. Curated, never inferred from name matching. */
export const specimenRelationKindEnum = pgEnum('specimen_relation_kind', [
  'related',
  'variant',
  'same_locality',
]);
