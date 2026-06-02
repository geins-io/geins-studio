// =============================================================================
// Storefront Settings Types
// =============================================================================
// Schema definitions live in `./Schema` — kept generic and reusable.

import type { SchemaTab } from './Schema';

/** The full schema — top-level keys become tabs */
export type StorefrontSchema = Record<string, SchemaTab>;

/** The persisted settings values — shape depends on the active schema */
export type StorefrontSettings = Record<string, unknown>;
