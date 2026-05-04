# `TableView`

`TableView` is the standard list-page table — a thin Vue wrapper around [TanStack Table](https://tanstack.com/table/latest/docs/introduction) that handles search, sorting, pagination, column visibility, column pinning, row selection, expandable rows, and skeleton loading. Generic over the row type.

## Features

- Three layout modes (`Advanced`, `Simple`, `Minimal`) via the `TableMode` enum
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
    entity-name="quotation"
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
    entity-name="line"
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
    entity-name="category"
  />
</template>
```

## Props

### `columns`

```ts
columns: ColumnDef<TData, TValue>[]
```

TanStack column definitions. Use [`useColumns`](/composables/useColumns) to compose typed column factories.

### `data`

```ts
data: TData[]
```

Row data. While `loading` is `true`, skeleton rows replace this entirely.

### `entityName`

```ts
entityName?: string
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

Initial page size. Ignored in `Minimal` mode (no pagination).

- **Default:** `30`

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

Pre-select rows by id. Two-way: changing this externally updates internal selection.

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

## Events

### `clicked`

```ts
(row: TData): TData
```

Emitted when a row is clicked.

### `selection`

```ts
(selection: TData[]): TData[]
```

Emitted with the current selection. For expandable tables, only leaf rows (no children) are emitted.

## Slots

### `empty-actions`

Custom actions rendered in the "no data" empty state (e.g. "Create your first entity"). Hidden when the empty state is filter-driven — the table shows a "Clear search" button instead.

## Dependencies

- [TanStack Table](https://tanstack.com/table/latest/docs/introduction) — core table state engine
- shadcn-vue [`Table`](/components/shadcn-vue), `Empty`, `Input`, [`Button`](/components/button/ButtonIcon)
- [`TableColumnToggle`](/components/table/TableColumnToggle) — column visibility / order sheet
- [`TablePagination`](/components/table/TablePagination) — footer
- [`useSkeleton`](/composables/useSkeleton) — skeleton row factory
