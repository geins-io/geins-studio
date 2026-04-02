// =============================================================================
// Storefront Settings Schema Types
// =============================================================================

/** The full schema — top-level keys become tabs */
export type StorefrontSchema = Record<string, SchemaTab>;

/** The persisted settings values — shape depends on the active schema */
export type StorefrontSettings = Record<string, unknown>;

/** A single tab in the settings UI */
export interface SchemaTab {
  label: string;
  icon?: string;
  sections: SchemaSection[];
}

/** A visual section/card within a tab */
export interface SchemaSection {
  key: string;
  title: string;
  description?: string;
  icon?: string;
  fields: SchemaField[];
}

/** A single form field or group of fields */
export interface SchemaField {
  key: string;
  type: SchemaFieldType;
  label: string;
  description?: string;
  icon?: string;
  default?: unknown;
  required?: boolean;
  disabled?: boolean;

  // Type-specific properties
  options?: SchemaFieldOption[];
  min?: number;
  max?: number;
  pattern?: string;
  placeholder?: string;

  // Grouping
  children?: SchemaField[];

  // Layout
  columns?: 1 | 2 | 3 | 4;

  // Conditional visibility
  visibleWhen?: {
    field: string;
    equals: unknown;
  };
}

export type SchemaFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'font'
  | 'color'
  | 'image'
  | 'radio-cards'
  | 'radio'
  | 'group'
  | 'sub-section';

export interface SchemaFieldOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  type?: 'icon' | 'color';
}
