---
title: 'Validate and fix unsaved changes tracking across all channel tabs'
project: 'Self Service (Channels)'
milestone: 'M7 — Polish & Integration'
priority: 2
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-medium
  - geins-studio
depends_on:
  - '../M1-foundation/004-channel-edit-page-scaffold.md'
  - '../M2-storefront-settings/005-wire-storefront-settings-into-channel-edit.md'
  - '../M3-general-tab/005-additional-languages-management.md'
  - '../M4-markets-tab/004-additional-markets-table.md'
  - '../M5-payments-tab/003-payments-tab-card.md'
  - '../M6-mails-tab/007-mail-preview-sheet-tab.md'
model: sonnet
mode: claude-code interactive
---

## Context

The channel edit page is unusually complex: it spans five tabs whose data comes from a single `useEntityEdit` form plus several standalone `ref`s managed outside VeeValidate (storefront settings values, market assignments, payment toggles, mail settings). `onFormValuesChange` must capture ALL of these into `entityDataUpdate` to correctly drive `hasUnsavedChanges`.

Without a dedicated verification pass, edge cases go undetected: a field that saves correctly when triggered by another change but never enables the save button on its own; a ref that's not watched; a tab that clears form values on unmount and corrupts the snapshot. The `CLAUDE.md` documents several of these failure modes explicitly.

This issue: verify the end-to-end unsaved-changes behaviour for every editable field and sub-entity array in the channel edit page, and fix any gaps found.

## Expected Outcome

- Changing any field in any tab enables the save button (`hasUnsavedChanges = true`).
- Saving resets `hasUnsavedChanges` to `false`.
- Switching tabs never loses data or produces a false-positive unsaved-changes state.
- The leave-confirmation guard fires when navigating away with unsaved changes.
- No stale `hasUnsavedChanges` during async data loading (suppressed correctly by `useUnsavedChanges` while `originalData` is empty).
- All standalone refs (market assignments, payment active states, storefront settings, mail settings) are synced into `entityDataUpdate` via dedicated watchers.

## Implementation Notes

### Known failure modes (from CLAUDE.md)

1. **`onFormValuesChange` completeness**: Every update-relevant field must be mapped into `entityDataUpdate`. Fields that are in `prepareUpdateData` but not in `onFormValuesChange` will save on trigger from other changes but won't enable the save button on their own.

2. **Non-form refs that affect `entityDataUpdate`**: Standalone `ref`s (market assignments, payment toggles, storefront settings map, mail general/layout settings) must have dedicated `watch()` calls — `onFormValuesChange` only fires on form value changes.

3. **VeeValidate clears values on field unmount**: If a tab conditionally renders form fields (e.g. a section hidden behind a toggle), switching away unmounts those fields and clears their values. `onFormValuesChange` debounce then fires with empty values, overwriting `entityDataUpdate`. Add a mode guard at the top of the edit-mode branch.

4. **Snapshot timing**: If `parseEntityData` triggers side effects that mutate `entityDataUpdate` (via `form.setValues()` → `onFormValuesChange`, watchers, or async fetches), call `parseAndSaveData(entity, false)` and then `await nextTick(); setOriginalSavedData()` to capture the settled state. Same applies to save handlers via `updateEntity`.

### Verification checklist (per tab)

**General tab**:
- `displayName`, `name`, `url`, `type` → form fields → covered by `onFormValuesChange`
- Language array (default + additional) → standalone ref → needs `watch()`

**Storefront settings tab**:
- Settings values map → standalone ref (schema-driven, outside VeeValidate) → needs `watch()`
- Schema JSON → standalone ref → needs `watch()`

**Markets tab**:
- Market assignments array (order = default) → standalone ref → needs `watch()`
- Per-market `active` toggle → part of the same ref → covered by the same watcher

**Payments tab**:
- Per-payment `active` toggle → standalone ref (`Map<id, boolean>`) → needs `watch()`

**Mails tab** (general/layout sub-tabs only — text overrides have their own dedicated PATCH):
- Mail general settings (displayName, fromEmail, etc.) → form fields or standalone ref
- Mail layout settings (colors, fonts) → standalone ref → needs `watch()`
- Master `Disabled` toggle → standalone ref → needs `watch()`

### Testing approach

Write integration tests that:
1. Mount the channel edit page with a fixture `ChannelResponse`.
2. Simulate changes to fields in each tab.
3. Assert `hasUnsavedChanges.value === true` after each change.
4. Simulate save → assert `hasUnsavedChanges.value === false`.
5. Simulate tab switch → assert no data loss and no spurious `hasUnsavedChanges`.

## Acceptance Criteria

- Changing `displayName` in General tab sets `hasUnsavedChanges = true`.
- Changing storefront settings values sets `hasUnsavedChanges = true`.
- Adding or removing a language sets `hasUnsavedChanges = true`.
- Reordering markets (changing default) sets `hasUnsavedChanges = true`.
- Toggling a payment method active state sets `hasUnsavedChanges = true`.
- Changing a mail general settings field sets `hasUnsavedChanges = true`.
- Switching from General tab to Storefront tab and back does not reset `hasUnsavedChanges` or clear any form values.
- Saving from any tab resets `hasUnsavedChanges = false`.
- Leave-confirmation dialog fires when navigating away with pending changes.
- Loading data (edit mode mount) does not trigger a false-positive `hasUnsavedChanges`.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: one test per tab verifying that a representative field change sets `hasUnsavedChanges`; test for no stale state after data loading; test for correct snapshot reset after save.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code interactive
- **Why**: Cross-cutting verification that touches the central `onFormValuesChange` + snapshot logic of the channel edit page — risk-medium due to potential for subtle state bugs; human review before applying reduces regression risk.
