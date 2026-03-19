---
title: 'Build ChannelStorefrontSettings tab container with dynamic sub-tabs'
project: 'Self Service (Channels)'
milestone: 'M2 — Storefront Settings'
priority: 2
estimate: 3
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - './002-schema-renderer-component.md'
model: sonnet
mode: claude-code agent
---

## Context

The Storefront settings tab on the channel edit page is not a single flat form — it has dynamic sub-tabs driven by the schema's top-level keys. This container component owns the active schema, generates sub-tabs from it, renders one `StorefrontSchemaRenderer` per sub-tab, and exposes the `...` menu actions (schema editor trigger, future preview). It is the parent that the channel `[id].vue` page will embed.

## Expected Outcome

`app/components/channel/ChannelStorefrontSettings.vue` renders a card with:
- Dynamic sub-tab bar generated from `Object.keys(schema)` — each tab's label comes from `schema[key].label`
- Active sub-tab body rendered by `StorefrontSchemaRenderer` with the matching schema tab and current settings slice
- Card header with a "Preview" placeholder button (disabled, tooltip: "Coming soon") and a `...` `DropdownMenu` with "Change JSON schema" action
- Two-way binding: settings changes from the renderer propagate up via `update:modelValue`

## Implementation Notes

### Props and emits

```ts
const props = defineProps<{
  schema: StorefrontSchema         // active schema (custom or default)
  modelValue: StorefrontSettings   // current settings values
}>()
const emit = defineEmits<{
  'update:modelValue': [value: StorefrontSettings]
  'open-schema-editor': []         // parent opens the editor sheet
}>()
```

The component does not own the schema editor — it only emits `open-schema-editor` when the menu item is clicked. The schema editor sheet (issue 004) lives in the channel `[id].vue` page.

### Sub-tab bar

Use shadcn `Tabs` component. Generate `TabsTrigger` elements from `Object.keys(props.schema)` — the trigger label is `schema[key].label`. Active tab state is local (`ref` initialized to first key).

### Passing settings to the renderer

Pass only the current settings through to `StorefrontSchemaRenderer` — it accepts `StorefrontSettings` and merges internally. Do not split settings by tab key — the flat key namespace means all keys are shared across tabs (a field in tab A could reference a field in tab B via `visibleWhen`).

### Card header

Use `ContentEditCard`'s `#header-action` slot for the header buttons:
- "Preview" button — `Button variant="outline"` with `Eye` icon, `disabled` with `Tooltip` showing "Coming soon"
- `...` `DropdownMenu` with a single item: "Change JSON schema" (with `Braces` icon)

### Schema loading fallback

If `schema` is empty or parsing fails, fall back to the default schema imported from `app/assets/schemas/storefront-settings-default.json`. Log the fallback via `useGeinsLog`.

### i18n

Add keys to `en.json` and `sv.json` under the `channel` namespace:
- `channel.storefront_settings` — "Storefront settings"
- `channel.change_schema` — "Change JSON schema"
- `channel.preview_storefront` — "Preview"
- `channel.preview_storefront_coming_soon` — "Coming soon"

## Acceptance Criteria

- Sub-tabs are generated dynamically from schema keys; the default schema produces exactly two tabs ("Base settings", "Layout options").
- Switching sub-tabs does not reset settings values.
- Changing a field in the renderer emits `update:modelValue` with the full updated settings object.
- "Change JSON schema" menu item emits `open-schema-editor`.
- "Preview" button is visible but disabled with a tooltip.
- Fallback to default schema is used when `schema` prop is empty; a log message is emitted.
- Rendering with an entirely custom schema (e.g. the `hero`/`navigation` example from the spec) produces sub-tabs matching the custom schema's keys.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: tests for dynamic tab generation from schema keys, settings passthrough, and `open-schema-editor` emit on menu click.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Straightforward container component with dynamic tab generation and clear prop/emit boundaries — well-specified and low-risk.
