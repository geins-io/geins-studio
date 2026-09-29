// =============================================================================
// Storefront Settings Types
// =============================================================================
// Schema definitions live in `./Schema` — kept generic and reusable.

import type { SchemaTab } from './Schema';

/** The full schema — top-level keys become tabs */
export type StorefrontSchema = Record<string, SchemaTab>;

/** The persisted settings values — shape depends on the active schema */
export type StorefrontSettings = Record<string, unknown>;

export interface SchemaChangeEntry {
  key: string;
  value: unknown;
}

export interface SchemaChangeAnalysis {
  /** Fields with no current value that will get their schema default. */
  added: SchemaChangeEntry[];
  /** Current values that no longer fit their field; `value` is the old value. */
  typeReset: SchemaChangeEntry[];
  /** Leaf settings not covered by any field in the schema. */
  orphaned: SchemaChangeEntry[];
}

export type SchemaApplyMode = 'changes' | 'reset';

export interface SchemaApplyOptions {
  mode: SchemaApplyMode;
  removeOrphans: boolean;
}
