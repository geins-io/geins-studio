---
title: 'Build Channel list page'
project: 'Self Service (Channels)'
milestone: 'M1 — Foundation'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - './001-channel-types.md'
  - './002-channel-api-repository.md'
model: sonnet
mode: claude-code agent
---

## Context

No channel pages exist yet. The list page is the entry point for channel management and the first user-visible deliverable in M1. It follows the established list page pattern used by quotation and price-list pages.

## Expected Outcome

`app/pages/store/channel/list.vue` renders a paginated, sortable table of all channels with a "+ New channel" button that navigates to the create route.

## Implementation Notes

Follow the standard list page pattern (see `app/pages/orders/quotation/list.vue` and the "List Page" section in `CLAUDE.md`):

1. `definePageMeta({ pageType: 'list' })`
2. `useGeinsRepository()` → `channelApi.channel.list()`
3. `useAsyncData` with a `fetchError` ref for graceful error handling
4. `useColumns<ChannelListItem>()` → `useTable` → `TableView`
5. `NuxtErrorBoundary` wrapping `TableView` as a runtime safety net
6. `usePageError()` for fatal errors

### Table columns (from project plan)

| Column | Notes |
|--------|-------|
| ID | Plain text |
| Name | Clickable link to `/store/channel/{id}` via `useEntityUrl` |
| URL | Plain text |
| Markets | Tooltip showing market names; display count as plain text |
| Status | `StatusBadge` showing active/inactive |

- Use `getEntityUrlFor('channel', 'store', id)` for the edit link in the Name cell.
- Actions column: edit only (no delete, no copy — per project plan). Use `addActionsColumn` with `availableActions: ['edit']`.

### Page header

- Title: `t('navigation.channels')` (i18n key added in issue 005)
- `+ New channel` button using the `new_entity` global i18n key pattern, navigates to `/store/channel/new`

### Error handling

Use the `fetchError` ref pattern:
```ts
const fetchError = ref(false);
watch([data, error], () => {
  if (error.value) { fetchError.value = true; dataList.value = []; }
  else { fetchError.value = false; dataList.value = data.value ?? []; }
}, { immediate: true });
```
Pass `:error="fetchError"` and `:on-retry="refresh"` to `TableView`.

## Acceptance Criteria

- `app/pages/store/channel/list.vue` exists and renders at `/store/channel/list`.
- Table displays ID, Name (linked), URL, Markets, and Status columns.
- "+ New channel" button navigates to `/store/channel/new`.
- Failed API calls show the inline error empty state with a retry button (not a fatal error page).
- `NuxtErrorBoundary` wraps `TableView` as a safety net.
- No `console.log` — use `useGeinsLog` scoped logger for any debug output.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: at least one test verifying the page renders without crashing (mock `useGeinsRepository`).

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Standard list page — well-established pattern in the codebase, low complexity.
