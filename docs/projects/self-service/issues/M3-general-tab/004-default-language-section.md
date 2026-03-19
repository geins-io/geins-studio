---
title: 'Implement default language section in the Languages card'
project: 'Self Service (Channels)'
milestone: 'M3 — General Tab'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-medium
  - risk-low
depends_on:
  - './002-form-input-language-select-with-flags.md'
  - '../M1-foundation/004-channel-edit-page-scaffold.md'
model: sonnet
mode: claude-code agent
---

## Context

The Languages card on the General tab has two sections: a "Default language" display at the top, and an "Additional languages" table below (handled in issue 005). This issue covers the default language section: a read display of the current default language with a flag icon, and a "Change" button that opens a dialog to select a new default from all available system languages.

The API convention is that the first item in the `languages` array on the channel PATCH payload is the default language. Changing the default language reorders the array and sends the full updated array via channel PATCH.

## Expected Outcome

Inside a `ContentEditCard` titled "Languages" on the General tab:
- A "Default language" section displays the current default language name with a flag emoji (from the `countryCodeToFlagEmoji` utility added in issue 002).
- A "Change" button lives in the `#header-action` slot of a labelled section (or as a button next to the display row).
- Clicking "Change" opens a `Dialog` containing `FormInputLanguageSelect` (from issue 002) with `showFlags` and `disableTeleport` props.
- Confirming the dialog updates the channel's language array so the selected language is first; the change is reflected in `entityDataUpdate` and triggers `hasUnsavedChanges`.

## Implementation Notes

### Data flow

- Available languages: fetch from `globalApi.language.list()` — call this inside `onMounted` or via `useAsyncData` within the General tab component. Cache the result in a local `ref<Language[]>` so the same list is reused by the Additional languages dialog (issue 005).
- Current default language: `entityData.value?.languages?.[0]` (first in array = default, per API convention).
- When the user confirms a new default language:
  1. Take the current `entityDataUpdate.languages` array.
  2. Move the selected language ID to index 0 (keeping others in their existing order).
  3. Assign the result back to `entityDataUpdate.languages`.

### Form integration

Languages are not a VeeValidate form field — they live as a standalone `ref` or are part of `entityDataUpdate` directly. Use a `watch` on the languages ref to sync into `entityDataUpdate.languages` (same pattern as `discountType`/`discountValue` in `quotation/[id].vue`).

### Display

- Default language row: flag emoji + language name. If no languages are assigned yet, show a placeholder `—`.
- Wrap the label and value in the standard labeled value pattern from `CLAUDE.md` (`text-muted-foreground mb-1 text-xs font-medium` label, `text-sm` value).

### i18n

Add to `channel` namespace in `en.json` and `sv.json`:
- `channel.languages` (card title)
- `channel.default_language`
- `channel.change` (button label — can reuse global `change` key if it exists)
- `channel.change_default_language` (dialog title)

## Acceptance Criteria

- "Default language" section renders the current first language from `entityData.languages` with its flag emoji.
- "Change" button opens a Dialog with `FormInputLanguageSelect` (`showFlags=true`, `disableTeleport=true`).
- Confirming a new default language moves it to index 0 in `entityDataUpdate.languages` without removing other languages.
- Change is immediately reflected in the display without saving.
- `hasUnsavedChanges` becomes `true` after a language change; it is `false` on initial load and after save.
- If no languages are assigned, the section shows `—` with no errors.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- All visible strings in `en.json` and `sv.json`.
- Vitest: test that selecting a new default language moves it to index 0 in the languages array; test that `hasUnsavedChanges` is true after the change.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Standard dialog + display pattern with a small array-manipulation on confirm — no novel architecture; sonnet handles it autonomously.
