---
title: "Build storefront settings tab container and integrate into channel edit page"
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
  - "./004-schema-renderer.md"
  - "../M1-foundation/005-channel-edit-page-scaffold.md"
model: sonnet
mode: claude-code agent
---

## Context

The storefront settings tab on the channel edit page needs a container component that reads the full schema, generates dynamic sub-tabs from its top-level keys, and renders the schema renderer for each sub-tab. This is the integration point between the schema system and the channel edit page. The default schema produces "Base settings" and "Layout options" sub-tabs; a custom schema produces entirely different sub-tabs.

## Expected Outcome

A `ChannelStorefrontSettings` component wired into the channel edit page's "Storefront settings" tab. The storefront settings data flows through `useEntityEdit` like any other channel field, with unsaved changes detection working correctly.

## Implementation Notes

**File: `app/components/channel/storefront/ChannelStorefrontSettings.vue`**

**Props:**
```typescript
defineProps<{
  schema: StorefrontSchema;
  settings: StorefrontSettings;
}>();
defineEmits<{ 'update:settings': [settings: StorefrontSettings] }>();
```

**Sub-tab generation:**
- Iterate `Object.entries(schema)` — each key becomes a sub-tab
- Tab label from `tab.label`, optional icon from `tab.icon`
- Use shadcn `Tabs` component for sub-tab navigation (not `ContentEditTabs` — these are inner tabs within the Storefront settings card, not page-level tabs)
- First tab is active by default

**Each sub-tab renders:**
- `ChannelStorefrontSchemaRenderer` with `sections: tab.sections` and the shared `settings` object
- Settings updates bubble up via `update:settings` emit

**Card wrapper:**
- Wrap in a `ContentEditCard` with title "Storefront settings"
- `#header-action` slot contains:
  - "Preview" button (deferred — see issue 007)
  - `...` dropdown menu with "Change JSON schema" action (triggers event for issue 006's sheet)

**Integration into `app/pages/store/channel/[id].vue`:**

- Replace the placeholder content in the "Storefront settings" tab with `<ChannelStorefrontSettings>`
- Schema source: `entityData.storefrontSchema ?? getDefaultSchema()` (fall back to default)
- Settings source: a dedicated `storefrontSettings` ref initialized from `entityData.storefrontSettings ?? extractDefaultSettings(schema)` in `parseEntityData`
- On `update:settings`, update `entityDataUpdate.storefrontSettings` (so unsaved changes are tracked)
- Add a watcher to sync `storefrontSettings` ref → `entityDataUpdate.storefrontSettings` (same pattern as quotation's discount/settings refs)
- In `prepareUpdateData`, include `storefrontSettings` in the PATCH payload

**i18n keys** (add to both `en.json` and `sv.json`):
- `channels.storefront_settings` — "Storefront settings"
- `channels.change_json_schema` — "Change JSON schema"
- `channels.preview` — "Preview"

## Acceptance Criteria

- `ChannelStorefrontSettings` renders dynamic sub-tabs from any `StorefrontSchema`
- Default schema produces "Base settings" and "Layout options" sub-tabs
- Custom schema with different keys produces correspondingly different sub-tabs
- Settings changes in any sub-tab emit `update:settings` with the full updated settings object
- Component is integrated into the channel edit page's "Storefront settings" tab
- Settings are loaded from `entityData` in edit mode, defaults in create mode
- Unsaved changes detection works: modifying a storefront setting enables the save button
- Save includes `storefrontSettings` in the PATCH payload
- Card header has a `...` menu with "Change JSON schema" entry (handler wired in issue 006)
- i18n keys added to both locale files
- Unit test: sub-tabs are generated from schema top-level keys
- Unit test: changing a setting updates the emitted settings object correctly
- `pnpm typecheck` passes
- `pnpm lint:check` passes
- `pnpm test --run` passes

## Agent Execution
- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Integration work connecting the renderer to the entity edit lifecycle — moderate complexity with clear patterns from existing edit pages.
