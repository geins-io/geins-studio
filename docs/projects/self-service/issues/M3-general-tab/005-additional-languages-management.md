---
title: 'Implement additional languages table with add and edit dialogs'
project: 'Self Service (Channels)'
milestone: 'M3 — General Tab'
priority: 2
estimate: 3
labels:
  - feature
  - confidence-medium
  - risk-low
depends_on:
  - './003-form-input-tags-search-scoped-slots.md'
  - './004-default-language-section.md'
model: sonnet
mode: claude-code agent
---

## Context

Below the default language section in the Languages card, all additional (non-default) languages assigned to the channel are shown in a minimal table. Users can add new languages from the full system list, or toggle an existing language's active state. All changes are accumulated locally and saved via the standard channel PATCH when the user hits Save.

## Expected Outcome

The additional languages section within the `ContentEditCard` "Languages" card shows:
1. A minimal table of non-default assigned languages with columns: Language (flag + name), Status (badge), Edit action.
2. A `+ Add` button in the section header that opens an Add dialog.
3. An Edit (pencil icon) row action that opens an Edit sheet to toggle the language's active state.

All adds/edits update `entityDataUpdate.languages` (and the local `languages` ref from issue 004) immediately; save is deferred to the channel PATCH.

## Implementation Notes

### Table

- Use `TableMode.Minimal` (no pagination, no sorting, no borders).
- Define a new column type `'language'` in `useColumns` OR render manually via `extendColumns`. The "language" cell displays `countryCodeToFlagEmoji(code) + ' ' + language.name`. If adding a new column type is non-trivial, use `extendColumns` with a custom `h()` render function instead (see Table Patterns in `CLAUDE.md`).
- Status column: a `Badge` with variant `positive` for active, `secondary` for inactive. Use `useColumns` `columnTypes` or a custom cell.
- Edit column: `TableCellActions` with only the `edit` action (`availableActions: ['edit']`), triggering the Edit sheet.
- The table data is the `languages` ref (from issue 004) filtered to exclude index 0 (the default language).

### Add language dialog

- `Dialog` triggered by `+ Add` button (Lucide `Plus` icon).
- Contains `FormInputTagsSearch` with the `#item` and `#tag` scoped slots (from issue 003) to render flag emojis:
  - `#item="{ item }"`: `{{ countryCodeToFlagEmoji(item.countryCode) }} {{ item.name }}`
  - `#tag="{ item }"`: same pattern
- `dataSet`: all system languages from `globalApi.language.list()` (shared ref fetched in issue 004's parent component), filtered to exclude already-assigned language IDs.
- `disableTeleport` must be `true` (inside a Dialog).
- On confirm: append selected language IDs to `entityDataUpdate.languages` as `{ _id, name, active: true }` objects (using data from the system languages list). Update the shared `languages` ref accordingly.
- After adding, close the dialog and reset the selection.

### Edit language sheet

- `Sheet` (side panel) triggered by the Edit row action.
- Shows the language name (with flag), a `Switch` to toggle `active`, and Cancel / Save buttons.
- On save: update the matching entry in `entityDataUpdate.languages` and the local `languages` ref.
- On cancel: close without changes.

### Language data shape

The `languages` array entries in `entityDataUpdate` follow the shape inferred from `ChannelResponse.languages` — likely `{ _id: string, name: string, active: boolean }`. Align with the type defined in M1/001.

### Edge cases

- A language cannot be removed from the list from this panel (only deactivated via the Edit sheet). Removal is not in scope for M3.
- The default language (index 0) must never appear in this additional languages table.
- If `languages` is empty after filtering out index 0, show a standard empty state message.

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.additional_languages`
- `channel.add_language`
- `channel.edit_language`
- `channel.language_active`
- `channel.language_inactive` (or reuse global active/inactive keys if they exist)

## Acceptance Criteria

- Additional languages table renders all assigned languages except the default (index 0).
- Table uses `TableMode.Minimal`; no pagination, sorting, or outer border.
- Each row shows: flag + language name, active/inactive badge, Edit action.
- `+ Add` button opens a dialog with `FormInputTagsSearch`; dropdown items and tags show flag emojis via scoped slots.
- The "Add" dialog filters out already-assigned languages from the options list.
- Confirming the Add dialog appends selected languages (active: true) to `entityDataUpdate.languages`; table updates immediately.
- Edit sheet opens for a row; toggling the Switch and saving updates `active` on that language in `entityDataUpdate.languages` and closes the sheet.
- `hasUnsavedChanges` is true after any add or edit; false on initial load and after save.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that adding a language appends it to the array; test that editing a language toggles active; test that the default language (index 0) is excluded from the table.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Multi-part feature (table + add dialog + edit sheet) but each part follows established patterns; sonnet can execute this autonomously within one session.
