---
title: 'Breadcrumbs and page titles for channel edit page'
project: 'Self Service (Channels)'
milestone: 'M7 — Polish & Integration'
priority: 3
estimate: 1
labels:
  - feature
  - confidence-high
  - risk-low
  - geins-studio
depends_on:
  - '../M1-foundation/004-channel-edit-page-scaffold.md'
model: haiku
mode: claude-code agent
---

## Context

The channel edit page and list page need breadcrumbs and browser tab titles wired up correctly. `usePageTitle` already auto-derives titles from the breadcrumb trail — this issue ensures `setCurrentTitle` is called with the channel display name so the tab title reads `"[Channel name] - Channels - Geins Studio"`. The list page needs a static breadcrumb entry. This is straightforward wiring of existing infrastructure.

## Expected Outcome

- Channel list page breadcrumb: `Settings > Channels`
- Channel edit page breadcrumb: `Settings > Channels > [channel displayName]`
- Browser tab title on edit page: `"[channel displayName] - Channels - Geins Studio"`
- Browser tab title on list page: `"Channels - Geins Studio"`
- Navigating between channels (or to `new`) always starts with a fresh title.

## Implementation Notes

Follow the `usePageTitle` pattern documented in `CLAUDE.md` ("Page titles" section):

- `setCurrentTitle` is called in `parseEntityData` after `displayName` is known — this is the same call used for breadcrumbs, no extra setup.
- The breadcrumbs store clears overrides when leaving a child page, so navigating from one channel to another always resets correctly.
- List page uses `definePageMeta({ pageType: 'list' })` — the breadcrumb is derived from the navigation entry in `app/lib/navigation.ts` (added in M1 issue 005).
- In create mode, use the i18n key `t('new_entity', { entityName: t('channel.channel') })` as the title so the tab reads `"New channel - Channels - Geins Studio"`.

## Acceptance Criteria

- Channel list page shows correct breadcrumb trail in the UI.
- Channel edit page (edit mode) breadcrumb displays the channel's `displayName` once data is loaded.
- Channel edit page (create mode) breadcrumb displays `"New channel"` (or equivalent i18n).
- Browser tab title updates correctly for list, create, and edit modes.
- Navigating from one channel to another resets the title without stale values.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: test that `setCurrentTitle` is called with `displayName` in `parseEntityData`; test that create mode sets the new-entity title.

## Agent Execution

- **Model**: haiku
- **Mode**: claude-code agent
- **Why**: Trivial wiring of existing `setCurrentTitle` infrastructure — one call in `parseEntityData` and one in the create-mode branch.
