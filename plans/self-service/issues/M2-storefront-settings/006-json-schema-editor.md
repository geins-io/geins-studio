---
title: "Build JSON schema editor panel"
project: "Self Service (Channels)"
milestone: "M2 — Storefront Settings"
priority: 3
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-low
  - geins-studio
depends_on:
  - "./005-storefront-tab-container.md"
model: sonnet
mode: claude-code agent
---

## Context

Users building custom storefronts need to replace the default schema with their own JSON to get a completely different settings UI. The schema editor is accessed from the `...` menu on the Storefront settings card and opens a side `Sheet` with a JSON editor, validation, and apply/reset actions.

## Expected Outcome

A `ChannelStorefrontSchemaEditor` sheet component that allows editing the raw JSON schema, validates it, and applies changes that immediately re-render the storefront settings tabs.

## Implementation Notes

**File: `app/components/channel/storefront/ChannelStorefrontSchemaEditor.vue`**

**Props/emits:**
```typescript
const open = defineModel<boolean>('open');
defineProps<{
  currentSchema: StorefrontSchema;
}>();
defineEmits<{
  apply: [schema: StorefrontSchema];
  reset: [];
}>();
```

**Sheet layout:**
- shadcn `Sheet` (side: `right`, width: ~600px via class)
- Title: "JSON schema" (or i18n key `channels.json_schema`)
- Description text explaining the purpose

**Editor area:**
- `<textarea>` with monospace font (`font-mono`), full height, scrollable
- Pre-filled with `JSON.stringify(currentSchema, null, 2)` when opened
- Sufficient size for comfortable editing (~20+ rows)

**Validation:**
- On input (debounced ~300ms), attempt `JSON.parse()` on the textarea content
- If invalid JSON: show inline error message below textarea (red text with error description)
- If valid JSON: clear error, optionally show a green checkmark or "Valid JSON" indicator
- **Structural validation** (basic): check that parsed object has at least one key, and each value has a `label` and `sections` array. Show a warning (not blocking) if structure doesn't match `StorefrontSchema` shape.

**Actions (footer):**
- "Apply" button — parses JSON, validates, emits `apply` with the parsed `StorefrontSchema`. Disabled when JSON is invalid.
- "Reset to default" button (secondary/outline variant) — emits `reset`. The parent resets to `getDefaultSchema()` and closes the sheet.
- "Cancel" button — closes without changes

**Parent integration (`ChannelStorefrontSettings.vue`):**
- The `...` menu "Change JSON schema" action sets `schemaEditorOpen = true`
- On `apply`: update the active schema ref + update `entityDataUpdate.storefrontSchema` + re-extract default settings for any new fields
- On `reset`: set schema to `getDefaultSchema()`, clear `entityDataUpdate.storefrontSchema` (null = use default), regenerate settings defaults for fields that don't have existing values

**i18n keys:**
- `channels.json_schema` — "JSON schema"
- `channels.json_schema_description` — "Customize the storefront settings structure by editing the JSON schema."
- `channels.apply_schema` — "Apply"
- `channels.reset_to_default` — "Reset to default"
- `channels.invalid_json` — "Invalid JSON"
- `channels.valid_json` — "Valid JSON"

## Acceptance Criteria

- Sheet opens from the `...` menu on the Storefront settings card
- Textarea is pre-filled with the current schema as formatted JSON
- JSON parse errors show inline with a descriptive error message
- Valid JSON shows a positive indicator
- "Apply" is disabled when JSON is invalid
- "Apply" emits the parsed schema and closes the sheet
- "Reset to default" emits reset event, parent restores default schema
- After applying a custom schema, the storefront settings tabs re-render with the new structure
- After reset, tabs show the default "Base settings" and "Layout options"
- Existing settings values are preserved when switching schemas (only new fields get defaults)
- i18n keys added to both locale files
- Unit test: JSON validation detects malformed JSON and shows error
- Unit test: Apply button is disabled when JSON is invalid, enabled when valid
- Unit test: Reset emits the correct event
- `pnpm typecheck` passes
- `pnpm lint:check` passes
- `pnpm test --run` passes

## Agent Execution
- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Standard component with clear UX requirements — JSON parsing, validation, and sheet interaction are straightforward patterns.
