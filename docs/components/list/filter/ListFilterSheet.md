# `ListFilterSheet`

`ListFilterSheet` is the "All filters" sheet: every filter of a list in one place, with a definition list on the left and the selected filter's [`ListFilterValues`](/components/list/filter/ListFilterValues) on the right. The [`ListFilterBar`](/components/list/filter/ListFilterBar) opens it through `open-all`.

## Features

- **Staged edits:** the sheet edits a `stage()` draft of the filters. "Apply filters" calls `draft.apply()`, which replaces `filters` once, so there is one refetch and one URL write. "Cancel", Esc and clicking outside discard the draft. Each open reseeds it from the committed state, so changes made meanwhile in the pinned popovers show up.
- **Filter by** pane: a search over the filter labels, then one row per definition with its icon (`listFilterIcon`), label, staged active count, a pin toggle and a chevron. The selected row is highlighted, and the first definition is preselected on every open.
- **Pins apply immediately** (`togglePin`): they're a per-user preference, not query state. The toggle shows on hover and focus, and stays visible with "Pinned" while pinned. At the limit (`LIST_FILTER_MAX_PINNED`) it's `aria-disabled` with a tooltip. Filters with `pinnable: false` have no toggle.
- `SheetContent width="medium"`; two columns from `sm` up, stacked below.
- Focus moves into the sheet on open and back to the "All filters" button on close (the dialog's focus scope).

## Usage

```vue
<script setup lang="ts">
const listFilters = useListFilters<LibraryFilters>({
  definitions,
  filters,
  resetFilters,
});
const sheetOpen = ref(false);
</script>

<template>
  <ListFilterBar :list-filters="listFilters" @open-all="sheetOpen = true" />
  <ListFilterSheet v-model:open="sheetOpen" :list-filters="listFilters" />
</template>
```

## Props

### `listFilters`

```ts
listFilters: UseListFiltersReturnType<TFilters>;
```

The committed `useListFilters` instance. The sheet takes its draft from `stage()` and its pins from the instance itself.

## Models

| Model          | Type      | Notes                        |
| -------------- | --------- | ---------------------------- |
| `v-model:open` | `boolean` | Closing never commits edits. |

## Dependencies

- [`useListFilters`](/composables/useListFilters)
- [`ListFilterValues`](/components/list/filter/ListFilterValues)
- shadcn-vue `Sheet`, `Tooltip`, `Input`, `Button`
