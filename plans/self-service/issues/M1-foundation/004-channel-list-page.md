---
title: "Implement channel list page"
project: "Self Service (Channels)"
milestone: "M1 — Foundation"
priority: 2
estimate: 3
labels:
  - feature
  - confidence-high
  - risk-low
  - geins-studio
depends_on:
  - "./002-channel-repository.md"
  - "./003-navigation-and-i18n.md"
model: sonnet
mode: claude-code agent
---

## Context

The channel list page is the entry point for channel management. It follows the standard list page pattern used across the app (quotation, company, price-list). It displays all channels in a table with key information and actions.

## Expected Outcome

A fully functional list page at `/store/channel/list` showing all channels in a table with columns matching the Figma design, a "New channel" button, and standard table actions (edit, delete).

## Implementation Notes

**File: `app/pages/store/channel/list.vue`**

Follow the standard list page pattern (reference: `app/pages/orders/quotation/list.vue`):

1. `definePageMeta({ pageType: 'list' })`
2. Fetch data: `useGeinsRepository()` → `channelApi.list()` via `useAsyncData`
3. Map to list data type: `ChannelListItem` (id, name/displayName, url, market count, active status)
4. Columns from Figma: ID, Name (link to edit page), URL, Markets (count with tooltip or badge), Status (active/inactive badge)
5. Column setup: `useColumns<ChannelListItem>()` → `getColumns()` with appropriate `columnTypes` (name as `'link'`, active as status badge)
6. Actions column: `addActionsColumn` with edit and delete (no copy for now — plan says M7)
7. Error handling: `fetchError` ref pattern with `watch([data, error])`, pass `error` and `onRetry` to `TableView`
8. `NuxtErrorBoundary` wrapping `TableView`

**Template structure:**
- `ContentHeader` with title `$t('channel', 2)` ("Channels")
- `ContentActionBar` with `ButtonIcon` for "New channel" linking to `/store/channel/new`
- `TableView` with loading, error, and retry props

**Reference files:**
- List page pattern: `app/pages/orders/quotation/list.vue` or `app/pages/pricing/price-list/list.vue`
- Entity URL: `useEntityUrl()` for constructing links
- Page error: `usePageError()` for `showErrorToast`

## Acceptance Criteria

- Page renders at `/store/channel/list`
- `definePageMeta({ pageType: 'list' })` is set
- Table displays columns: ID, Name (clickable link), URL, Markets (count), Status (badge)
- "New channel" button navigates to `/store/channel/new`
- Table row click or edit action navigates to `/store/channel/{id}`
- Delete action shows confirmation dialog and calls `channelApi.delete(id)`
- Error state renders inline with retry button when fetch fails
- Loading state shows skeleton rows
- `pnpm typecheck` passes
- `pnpm lint:check` passes
- Unit test: verify `mapToListData` transforms API response correctly

## Agent Execution
- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Standard list page implementation with multiple composable integrations — sonnet handles the pattern matching across files well.
