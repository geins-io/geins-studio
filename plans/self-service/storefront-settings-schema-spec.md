# Storefront Settings — Schema & Data Specification

> Defines the shape of `storefrontSchema` (the JSON schema that drives the UI) and `storefrontSettings` (the data/values persisted per channel).

---

## Overview

The Storefront settings tab is entirely driven by a JSON schema. The schema defines **what the user sees** (tabs, sections, fields, labels) and the settings object holds **what the user has configured** (the actual values).

```
Channel
├── storefrontSchema   → describes the form structure (tabs, sections, fields)
└── storefrontSettings → holds the current values (key-value pairs matching the schema)
```

A default schema ships with the app. Users can replace it via the "Change JSON schema" editor to fully customize their storefront settings UI.

---

## `storefrontSchema` — The Schema Shape

The schema is a JSON object where **each top-level key defines a tab**.

### TypeScript types

```typescript
/** The full schema — top-level keys become tabs */
type StorefrontSchema = Record<string, SchemaTab>;

/** A single tab in the settings UI */
interface SchemaTab {
  label: string; // Display name for the tab
  icon?: string; // Lucide icon name (optional)
  sections: SchemaSection[]; // Ordered list of sections within the tab
}

/** A visual section/card within a tab */
interface SchemaSection {
  key: string; // Unique key for the section
  title: string; // Section heading
  description?: string; // Subtitle/description text
  icon?: string; // Lucide icon name (optional)
  fields: SchemaField[]; // Ordered list of fields in this section
}

/** A single form field or group of fields */
interface SchemaField {
  key: string; // Maps to the settings value key (dot-notation path)
  type: SchemaFieldType; // Determines which component to render
  label: string; // Display label
  description?: string; // Help text shown below the label
  icon?: string; // Lucide icon name (shown before label)
  default?: unknown; // Default value if not set in settings
  required?: boolean; // Whether the field is required
  disabled?: boolean; // Whether the field is read-only

  // Type-specific properties
  options?: SchemaFieldOption[]; // For 'select' and 'radio-cards'
  accept?: string; // For 'file' — MIME types (e.g. "image/*")
  min?: number; // For 'number'
  max?: number; // For 'number'
  pattern?: string; // Regex validation for 'string'
  placeholder?: string; // Placeholder text for inputs

  // Grouping
  children?: SchemaField[]; // For 'group' — nested child fields

  // Layout
  columns?: 1 | 2 | 3; // Number of columns for this field (default: 1 = full width)

  // Conditional visibility
  visibleWhen?: {
    field: string; // Key of another field to check
    equals: unknown; // Value that field must have for this field to be visible
  };
}

type SchemaFieldType =
  | 'string' // Text input
  | 'number' // Number input
  | 'boolean' // Switch toggle
  | 'select' // Dropdown select
  | 'color' // Color picker (hex input + swatch)
  | 'file' // File upload
  | 'radio-cards' // Card-style radio selector with icon + description
  | 'group'; // Container for nested child fields (with its own toggle)

interface SchemaFieldOption {
  value: string;
  label: string;
  description?: string; // For radio-cards: shown below the label
  icon?: string; // For radio-cards: Lucide icon name
}
```

### Key design decisions

1. **Flat value keys**: Field `key` values use dot-notation paths (e.g. `"accessRequirements.priceVisibility"`) that map directly into the `storefrontSettings` object. The renderer reads/writes values using these paths.

2. **Groups with toggles**: A `group` field has its own `key` (boolean — the group toggle) and `children` (nested fields). When the group toggle is off, child fields can be visually dimmed or hidden. The group's value and children's values are independent entries in `storefrontSettings`.

3. **Radio-cards**: Each option has `value`, `label`, `description`, and optional `icon`. Rendered as side-by-side clickable cards (like the Commerce/Catalogue selector).

4. **Columns**: Fields can specify `columns: 2` or `columns: 3` to share a row. Adjacent fields with matching column counts are grouped into a CSS grid row. Default is full-width.

