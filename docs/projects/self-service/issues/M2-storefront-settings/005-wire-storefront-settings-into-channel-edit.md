---
title: 'Integrate storefront settings tab into channel edit page'
project: 'Self Service (Channels)'
milestone: 'M2 — Storefront Settings'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - './003-storefront-tab-container.md'
  - './004-json-schema-editor-panel.md'
  - '../M1-foundation/004-channel-edit-page-scaffold.md'
model: sonnet
mode: claude-code agent
---

## Context

With the schema renderer, tab container, and editor panel all built, the final step is connecting everything to the channel `[id].vue` edit page. This issue replaces the `<!-- TODO: M2 -->` placeholder in the Storefront settings tab with the real components, wires `storefrontSchema` and `storefrontSettings` from the API response, and ensures the values are included in the PATCH payload on save.

## Expected Outcome

The Storefront settings tab in the channel edit page is fully functional end-to-end:
- In edit mode, schema and settings are loaded from the `ChannelResponse`
- Changes in the renderer are tracked by `useEntityEdit` (`hasUnsavedChanges`)
- On save, `prepareUpdateData` includes `storefrontSchema` (when changed) and `storefrontSettings`
- The schema editor sheet opens from the tab container's `open-schema-editor` emit

## Implementation Notes

### State refs

In `app/pages/store/channel/[id].vue`, add two refs alongside other display-only data:

```ts
const activeSchema = ref<StorefrontSchema>(defaultStorefrontSchema)
const storefrontSettings = ref<StorefrontSettings>({})
```

`defaultStorefrontSchema` is the JSON imported from `app/assets/schemas/storefront-settings-default.json`.

### `parseEntityData`

When populating from the API response:
```ts
activeSchema.value = entity.storefrontSchema ?? defaultStorefrontSchema
storefrontSettings.value = entity.storefrontSettings ?? getDefaultSettings(activeSchema.value)
```

### `onFormValuesChange` / watchers

`storefrontSettings` is not a form field — add a dedicated `watch(storefrontSettings, ...)` that syncs the value into `entityDataUpdate`:
```ts
watch(storefrontSettings, (val) => {
  entityDataUpdate.value.storefrontSettings = val
}, { deep: true })
```

Similarly for `activeSchema` (only sync when it changes from the editor panel apply action).

### `prepareUpdateData`

Include in the PATCH payload:
- `storefrontSettings: storefrontSettings.value` — always
- `storefrontSchema: activeSchema.value` — only when the user changed it via the schema editor (track with a `schemaChanged` ref)

### Schema editor integration

In the Storefront settings tab body:
```html
<ChannelStorefrontSettings
  :schema="activeSchema"
  v-model="storefrontSettings"
  @open-schema-editor="schemaEditorOpen = true"
/>
<ChannelSchemaEditorSheet
  v-model:open="schemaEditorOpen"
  :schema="activeSchema"
  @apply="handleSchemaApply"
  @reset="handleSchemaReset"
/>
```

`handleSchemaApply(schema)` — sets `activeSchema.value = schema`, marks `schemaChanged = true`.
`handleSchemaReset()` — sets `activeSchema.value = defaultStorefrontSchema`, regenerates default settings, marks `schemaChanged = true`.

### Unsaved changes snapshot

`storefrontSettings` is mutated by the renderer on every field change. To avoid snapshot staleness (see `CLAUDE.md` "Unsaved changes snapshot timing"), call `parseAndSaveData(entity, false)` in the edit-mode `onMounted` and call `setOriginalSavedData()` after `storefrontSettings` is initialized. Follow the same pattern as `quotation/[id].vue`.

### i18n

No new keys needed — keys were added in issue 003.

## Acceptance Criteria

- In edit mode, the Storefront settings tab renders with schema and settings loaded from the API response.
- In create mode, the default schema and default settings are used.
- Changing any storefront setting enables the "Save" button (`hasUnsavedChanges` is `true`).
- Saving via `updateEntity` includes `storefrontSettings` in the PATCH body.
- After the schema editor applies a custom schema, `storefrontSchema` is included in the next PATCH.
- Resetting to default schema regenerates settings from defaults and re-renders the tabs.
- `hasUnsavedChanges` does not flicker during async data loading.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: tests for `handleSchemaApply`, `handleSchemaReset`, and that `storefrontSettings` watcher syncs into `entityDataUpdate`.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Wiring work — straightforward integration of already-built components following established entity edit page patterns.
