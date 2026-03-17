---
title: "Build schema field renderer components"
project: "Self Service (Channels)"
milestone: "M2 — Storefront Settings"
priority: 2
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-low
  - geins-studio
depends_on:
  - "./001-storefront-schema-types.md"
model: sonnet
mode: claude-code agent
---

## Context

The storefront settings renderer maps JSON schema field types to Vue form components. Each field type needs a dedicated component that accepts the `SchemaField` definition and a `modelValue`, renders the appropriate input, and emits updates. These are the building blocks that the recursive renderer (issue 004) will compose.

## Expected Outcome

A set of field components under `app/components/channel/storefront/fields/` — one per `SchemaFieldType`. Each accepts a `SchemaField` and `modelValue`, emits `update:modelValue`, and renders the correct UI using existing shadcn-vue primitives.

## Implementation Notes

**Directory: `app/components/channel/storefront/fields/`**

All components follow the same prop/emit contract:

```typescript
defineProps<{
  field: SchemaField;
  modelValue: unknown;
}>();
defineEmits<{ 'update:modelValue': [value: unknown] }>();
```

**Components to build:**

1. **`ChannelStorefrontFieldString.vue`** — `<Input>` with optional `placeholder` and `pattern` validation. Full width by default.

2. **`ChannelStorefrontFieldNumber.vue`** — `<Input type="number">` with `min`/`max` from field definition.

3. **`ChannelStorefrontFieldBoolean.vue`** — `<Switch>` toggle with label and description text. Matches the `ContentSwitch` pattern (label left, switch right).

4. **`ChannelStorefrontFieldSelect.vue`** — shadcn `<Select>` dropdown populated from `field.options`. Shows `placeholder` when no value selected.

5. **`ChannelStorefrontFieldColor.vue`** — Hex color input + square swatch preview. Use an `<Input>` with `#` prefix (via `InputGroupAddon`) and a colored `<div>` swatch that updates reactively. Validate hex format on input.

6. **`ChannelStorefrontFieldFile.vue`** — File upload input with `accept` from field definition. Shows current file name/path when a value exists. "Choose file" button + clear action. Note: actual file upload API integration is deferred — for now, emit the file name or a placeholder string.

7. **`ChannelStorefrontFieldRadioCards.vue`** — Card-style radio group. Each option renders as a clickable card with optional Lucide icon (use `<component :is="icon">` with auto-imported Lucide icons), label, and description. Selected card gets a border highlight (e.g. `border-primary`). Cards are laid out side-by-side in a flex row.

8. **`ChannelStorefrontFieldGroup.vue`** — Container with icon + label + description + `<Switch>` toggle in the header. When toggled on, renders `children` fields recursively (import and use the renderer from issue 004, or accept a slot). Has a bordered/indented visual style. The group's own `modelValue` is the boolean toggle state; children are rendered/managed by the parent renderer.

**Shared patterns:**
- All fields show `field.label` and optional `field.description` as help text
- Optional `field.icon` renders as a Lucide icon before the label
- Disabled state from `field.disabled`
- Use existing shadcn components from `app/components/ui/`

**Reference components**: `app/components/ui/input/`, `app/components/ui/select/`, `app/components/ui/switch/`, `app/components/content/ContentSwitch.vue`

## Acceptance Criteria

- All 8 field components exist in `app/components/channel/storefront/fields/`
- Each component renders the correct shadcn primitive for its field type
- `modelValue` / `update:modelValue` two-way binding works for all field types
- Radio-cards render options as side-by-side clickable cards with icon + label + description
- Color field shows live swatch preview synchronized with hex input
- Group field renders a toggle header; children rendering is delegated (slot or direct import)
- All fields display `label`, optional `description`, and optional `icon`
- `field.disabled` disables the input on all field types
- Unit test: radio-cards component emits correct value on card click
- Unit test: color field validates hex format and updates swatch
- Unit test: boolean field toggles modelValue correctly
- `pnpm typecheck` passes
- `pnpm lint:check` passes
- `pnpm test --run` passes

## Agent Execution
- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Standard component creation with clear specs — multiple files but each follows a simple pattern using existing shadcn primitives.
