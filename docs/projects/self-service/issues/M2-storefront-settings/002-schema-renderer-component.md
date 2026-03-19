---
title: 'Build StorefrontSchemaRenderer — recursive schema-driven form component'
project: 'Self Service (Channels)'
milestone: 'M2 — Storefront Settings'
priority: 2
estimate: 5
labels:
  - feature
  - confidence-medium
  - risk-medium
depends_on:
  - './001-storefront-schema-types-and-default-schema.md'
model: opus
mode: claude-code interactive
---

## Context

The heart of the Storefront settings tab is a recursive Vue component that walks a tab's schema and renders the appropriate form control for each field type. This component must handle 8 field types (including recursive `group`), conditional visibility, and a multi-column layout system — all driven purely by the schema data structure. It uses `modelValue` / `update:modelValue` for two-way binding with the flat `StorefrontSettings` object.

Full field rendering spec is in `docs/projects/self-service/storefront-settings-schema-spec.md` (Renderer Behavior section).

## Expected Outcome

`app/components/channel/StorefrontSchemaRenderer.vue` renders any tab's schema as a form. Changing any field emits an `update:modelValue` event with the updated `StorefrontSettings` slice. Groups render recursively. `visibleWhen` fields show/hide reactively. Adjacent `columns: 2`/`columns: 3` fields flow into CSS grid rows.

## Implementation Notes

### Props and emits

```ts
const props = defineProps<{
  schema: SchemaTab        // one tab's schema (sections + fields)
  modelValue: StorefrontSettings
}>()
const emit = defineEmits<{ 'update:modelValue': [value: StorefrontSettings] }>()
```

### Settings access helpers

Use two internal helpers (can live in `app/utils/storefront.ts`):
- `getSettingValue(settings, key)` — reads a dot-notation key from the flat settings object
- `setSettingValue(settings, key, value): StorefrontSettings` — returns a new settings object with the key updated (immutable update)

These replace any deep-merge approach. The spec is explicit: dot-notation keys are flat, not nested.

### Field type → component mapping

| Type | Render |
|------|--------|
| `string` | shadcn `Input` |
| `number` | shadcn `Input type="number"` with `min`/`max` |
| `boolean` | shadcn `Switch` (with label + description alongside) |
| `select` | shadcn `Select` with `options` |
| `color` | New `SchemaFieldColor` sub-component — hex `Input` + 20×20px swatch div with CSS `background-color` |
| `file` | shadcn `Input type="file"` with `accept` prop; displays current value (URL) as filename below |
| `radio-cards` | New `SchemaFieldRadioCards` sub-component — side-by-side clickable cards with Lucide icon + label + description; selected card gets `ring-2 ring-primary` |
| `group` | Bordered `ContentEditCard`-style container: header row with Lucide icon + label + description + `Switch` toggle; children rendered indented below when toggle is `true` |

Build `SchemaFieldColor` and `SchemaFieldRadioCards` as separate files in `app/components/channel/` for testability.

### Section layout

Each `SchemaSection` renders as a `ContentEditCard` with the section title and optional description.

### Column layout

Within a section, collect consecutive fields with the same `columns` value (2 or 3) into a `<div class="grid grid-cols-{n} gap-4">`. Fields without `columns` (or `columns: 1`) render full-width. Process the `fields` array into "layout groups" before rendering.

### Conditional visibility

For each field, check `visibleWhen`: if set, read `getSettingValue(modelValue, visibleWhen.field)` and compare with `visibleWhen.equals`. Hide (use `v-if`, not `v-show`) when the condition is false. No transition needed for v1.

### Group fields

A `group` field has a boolean key for the toggle and a `children` array. The group's own `Switch` reads/writes `getSettingValue(modelValue, field.key)`. Children are rendered only when the toggle is `true`. Each child field follows all the same rendering rules (type, visibleWhen, etc.) — recursion is achieved by calling the same field-rendering logic on children.

### Label + description pattern

Wrap each field in a consistent label+description container (matching the `FormField` pattern in the codebase). Use a `<label>` element linked to the input via `id`/`for`.

## Acceptance Criteria

- All 8 field types render their correct shadcn/custom component.
- Changing any field value emits `update:modelValue` with only that key updated (all other keys preserved).
- `visibleWhen` fields are absent from the DOM when the condition is false; they appear when the condition becomes true.
- `columns: 2` fields render in a 2-column CSS grid; `columns: 3` in a 3-column grid; fields without `columns` are full-width.
- `group` toggle renders children when `true`, hides them when `false`.
- Rendering the default schema (2 tabs × their sections) produces no Vue warnings.
- `SchemaFieldColor` displays a hex input and a color swatch; changing the input updates the modelValue.
- `SchemaFieldRadioCards` shows all options as cards; clicking one updates the modelValue and applies `ring-2 ring-primary` to the selected card.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: unit tests for `getSettingValue` and `setSettingValue` helpers; component tests for `SchemaFieldRadioCards` selection and `group` toggle show/hide behavior.

## Agent Execution

- **Model**: opus
- **Mode**: claude-code interactive
- **Why**: Complex recursive Vue component with 8 field type branches, a custom column layout algorithm, and conditional visibility logic — architectural decisions benefit from human review before applying.
