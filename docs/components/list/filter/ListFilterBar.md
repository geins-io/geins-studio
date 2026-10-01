# `ListFilterBar`

`ListFilterBar` is the filter strip next to a list's search field. It shows the pinned filters, an "All filters" button that opens the "All filters" sheet, and "Clear all filters" while any filter is active. It works above a [`TableView`](/components/table/TableView) (in its `toolbar` slot) or a grid.

## Features

- One [`ListFilterPinned`](/components/list/filter/ListFilterPinned) per pinned filter, in pinned order (`useListFilters().pinned`)
- "All filters" with the `ListFilter` icon and a count of active filters; emits `open-all`
- "Clear all filters" only when `totalActive > 0`; calls `clearAll()`, so with `resetFilters` it resets to the list defaults
- Scrolls horizontally on narrow widths instead of scrolling the page

## Usage

```vue
<script setup lang="ts">
const { filters, resetFilters, hasActiveQuery, searchInput, ...query } =
  useListQuery<Asset, LibraryFilters>({
    key: 'asset-list',
    fetcher,
    defaults: { filters: {} },
    route: { filters: listFilterRouteParams(definitions) },
  });
const listFilters = useListFilters<LibraryFilters>({
  definitions,
  filters,
  resetFilters,
  defaultPinned: ['assetTypes', 'modified'],
});
const sheetOpen = ref(false);
</script>

<template>
  <TableView
    v-model:search="searchInput"
    :filtered="hasActiveQuery"
    @clear-filters="listFilters.clearAll"
    v-bind="tableProps"
  >
    <template #toolbar>
      <ListFilterBar :list-filters="listFilters" @open-all="sheetOpen = true" />
    </template>
  </TableView>
</template>
```

## Props

### `listFilters`

```ts
listFilters: UseListFiltersReturnType<TFilters>;
```

The committed `useListFilters` instance. The bar reads the definitions, pins and counts from it, and its pinned popovers edit it directly, so every change applies live.

## Events

### `open-all`

```ts
() => void
```

"All filters" was clicked. Open the "All filters" sheet.

## Dependencies

- [`useListFilters`](/composables/useListFilters)
- [`ListFilterPinned`](/components/list/filter/ListFilterPinned)
