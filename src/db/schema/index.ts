/**
 * GEMORIA — database schema.
 *
 * One schema. One dialect. One set of migrations. PGlite and a real PostgreSQL
 * server both read exactly these definitions; there is no "development schema"
 * and no divergence to reconcile later.
 *
 * Phase 0 established the platform (identity, sessions, audit, media, the
 * specimen skeleton). Phase 1B adds the museum's catalogue: halls, the four
 * classification axes, the scientific record, provenance, galleries, curated
 * relations and the encyclopedia.
 */
export * from './enums';
export * from './types';
export * from './identity';
export * from './media';
export * from './taxonomy';
export * from './halls';
export * from './specimens';
export * from './articles';
export * from './platform';
