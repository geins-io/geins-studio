---
title: 'Complete i18n keys for all channel tabs'
project: 'Self Service (Channels)'
milestone: 'M7 — Polish & Integration'
priority: 3
estimate: 3
labels:
  - chore
  - confidence-medium
  - risk-low
  - geins-studio
depends_on:
  - '../M1-foundation/005-navigation-and-i18n.md'
  - '../M2-storefront-settings/005-wire-storefront-settings-into-channel-edit.md'
  - '../M3-general-tab/005-additional-languages-management.md'
  - '../M4-markets-tab/004-additional-markets-table.md'
  - '../M5-payments-tab/003-payments-tab-card.md'
  - '../M6-mails-tab/007-mail-preview-sheet-tab.md'
model: sonnet
mode: claude-code agent
---

## Context

i18n keys have been added incrementally throughout M1–M6 — each issue added only the keys it needed. This issue does a full audit pass to ensure every user-facing string across all channel pages and components has proper translations in both `en.json` and `sv.json`, with no hardcoded English, no missing keys, and no unused keys left over.

The channel entity uses `save_entity` (global key) with `{ entityName: t('channel.channel') }` interpolation. There is no `delete_entity` for channels (deletion is not supported — RESOLVED in project plan).

## Expected Outcome

- Every label, description, placeholder, helper text, error message, toast message, and empty state across the channel list page, channel edit page, and all tab components exists in both `en.json` and `sv.json`.
- The `channel` namespace in `en.json` / `sv.json` is complete, well-organised, and free of duplicate or unused keys.
- No hardcoded English strings in any channel component (`app/components/channel/`, `app/pages/store/channel/`).
- `save_entity` global key is used (not a channel-specific save key).

## Implementation Notes

### Audit approach

1. Search all channel components and pages for hardcoded strings:
   ```
   grep -r "\"[A-Z]" app/components/channel/ app/pages/store/channel/
   grep -r "'[A-Z]" app/components/channel/ app/pages/store/channel/
   ```
2. Search for any `t('channel.` calls and verify each key exists in both locale files.
3. Check all `toast()` calls in channel pages — titles and descriptions must use `t()`.
4. Check all `placeholder`, `label`, `description` props on form components.
5. Check empty state messages in `TableView` usages (column definitions, `noDataText`).

### Key areas to audit

- **Channel list page**: Column headers, empty state, error state, `+ New channel` button label
- **Storefront settings tab**: Sub-tab labels, section titles, field labels, schema editor panel strings, JSON validation errors
- **General tab**: Card titles, field labels, helper texts (name auto-generated note, URL change warning), dialog titles for language management
- **Markets tab**: Card titles, default market label, add/remove actions, dialog strings
- **Payments tab**: Card title, payment row subtitle pattern (`"Markets: X | Customer types: X | Customer groups: X"`), enabled/disabled states
- **Mails tab**: Sub-tab labels, mail type names/descriptions, sheet titles, text key labels, restore-to-default button, override status indicators
- **Shared**: Activate/deactivate toast messages, error toasts, sidebar summary row labels

### Swedish translations

Ensure Swedish translations are accurate and natural (not machine-translated literals). Review against existing `sv.json` patterns for consistency in tone.

### Global entity action keys

Verify these global keys work correctly for channels:
- `save_entity` with `{ entityName: t('channel.channel') }` → "Save channel" / "Spara kanal"

No `delete_entity` or `copy_entity` keys needed — these are explicitly out of scope for channels.

## Acceptance Criteria

- `grep -r 't("' app/components/channel/ app/pages/store/channel/` returns no raw string arguments (all use i18n keys).
- All `t('channel.*')` calls resolve to existing keys in `en.json`.
- All `t('channel.*')` calls have corresponding Swedish translations in `sv.json`.
- No key exists in `en.json` under the `channel` namespace that is unreferenced in any channel component or page.
- Switching the app locale to Swedish displays correct Swedish strings on all channel pages.
- `pnpm lint:check` and `pnpm typecheck` pass with no new errors.
- Vitest: test that channel list page renders with expected i18n keys (snapshot or key-existence test); test that channel edit page header uses `save_entity` with correct `entityName` interpolation.

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Systematic audit and fill-in across multiple files — straightforward but requires reading all channel components; sonnet handles the breadth efficiently.
