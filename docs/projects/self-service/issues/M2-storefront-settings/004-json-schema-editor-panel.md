---
title: 'Build JSON schema editor panel (Sheet with validation and apply/reset)'
project: 'Self Service (Channels)'
milestone: 'M2 — Storefront Settings'
priority: 2
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-medium
depends_on:
  - './001-storefront-schema-types-and-default-schema.md'
model: sonnet
mode: claude-code agent
---

## Context

Advanced users and custom storefront builders need to replace the default Geins schema with their own JSON to get a completely different Storefront settings UI. This editor panel, accessed via the `...` menu, provides a Sheet with a JSON editor, live validation, and apply/reset actions.

## Expected Outcome

`app/components/channel/ChannelSchemaEditorSheet.vue` is a Sheet panel that:
- Opens pre-filled with the current schema JSON (pretty-printed)
- Validates JSON syntax live as the user types, showing inline errors
- "Apply" updates the schema and closes the sheet
- "Reset to default" restores the bundled Geins default schema
- Includes syntax highlighting via a lightweight library

## Implementation Notes

### Props and emits

```ts
const props = defineProps<{
  open: boolean
  schema: StorefrontSchema   // current schema (may be custom or default)
}>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'apply': [schema: StorefrontSchema]  // validated, parsed schema
  'reset': []                           // parent reloads default schema
}>()
```

### Editor approach

Use a `<textarea>` with monospace styling as the base. For syntax highlighting, install `vue-codemirror` (CodeMirror 6) with the JSON language extension:

```bash
pnpm add @codemirror/lang-json @codemirror/view @codemirror/state codemirror
```

Wrap in a `<Codemirror>` component configured with `json()` language and the `basicSetup`. The CodeMirror instance should be set to the current schema JSON (pretty-printed with 2-space indentation) when the sheet opens.

If adding CodeMirror creates significant bundle size concerns, fall back to a plain `<textarea class="font-mono text-sm">` — the core validation and apply/reset functionality is more important than syntax highlighting for v1.

### Live JSON validation

Use a `computed` that attempts `JSON.parse(editorContent)` and catches syntax errors. Show the error message in a `<p class="text-destructive text-sm">` below the editor. The "Apply" button is disabled when `hasJsonError` is true.

### Schema structure validation

After JSON.parse succeeds, validate the parsed object matches `StorefrontSchema` shape (top-level keys each have `label: string` and `sections: array`). Show a warning (non-blocking, `text-warning`) if the structure looks wrong, but do not block Apply.

### Apply action

1. Parse the editor content
2. Cast to `StorefrontSchema`
3. Emit `apply(parsedSchema)`
4. Close the sheet (emit `update:open(false)`)

### Reset to default

Emit `reset` — the parent handles replacing the schema with the default. The sheet does NOT close automatically on reset; the editor content updates to reflect the default.

### i18n

Add to `en.json` and `sv.json` under `channel` namespace:
- `channel.schema_editor_title` — "JSON Schema Editor"
- `channel.schema_editor_description` — "Paste or edit the JSON schema that defines the Storefront settings tabs and fields."
- `channel.schema_apply` — "Apply"
- `channel.schema_reset_to_default` — "Reset to default"
- `channel.schema_json_error` — "Invalid JSON: {message}"
- `channel.schema_structure_warning` — "Schema may not follow the expected structure. Check that each top-level key has a label and sections array."

## Acceptance Criteria

- Sheet opens pre-filled with the current schema as pretty-printed JSON.
- Typing invalid JSON shows an inline error and disables "Apply".
- Typing valid JSON clears the error and enables "Apply".
- "Apply" emits `apply` with the parsed `StorefrontSchema` and closes the sheet.
- "Reset to default" emits `reset` and updates the editor content to the default schema JSON without closing the sheet.
- The editor has monospace styling; syntax highlighting is present if CodeMirror is installed, or gracefully absent if not.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: tests for the JSON validation logic (valid JSON enables Apply, invalid disables it, malformed schema shows structure warning).

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Standard Sheet pattern with a third-party editor library and JSON validation — well-scoped, no architectural ambiguity. Risk-medium only due to the CodeMirror dependency.
