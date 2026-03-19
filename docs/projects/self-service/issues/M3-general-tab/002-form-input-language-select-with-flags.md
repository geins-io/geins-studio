---
title: 'Create FormInputLanguageSelect with flag support'
project: 'Self Service (Channels)'
milestone: 'M3 — General Tab'
priority: 2
estimate: 1
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - '../M1-foundation/002-channel-api-repository.md'
model: haiku
mode: claude-code agent
---

## Context

The default language dialog on the General tab requires a searchable language selector that shows a country flag icon alongside each language name. `FormInputCountrySelect` is the closest existing component but it sources data from `accountStore.currentCountries`. Languages are a distinct entity (from `globalApi.language.list()`) and need their own component.

The project plan calls for adding a `showFlags` prop to `FormInputCountrySelect`. However, because languages and countries are separate entities, the cleanest approach is a new `FormInputLanguageSelect` component that follows the same pattern as `FormInputCountrySelect` but sources language data from the channel API repository.

## Expected Outcome

A new `app/components/form/input/FormInputLanguageSelect.vue` component that:
- Accepts a `v-model` of `string` (language `_id`)
- Accepts `disableTeleport?: boolean` (for use inside Dialogs)
- Accepts `showFlags?: boolean` (defaults `false`) — when `true`, renders a flag emoji or a small flag icon next to each language name in the dropdown and selected value display
- Sources all available languages from `globalApi.language.list()` (fetched via `useAsyncData` or passed in as a prop — prefer a `dataSet` prop so the parent controls when/how data is fetched)
- Reuses `FormInputSelectSearch` as the underlying primitive (same as `FormInputCountrySelect`)

## Implementation Notes

- Model the component after `FormInputCountrySelect` (`app/components/form/input/FormInputCountrySelect.vue`).
- Props:
  ```ts
  defineProps<{
    dataSet?: LanguageBase[]   // pass pre-fetched languages from parent
    disableTeleport?: boolean
    showFlags?: boolean
  }>()
  ```
- Map `LanguageBase[]` to `PlainDataItem[]` with an optional flag prefix in the `label` field when `showFlags` is true. Country code for the flag can be derived from the language's country code field (if available on the `Language` type) or from a static locale→flag mapping utility.
- If the `Language` type does not include a country code for flag lookup, add a simple `languageToCountryCode(langId: string): string` utility in `app/utils/index.ts` mapping common language IDs to ISO country codes (e.g. `'sv'` → `'SE'`, `'en'` → `'GB'`). Only add entries needed for the languages returned by the API.
- Flag rendering: use a Unicode flag emoji constructed from the ISO country code (e.g. `countryCodeToFlagEmoji('SE')` → `'🇸🇪'`). Add `countryCodeToFlagEmoji(code: string): string` to `app/utils/index.ts`.
- i18n: add `channel.language` to `en.json` and `sv.json` for the `entityName` prop passed to `FormInputSelectSearch`.

## Acceptance Criteria

- `FormInputLanguageSelect` renders as a searchable dropdown.
- When `showFlags` is `false` (default), names render as plain text.
- When `showFlags` is `true`, a flag emoji appears before each language name.
- `disableTeleport` is forwarded to the underlying `FormInputSelectSearch`.
- `countryCodeToFlagEmoji` utility is unit-tested for at least 3 common codes.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.

## Agent Execution

- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: New component follows an existing one-file pattern exactly — trivial adaptation with a small utility helper.
