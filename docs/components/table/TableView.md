# `TableView`

`TableView` is the standard list-page table — a thin Vue wrapper around [TanStack Table](https://tanstack.com/table/latest/docs/introduction) that handles search, sorting, pagination, column visibility, column pinning, row selection, expandable rows, and skeleton loading. Generic over the row type.

## Features

- Three layout modes (`Advanced`, `Simple`, `Minimal`) via the `TableMode` enum
- Client or server data source: sort, page and search in the browser, or let the backend do it (see [Server mode](#server-mode))
- Built-in global search with 300ms debounce and field allowlist
- Column visibility + order persisted per user/route via cookies
- Sticky pinned columns (left + right) with shadow indicators
- Row selection (single + multi) with `getRowId` keyed on `_id` by default
- Expandable rows with auto-expand on search match
- Skeleton rendering while `loading` is `true` (uses [`useSkeleton`](/composables/useSkeleton))
- Empty states for "no data", "no results matching filter", and "fetch error" with optional retry slot
- Maximize toggle (advanced mode) for full-screen review

## Usage

### Basic Usage

```vue
<script setup lang="ts" generic="T">
import type { ColumnDef } from '@tanstack/vue-table';

const columns: ColumnDef<Quotation>[] = useColumns();
const { data, loading } = await useQuotations();
</script>

<template>
  <TableView
    :columns="columns"
    :data="data"
    entity-key="quotation"
    :loading="loading"
    :searchable-fields="['_id', 'customerName', 'reference']"
  />
</template>
```

### Minimal mode (embedded table)

For tables embedded inside cards or panels — no search, no pagination, no pinning:

```vue
<template>
  <TableView
    :columns="columns"
    :data="data"
    :mode="TableMode.Minimal"
    entity-key="line"
  />
</template>
```

### Expandable rows

```vue
<template>
  <TableView
    :columns="columns"
    :data="categories"
    enable-expanding
    :get-sub-rows="(row) => row.children"
    entity-key="category"
  />
</template>
```

### Server mode

With `data-source="server"`, `data` is one page the backend has already sorted, paged and searched. The table doesn't re-sort, re-page or filter the rows. It reads and writes page, sort and search through `v-model`s, so bind them to [`useListQuery`](/composables/useListQuery):

```vue
<script setup lang="ts">
const {
  items,
  total,
  pending,
  error,
  searchInput,
  hasActiveQuery,
  pagination,
  sorting,
  refresh,
  resetFilters,
} = useListQuery<Asset, AssetQueryFilters>({
  key: 'asset-list',
  fetcher: (state, options) => assetApi.query(state, undefined, options),
  defaults: { filters: {} },
});
</script>

<template>
  <TableView
    v-model:pagination="pagination"
    v-model:sorting="sorting"
    v-model:search="searchInput"
    data-source="server"
    entity-key="asset"
    :columns="columns"
    :data="items"
    :row-count="total"
    :loading="pending"
    :filtered="hasActiveQuery"
    :error="!!error"
    :on-retry="refresh"
    @clear-filters="resetFilters"
  />
</template>
```

How server mode differs from client mode:

- **Sorting** is single-column. Clearing a header's sort sets `sorting` to `[]`, which means "the endpoint's default". Only columns the column definitions mark sortable can be sorted. Mark columns the backend can't sort as non-sortable with `useColumns`'s `sortableColumns`. `TableView` knows nothing about backend field names. `initSortingState` is ignored; set the initial sort in `useListQuery`'s `defaults.sort`.
- **Search** writes `search` on every keystroke with no debounce. `useListQuery` owns the debounce. `searchableFields` doesn't apply.
- **Loading** shows skeleton rows only when there are no rows yet. Later fetches keep the current page on screen, dimmed, with `aria-busy`.
- **Not supported:** `TableMode.Minimal` (it has no pagination) and expanding rows. Both log a dev warning.

#### Selection in server mode

TanStack's row models only hold the loaded page, so `TableView` keeps the selected rows itself, keyed by `idColumn`. A selection survives page, sort, search and filter changes. The parent decides when to drop it and calls `clearSelection()`.

- `selection` emits **every** selected row across pages, in selection order. A selected id whose row isn't loaded yet (e.g. seeded through `selectedIds`) still counts as selected, and is emitted once a page containing it loads.
- `v-model:selected-ids` gives you the ids only, including rows that aren't loaded. Use it for bulk calls. Setting it from outside selects or deselects, including rows on other pages.
- The header checkbox selects or clears **the current page** only. "Select all N matching" isn't part of the table.
- The footer's "N selected" counts the whole selection. The total is `rowCount`.

```vue
<script setup lang="ts">
const selectedIds = ref<string[]>([]);
const tableView = ref<{ clearSelection: () => void }>();
</script>

<template>
  <TableView
    ref="tableView"
    v-model:selected-ids="selectedIds"
    data-source="server"
    ...
  />
</template>
```

A working example lives at `/dev/server-table` (dev builds only).

## Props

### `columns`

```ts
columns: (ColumnDef < TData, TValue > []);
```

TanStack column definitions. Use [`useColumns`](/composables/useColumns) to compose typed column factories.

### `data`

```ts
data: TData[]
```

Row data. While `loading` is `true`, skeleton rows replace this entirely. In server mode that only happens while `data` is empty.

### `entityKey`

```ts
entityKey?: string
```

i18n key for the entity. Used in empty states and pagination labels (e.g. "10 quotations selected").

- **Default:** `'row'`

### `idColumn`

```ts
idColumn?: string
```

Field used as the stable row identifier for selection persistence.

- **Default:** `'_id'`

### `pageSize`

```ts
pageSize?: number
```

Page size in client mode. Later changes to the prop are applied too. Ignored in `Minimal` mode (no pagination). In server mode the size comes from the `pagination` model.

- **Default:** `30`

### `pageSizes`

```ts
pageSizes?: number[]
```

Options in the rows-per-page selector (`Advanced` mode). In server mode, match `useListQuery`'s `pageSizes`.

- **Default:** `[30, 60, 120, 240]`

### `dataSource`

```ts
dataSource?: TableDataSource // 'client' | 'server'
```

`'client'` sorts, pages and searches `data` in the browser. `'server'` treats `data` as a page the backend prepared. See [Server mode](#server-mode). Read once at setup.

- **Default:** `'client'`

### `rowCount`

```ts
rowCount?: number
```

Server mode: the total across all pages (`totalItemCount`). Drives the row counter and the page count.

### `filtered`

```ts
filtered?: boolean
```

Filters outside the table are active. Shows the "no results" empty state (with **Clear search**, which emits `clear-filters`) even when the search is empty.

- **Default:** `false`

### `loading`

```ts
loading?: boolean
```

Renders skeleton rows when `true`.

- **Default:** `false`

### `searchableFields`

```ts
searchableFields?: Array<keyof TData>
```

Whitelist of fields the global search input filters against.

- **Default:** `['_id', 'name']`

### `mode`

```ts
mode?: TableMode
```

`TableMode.Advanced` (default — search, column toggle, pinning, maximize), `TableMode.Simple` (search optional, no pinning), `TableMode.Minimal` (no chrome, fully embedded).

- **Default:** `TableMode.Advanced`

### `maxHeight`

```ts
maxHeight?: string
```

CSS max-height for the inner scroll container.

### `showSearch`

```ts
showSearch?: boolean
```

Forces the search input on in `Simple` mode. Ignored in `Advanced` (always on) and `Minimal` (always off).

- **Default:** `false`

### `pinnedState`

```ts
pinnedState?: ColumnPinningState | null
```

Initial column pinning. Defaults to pinning `select` left and `actions` right.

### `selectedIds`

```ts
selectedIds?: string[]
```

Pre-select rows by id. Changing it from outside replaces the selection. In server mode it's also a model (`v-model:selected-ids`): the table emits `update:selectedIds` with every selected id, loaded or not.

### `emptyText` / `emptyDescription`

```ts
emptyText?: string
emptyDescription?: string
```

Override the "no data" empty state copy.

### `emptyFilteredText` / `emptyFilteredDescription`

```ts
emptyFilteredText?: string
emptyFilteredDescription?: string
```

Override the "no results for current filter" empty state copy.

### `emptyIcon`

```ts
emptyIcon?: Component
```

Override the icon shown in the "no data" empty state.

### `showEmptyActions`

```ts
showEmptyActions?: boolean
```

Show the action slot / "clear search" button in empty states.

- **Default:** `true`

### `error`

```ts
error?: boolean
```

Renders the error empty state instead of the normal one.

- **Default:** `false`

### `onRetry`

```ts
onRetry?: () => void
```

When provided alongside `error: true`, shows a Retry button in the error empty state.

### `initVisibilityState`

```ts
initVisibilityState?: VisibilityState
```

Initial column visibility map. In `Advanced` mode this is overlaid with the per-user cookie.

### `initSortingState`

```ts
initSortingState?: SortingState
```

Client mode: the sort applied once loading finishes, if nothing is sorted yet. Ignored in server mode.

### `enableExpanding`

```ts
enableExpanding?: boolean
```

Enables expandable parent rows. Search auto-expands all parents whose children match.

- **Default:** `false`

### `getSubRows`

```ts
getSubRows?: (row: TData) => TData[] | undefined
```

Required when `enableExpanding` is `true`. Returns the children of a parent row.

### `dimInactiveRows`

```ts
dimInactiveRows?: boolean
```

Renders rows where `row.original.active === false` at 50% opacity. Cells with `meta.skipInactiveDim` opt out.

- **Default:** `false`

## Models

Server mode only. Client mode keeps this state internal.

| Model                | Type              | Notes                                            |
| -------------------- | ----------------- | ------------------------------------------------ |
| `v-model:pagination` | `PaginationState` | 0-based `pageIndex` + `pageSize`.                |
| `v-model:sorting`    | `SortingState`    | At most one entry. `[]` is the endpoint default. |
| `v-model:search`     | `string`          | Raw input, not debounced.                        |

## Events

### `clear-filters`

```ts
() => void
```

Emitted by the empty state's **Clear search** button, after the table has cleared its own search. Reset any outside filters here (e.g. `useListQuery`'s `resetFilters`).

### `selection`

```ts
(selection: TData[]): TData[]
```

Emitted with the current selection. For expandable tables, only leaf rows (no children) are emitted. In server mode it holds every loaded selected row across pages. See [Selection in server mode](#selection-in-server-mode).

### `update:selectedIds`

```ts
(ids: string[]) => void
```

Server mode only. Every selected id, in selection order, including rows that aren't loaded.

## Exposed

### `clearSelection`

```ts
clearSelection(): void
```

Deselects every row, including rows on other pages in server mode. Emits `selection` and, in server mode, `update:selectedIds`.

## Slots

### `empty-actions`

Custom actions rendered in the "no data" empty state (e.g. "Create your first entity"). Hidden when the empty state is filter-driven — the table shows a "Clear search" button instead.

## Dependencies

- [TanStack Table](https://tanstack.com/table/latest/docs/introduction) — core table state engine
- shadcn-vue [`Table`](/components/shadcn-vue), `Empty`, `Input`, [`Button`](/components/button/ButtonIcon)
- [`TableColumnToggle`](/components/table/TableColumnToggle) — column visibility / order sheet
- [`TablePagination`](/components/table/TablePagination) — footer
- [`useSkeleton`](/composables/useSkeleton) — skeleton row factory
