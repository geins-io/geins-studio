---
title: "Build recursive schema section renderer"
project: "Self Service (Channels)"
milestone: "M2 — Storefront Settings"
priority: 2
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-medium
  - geins-studio
depends_on:
  - "./002-default-schema-json.md"
  - "./003-schema-field-components.md"
model: sonnet
mode: claude-code agent
---

## Context

The schema renderer is the core component that walks a tab's schema definition (sections → fields) and renders the correct field components. It handles layout concerns like column grouping, conditional field visibility, and recursive group rendering. This is the engine that makes the storefront settings UI fully dynamic.

## Expected Outcome

A `ChannelStorefrontSchemaRenderer` component that accepts a single tab's schema (sections array) and the current settings object, then renders all sections and fields with correct layout, visibility, and two-way data binding.

## Implementation Notes

**File: `app/components/channel/storefront/ChannelStorefrontSchemaRenderer.vue`**

**Props:**
```typescript
defineProps<{
  sections: SchemaSection[];
  settings: StorefrontSettings;
}>();
defineEmits<{ 'update:settings': [settings: StorefrontSettings] }>();
```

**Section rendering:**
- Each `SchemaSection` renders as a `ContentEditCard` with `title` and optional `description`
- Optional section `icon` shown in the card header
- Fields within a section are rendered in order

**Field rendering — type dispatch:**
- Map `field.type` to the matching `ChannelStorefrontField*` component from issue 003
- Pass `field` definition + current value from `settings[field.key]` via `getSettingsValue()`
- On `update:modelValue`, call `setSettingsValue()` and emit `update:settings` with new settings object

**Column layout logic:**
- Collect consecutive fields with the same `columns` value into grid rows
- `columns: 2` → `grid grid-cols-2 gap-4`
- `columns: 3` → `grid grid-cols-3 gap-4`
- `columns: 1` or omitted → full width (no grid wrapper)
- Implementation: iterate fields, group adjacent same-column fields, wrap each group in a grid div

**Conditional visibility:**
- When `field.visibleWhen` is set, check `getSettingsValue(settings, field.visibleWhen.field) === field.visibleWhen.equals`
- If condition is false, do not render the field (simple `v-if`, no animation needed for v1)
- Hidden fields retain their values in settings (don't clear on hide)

**Group recursion:**
- A `group` field renders `ChannelStorefrontFieldGroup` for the header/toggle
- When the group toggle is on, render `field.children` using the same field rendering logic (recursive)
- Children are indented within the group's bordered container
- Group toggle value is stored at `field.key` in settings; children have their own independent keys

**Value flow:**
- Use `getSettingsValue` / `setSettingsValue` from `app/utils/storefront-settings.ts` (issue 002)
- Settings updates are immutable — emit new object each time
- Parent component owns the settings state; renderer is purely presentational + emits

**Reference**: `/plans/self-service/storefront-settings-schema-spec.md` (Renderer Behavior section)

## Acceptance Criteria

- Component renders all sections from a schema tab as `ContentEditCard` blocks
- Correct field component is rendered for each `SchemaFieldType`
- Two-way binding: changing a field value emits `update:settings` with the correct key updated
- Column layout: fields with `columns: 2` render side-by-side in a 2-column grid
- Column layout: fields with `columns: 3` render in a 3-column grid
- Conditional visibility: fields with `visibleWhen` hide/show based on another field's value
- Group fields: toggle shows/hides children, both group and children values stored independently
- Rendering the default schema produces the expected Base settings and Layout options UI
- Unit test: column grouping logic correctly batches consecutive same-column fields
- Unit test: conditional visibility hides field when condition is not met
- Unit test: group toggle hides children when off, shows when on
- `pnpm typecheck` passes
- `pnpm lint:check` passes
- `pnpm test --run` passes

## Agent Execution
- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Moderate complexity — recursive rendering, layout logic, and conditional visibility, but the spec is well-defined and patterns are clear.
