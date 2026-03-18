---
title: 'Scaffold Channel edit page with tabs, sidebar, and activate/deactivate'
project: 'Self Service (Channels)'
milestone: 'M1 — Foundation'
priority: 2
estimate: 5
labels:
  - feature
  - confidence-medium
  - risk-medium
depends_on:
  - './001-channel-types.md'
  - './002-channel-api-repository.md'
model: opus
mode: claude-code interactive
---

## Context

The channel edit page is the core of the Channels feature. It must handle both create and edit modes, a five-tab layout (with tab bodies as placeholders for later milestones), a reactive sidebar summary, and a non-standard activate/deactivate flow with UX guardrails. This scaffold establishes the architectural foundation that all subsequent milestone tabs will be built on top of.

## Expected Outcome

`app/pages/store/channel/[id].vue` is a fully wired entity edit page that:
- Creates or edits a channel via `useEntityEdit`
- Shows a tab bar with five tabs (content is placeholder for M2–M6)
- Renders a reactive sidebar summary
- Handles activate/deactivate with debounce and an informational message

## Implementation Notes

Follow the entity edit page pattern documented in `CLAUDE.md` ("Entity Edit Page" section) and the edit-mode data loading boilerplate ("Edit Mode Data Loading (required boilerplate)").

### Form schema (Zod)

Fields for the channel core properties (scope of channel PATCH top-level fields):
- `displayName: z.string().min(1)`
- `name: z.string().min(1)` — admin-only, auto-generated on create, editable on edit
- `url: z.string().url()` — full URL of storefront

The `type` field (`webshop | physical | other`) should also be in the form. The sub-entity arrays (languages, markets, etc.) are managed by individual tab components in later milestones — they are NOT part of this Zod schema.

### Tab bar

Use `ContentEditTabs` with tabs: `['Storefront settings', 'General', 'Markets', 'Payments', 'Mails']`.

Tab bodies at this stage are placeholder `<div>` elements with a `<!-- TODO: MX -->` comment. The active tab is driven by `currentTab` from `useEntityEdit`.

### Sidebar summary

Use `useEntityEditSummary` pattern. Summary rows:
- **Active** — status badge + toggle switch. The toggle calls `handleActivate`/`handleDeactivate` (see below), NOT the standard entity save.
- **Display name** — `form.values.displayName`
- **Languages** — `entityData.value?.languages?.length ?? 0` count
- **Markets** — `entityData.value?.markets?.length ?? 0` count
- **Payments** — first active payment method name (or `-`)
- **Transaction mails** — `entityData.value?.mailSettings` master toggle state: "Enabled" / "Disabled"

Reactive: all values come from `entityData` / `form.values` refs.

### Activate / Deactivate

Channel activation/deactivation uses dedicated endpoints (`PUT .../activate` and `.../deactivate`), **not** the channel PATCH. This is separate from the regular save flow.

UX guardrails required by the project plan:
1. **Debounce/cooldown**: After calling activate or deactivate, disable the toggle for 3 seconds to prevent rapid toggling. Use a `ref<boolean>` (`isActivating`) that is set to `true` before the call and reset via `setTimeout` after 3 seconds.
2. **Informational toast**: Show a toast (not a blocking dialog) when activating: `"Activating a channel triggers background processing. This may take a moment."` Use `toast({ title: ..., variant: 'default' })`.
3. On error: call `showErrorToast(t('channel.activate_error'))` (or deactivate variant).
4. After success, re-fetch entity data via `refreshEntityData()`.

No confirmation dialog is required for activation (RESOLVED in project plan).

### Edit-mode data loading

Include the required boilerplate:
```ts
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<ChannelResponse>(
    entityFetchKey.value,
    () => channelApi.channel.get(entityId.value),
  );
  refreshEntityData.value = refresh;
  onMounted(async () => {
    const entity = handleFetchResult<ChannelResponse>(error.value, data.value);
    await parseAndSaveData(entity);
  });
}
```

### `parseEntityData`

Maps `ChannelResponse` → form values:
- `displayName`, `name`, `url`, `type` → form fields
- Store the full response in `entityData` for sidebar + later tab components

### `prepareCreateData` / `prepareUpdateData`

`prepareUpdateData` must only include top-level channel fields (`displayName`, `name`, `url`, `type`) — **not** sub-entity arrays (those are managed by individual tabs in M3–M6). Sub-entity fields will be added to the PATCH payload as each tab is implemented.

### i18n

Use only keys that will be added in issue 005. Reference them as `t('channel.save')`, `t('channel.name')`, etc. — document the needed keys in a comment so issue 005 picks them up.

## Acceptance Criteria

- `app/pages/store/channel/[id].vue` exists and mounts at `/store/channel/[id]`.
- Route param `new` → create mode; any other value → edit mode with data loading.
- After create, `useEntityEdit` navigates to the edit URL automatically.
- Tab bar shows five tabs; switching tabs does not lose form data.
- Sidebar summary displays live values from `entityData` and `form.values`.
- Activate/deactivate calls the correct dedicated endpoints (not PATCH).
- Toggle is disabled for 3 seconds after activation/deactivation to prevent rapid toggling.
- Informational toast is shown when activating a channel.
- `hasUnsavedChanges` indicator correctly reflects dirty form state; does not flicker during async data loading.
- No `console.log` — use `useGeinsLog`.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: tests verifying create mode mounts correctly, edit mode loads data via `useAsyncData`, and activate/deactivate call the correct repo methods.

## Agent Execution

- **Model**: opus
- **Mode**: claude-code interactive
- **Why**: Cross-file architectural setup (form, sidebar, tabs, custom activation flow) that deviates from the standard save-only entity pattern — benefits from human review before applying.