5. **Icons**: All icon references are Lucide icon names (matching the project's `nuxt-lucide-icons` setup). They're optional at every level.

---

## `storefrontSettings` — The Data Shape

The settings object is a flat(ish) key-value store. Keys match the `key` values from the schema fields.

### TypeScript type

```typescript
/** The persisted settings values — shape depends on the active schema */
type StorefrontSettings = Record<string, unknown>;
```

The settings object is intentionally untyped beyond `Record<string, unknown>` because its shape is defined by the schema, which can vary per channel. The renderer maps field keys to values dynamically.

### Value types per field type

| Schema field type | Settings value type | Example                               |
| ----------------- | ------------------- | ------------------------------------- |
| `string`          | `string`            | `"www.butiken.se"`                    |
| `number`          | `number`            | `1.5`                                 |
| `boolean`         | `boolean`           | `true`                                |
| `select`          | `string`            | `"geist"`                             |
| `color`           | `string`            | `"#5cc190"`                           |
| `file`            | `string` (URL/path) | `"/uploads/logo.png"`                 |
| `radio-cards`     | `string`            | `"commerce"`                          |
| `group`           | `boolean`           | `true` (the group's own toggle state) |

### Nested keys

For grouped/nested fields, the key uses dot-notation:

```json
{
  "storefrontMode": "commerce",
  "accessRequirements": true,
  "accessRequirements.priceVisibility": true,
  "accessRequirements.orderPlacement": true,
  "accessRequirements.stockStatus": false,
  "logotype": "/uploads/logo.png",
  "cornerStyle": "square",
  "fonts.headings": "geist",
  "fonts.body": "geist"
}
```

> **Note**: Dot-notation is a flat key convention, not actual object nesting. This keeps the data structure simple and avoids deep merge issues when saving partial updates. The renderer uses a helper like `get(settings, key)` / `set(settings, key, value)` to read/write.

---

## Default Schema

This is the default Geins storefront schema, encoding the Figma designs into the schema format above.

```json
{
  "baseSettings": {
    "label": "Base settings",
    "sections": [
      {
        "key": "storefrontMode",
        "title": "Storefront mode",
        "description": "Choose if you want your storefront to enable direct purchases of your products, or work as a product catalogue",
        "fields": [
          {
            "key": "storefrontMode",
            "type": "radio-cards",
            "label": "Storefront mode",
            "default": "commerce",
            "options": [
              {
                "value": "commerce",
                "label": "Commerce",
                "description": "Enables visitors to purchase your products directly in the page. With buy buttons and checkout flow.",
                "icon": "ShoppingCart"
              },
              {
                "value": "catalogue",
                "label": "Catalogue",
                "description": "Shows all your products, but without commerce functionality such as buy buttons and checkout.",
                "icon": "BookOpenText"
              }
            ]
          }
        ]
      },
      {
        "key": "defaultSettings",
        "title": "Default settings",
        "description": "Base settings used globally unless otherwise configured.",
        "fields": [
          {
            "key": "accessRequirements",
            "type": "group",
            "label": "Access Requirements",
            "description": "Define which actions require login. These settings are global and may be overridden by roles or permissions.",
            "icon": "UserLock",
            "default": true,
            "children": [
              {
                "key": "accessRequirements.priceVisibility",
                "type": "boolean",
                "label": "Price visibility",
                "description": "Prices are visible only to logged-in users.",
                "icon": "DollarSign",
                "default": true
              },
              {
                "key": "accessRequirements.orderPlacement",
                "type": "boolean",
                "label": "Order placement",
                "description": "Orders can only be placed by logged-in users.",
                "icon": "ShoppingCart",
                "default": true
              },
              {
                "key": "accessRequirements.stockStatus",
                "type": "boolean",
                "label": "Stock status",
                "description": "Products stock levels are visible only to logged-in users.",
                "icon": "BarChart3",
                "default": false
              }
            ]
          }
        ]
      }
    ]
  },
  "layoutOptions": {
    "label": "Layout options",
    "sections": [
      {
        "key": "logotype",
        "title": "Logotype",
        "description": "Choose between rounded or square corners for interface elements.",
        "icon": "Image",
        "fields": [
          {
            "key": "logotype",
            "type": "file",
            "label": "Logotype",
            "accept": "image/*"
          }
        ]
      },
      {
        "key": "cornerStyle",
        "title": "Corner style",
        "description": "Choose between rounded or square corners for interface elements.",
        "icon": "Square",
        "fields": [
          {
            "key": "cornerStyle",
            "type": "radio-cards",
            "label": "Corner style",
            "default": "square",
            "options": [
              {
                "value": "square",
                "label": "Square",
                "description": "Gives interface elements square corners.",
                "icon": "Square"
              },
              {
                "value": "round",
                "label": "Round",
                "description": "Gives interface elements rounded corners.",
                "icon": "Circle"
              }
            ]
          }
        ]
      },
      {
        "key": "fonts",
        "title": "Font settings",
        "description": "Choose between rounded or square corners for interface elements.",
        "icon": "Type",
        "fields": [
          {
            "key": "fonts.headings",
            "type": "select",
            "label": "Headings",
            "description": "Used for selected heading elements used on pages and content",
            "placeholder": "Geist (template default)",
            "columns": 2,
            "options": [
              { "value": "geist", "label": "Geist (template default)" },
              { "value": "inter", "label": "Inter" },
              { "value": "roboto", "label": "Roboto" },
              { "value": "open-sans", "label": "Open Sans" }
            ]
          },
          {
            "key": "fonts.body",
            "type": "select",
            "label": "Body text",
            "description": "Applied to body text, descriptions, and supporting content.",
            "placeholder": "Geist (template default)",
            "columns": 2,
            "options": [
              { "value": "geist", "label": "Geist (template default)" },
              { "value": "inter", "label": "Inter" },
              { "value": "roboto", "label": "Roboto" },
              { "value": "open-sans", "label": "Open Sans" }
            ]
          }
        ]
      },
      {
        "key": "themeColors",
        "title": "Theme colors",
        "description": "Set the color palette for your storefront.",
        "icon": "Palette",
        "fields": [
          {
            "key": "themeColors.primary",
            "type": "color",
            "label": "Primary color",
            "default": "#171717"
          },
          {
            "key": "themeColors.background",
            "type": "color",
            "label": "Background color",
            "default": "#ffffff"
          },
          {
            "key": "themeColors.accent",
            "type": "color",
            "label": "Accent color",
            "default": "#5cc190"
          }
        ]
      }
    ]
  }
}
```

---

## Default Settings (initial values)

When a new channel is created or a schema is reset, the settings are populated from each field's `default` value:

```json
{
  "storefrontMode": "commerce",
  "accessRequirements": true,
  "accessRequirements.priceVisibility": true,
  "accessRequirements.orderPlacement": true,
  "accessRequirements.stockStatus": false,
  "logotype": null,
  "cornerStyle": "square",
  "fonts.headings": "geist",
  "fonts.body": "geist",
  "themeColors.primary": "#171717",
  "themeColors.background": "#ffffff",
  "themeColors.accent": "#5cc190"
}
```

---

## Renderer Behavior

### Tab generation

```
schema keys → tabs
"baseSettings"    → Tab: "Base settings"
"layoutOptions"   → Tab: "Layout options"
```

A custom schema with `{ "myTab": { label: "My Custom Tab", sections: [...] } }` would produce a single "My Custom Tab" tab.

### Field rendering mapping

| `type`        | Component               | Notes                                                                                      |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------ |
| `string`      | `<Input>`               | Standard text input, optional `placeholder` and `pattern` validation                       |
| `number`      | `<Input type="number">` | With `min`/`max` bounds                                                                    |
| `boolean`     | `<Switch>`              | With label + description                                                                   |
| `select`      | `<Select>`              | Dropdown with `options[]`                                                                  |
| `color`       | Color input             | Hex text input + swatch preview square                                                     |
| `file`        | File upload             | "Choose file" button, `accept` for MIME filter                                             |
| `radio-cards` | Card radio group        | Side-by-side cards with icon + label + description, selected state has border highlight    |
| `group`       | Bordered container      | Icon + label + description + toggle on the group header; children rendered indented inside |

### Conditional visibility

When a field has `visibleWhen`, the renderer checks the current settings value:

```json
{
  "key": "checkoutStyle",
  "type": "select",
  "label": "Checkout style",
  "visibleWhen": { "field": "storefrontMode", "equals": "commerce" }
}
```

This field only renders when `storefrontMode` is `"commerce"`. The transition should use a simple show/hide (no animation needed for v1).

### Column layout

Fields with `columns: 2` are placed side-by-side using CSS grid. The renderer collects consecutive fields with the same `columns` value into a grid row:

```
columns: 2, columns: 2  →  2-column grid row
columns: 3, columns: 3, columns: 3  →  3-column grid row
columns: 1 (or omitted)  →  full-width row
```

---

## Custom Schema Example

A user building a custom storefront might paste this schema, which produces completely different tabs and fields:

```json
{
  "hero": {
    "label": "Hero Banner",
    "sections": [
      {
        "key": "heroBanner",
        "title": "Banner configuration",
        "fields": [
          {
            "key": "hero.image",
            "type": "file",
            "label": "Banner image",
            "accept": "image/*"
          },
          {
            "key": "hero.title",
            "type": "string",
            "label": "Banner title",
            "placeholder": "Welcome to our store"
          },
          {
            "key": "hero.ctaText",
            "type": "string",
            "label": "CTA button text",
            "placeholder": "Shop now"
          },
          {
            "key": "hero.ctaUrl",
            "type": "string",
            "label": "CTA button URL",
            "placeholder": "/products"
          }
        ]
      }
    ]
  },
  "navigation": {
    "label": "Navigation",
    "sections": [
      {
        "key": "nav",
        "title": "Navigation style",
        "fields": [
          {
            "key": "nav.style",
            "type": "radio-cards",
            "label": "Menu style",
            "options": [
              {
                "value": "horizontal",
                "label": "Horizontal",
                "description": "Top navigation bar"
              },
              {
                "value": "sidebar",
                "label": "Sidebar",
                "description": "Left sidebar navigation"
              }
            ]
          },
          {
            "key": "nav.showSearch",
            "type": "boolean",
            "label": "Show search bar",
            "description": "Display a search input in the navigation",
            "default": true
          }
        ]
      }
    ]
  }
}
```

This would produce two tabs — "Hero Banner" and "Navigation" — with no overlap to the default Geins schema.

---

## API Integration (future)

When the API is ready:

- `GET /channel/{id}` returns `storefrontSchema` (or `null` for default) and `storefrontSettings`
- `PATCH /channel/{id}` accepts `storefrontSettings` (the values) and optionally `storefrontSchema` (when customized)
- The renderer loads the schema (custom if set, otherwise the bundled default), then populates the form from `storefrontSettings`
- On save, only `storefrontSettings` is sent (unless the schema was changed via the editor)

---

## Schema Editor UX

Accessed via `...` menu → "Change JSON schema":

1. Opens a `Sheet` with a monospace `<textarea>` pre-filled with the current schema JSON
2. Live JSON validation — shows error messages inline if the JSON is malformed
3. **Schema validation** (v2) — validate that the JSON matches the `StorefrontSchema` type (correct structure, valid field types, etc.)
4. "Apply" saves the schema and re-renders all tabs immediately
5. "Reset to default" replaces the custom schema with the bundled default
6. Schema is persisted to the API as part of the channel
