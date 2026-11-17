/**
 * GEMORIA — PostgreSQL enums.
 *
 * Enums are used for closed vocabularies that the application switches on
 * (status machines, roles, media kinds). Anything the museum staff will want to
 * extend themselves — mineral species, colours, cuts, treatments — belongs in a
 * table, not an enum, and arrives in Phase 1.
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
