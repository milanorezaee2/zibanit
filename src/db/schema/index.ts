/**
 * GEMORIA — database schema (Phase 0 foundation).
 *
 * One schema. One dialect. One set of migrations. PGlite and a real PostgreSQL
 * server both read exactly these definitions; there is no "development schema"
 * and no divergence to reconcile later.
 */
export * from './enums';
export * from './types';
export * from './identity';
export * from './media';
export * from './specimens';
export * from './platform';
