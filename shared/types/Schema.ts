// =============================================================================
// Generic JSON Schema Types
// =============================================================================
// Schema-driven form definitions consumed by SchemaRenderer / SchemaFormField.
// Reused outside the storefront-settings flow — kept domain-agnostic.

/** A single tab in a schema-driven form UI */
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
  fields: SchemaFormField[];
}

/** A single form field or group of fields */
export interface SchemaFormField {
  key: string;
  type: SchemaFieldType;
  label: string;
  description?: string;
  icon?: string;
  default?: unknown;
  required?: boolean;
  disabled?: boolean;

  // Type-specific properties
  options?: SchemaFormFieldOption[];
  min?: number;
  max?: number;
  pattern?: string;
  placeholder?: string;

  // boolean-choice
  choice?: BooleanChoiceConfig;

  // image
  accept?: string;
  maxSizeMB?: number;

  // Grouping
  children?: SchemaFormField[];

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
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'boolean-choice'
  | 'select'
  | 'font'
  | 'color'
  | 'image'
  | 'radio-cards'
  | 'radio'
  | 'sub-section';

/** Inner choice descriptor for `boolean-choice` fields. Reveals when `enabled === true`. */
export interface BooleanChoiceConfig {
  key: string;
  label?: string;
  type: 'radio' | 'radio-cards';
  options: SchemaFormFieldOption[];
}

export interface SchemaFormFieldOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  type?: 'icon' | 'color';
}
