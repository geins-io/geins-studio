# `ListFilterValues`

`ListFilterValues` renders the value editor for one filter definition: [`ListFilterMultiSelect`](/components/list/filter/ListFilterMultiSelect) for a `multiselect` and [`ListFilterDateRange`](/components/list/filter/ListFilterDateRange) for a `dateRange`. The pinned-filter popover and the "All filters" sheet both use it as their body.

## Features

- Picks the editor from `definition.kind`
- Shows "Select a filter" without a definition, for the sheet's empty value pane
- Works on the committed filter state (edits apply live) or on a `stage()` draft (edits wait for apply)

## Usage

```vue
<script setup lang="ts">
const listFilters = useListFilters<LibraryFilters>({
  definitions,
  filters: query.filters,
});
// The sheet edits a draft, committed on "Apply filters".
const draft = listFilters.stage();
</script>

<template>
  <!-- Pinned popover: applies live -->
  <ListFilterValues :definition="definition" :list-filters="listFilters" />

  <!-- "All filters" sheet: staged -->
  <ListFilterValues :definition="selected" :list-filters="draft" />
</template>
```

## Props

### `definition`

```ts
definition?: ListFilterDefinition<TFilters>;
```

The filter to edit. Omitted, the component shows the `select_a_filter` prompt.

### `listFilters`

```ts
listFilters: ListFilterEditor<TFilters>;
```

The state the editor reads and writes: the `useListFilters` instance, or a draft from its `stage()`. Both carry the value actions plus `resolvedOptions`.

### `fill`

```ts
fill?: boolean;
```

Passed to [`ListFilterMultiSelect`](/components/list/filter/ListFilterMultiSelect): fill the container's height instead of capping the list. The multiselect is keyed by the filter name, so switching filters starts with an empty search.

## Dependencies

- [`useListFilters`](/composables/useListFilters)
