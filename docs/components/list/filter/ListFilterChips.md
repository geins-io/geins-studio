# `ListFilterChips`

`ListFilterChips` is the "Filtered by" row above a list that was opened with filters in its URL: one removable chip per active filter, plus "Clear filters". The quotations and workflow runs lists use it for their [link filters](/concepts/list-queries#link-filters).

## Features

- One chip per filter: the translated filter name, then its value ("Status: Failed")
- An × on each chip (with a tooltip) emits `remove` with the filter's `type`
- "Clear filters" emits `clear`
- Renders nothing when `filters` is empty

The page owns the URL: it builds the chips from its parsed query and, on `remove`/`clear`, navigates without those keys. Pass the same "filters active" state to `TableView` as `:filtered` and handle its `@clear-filters`, so the empty state says nothing matched rather than that the list is empty.

## Usage

```vue
<script setup lang="ts">
import type { ListFilterChip } from '#shared/types';
import {
  parseQuotationListQuery,
  QUOTATION_LIST_QUERY_KEYS,
} from '@/lib/list-url-filters';

type FilterType = keyof typeof QUOTATION_LIST_QUERY_KEYS;

const route = useRoute();
const urlFilters = computed(() => parseQuotationListQuery(route.query));
const filterChips = computed<ListFilterChip<FilterType>[]>(() =>
  urlFilters.value.statuses.length
    ? [
        {
          type: 'status',
          typeLabel: t('status'),
          label: urlFilters.value.statuses.map(statusBadgeLabel).join(', '),
        },
      ]
    : [],
);

const removeFilter = (type: FilterType) => {
  const { [QUOTATION_LIST_QUERY_KEYS[type]]: _, ...rest } = route.query;
  navigateTo({ path: entityListUrl('quotation'), query: rest });
};
</script>

<template>
  <ListFilterChips
    :filters="filterChips"
    @remove="removeFilter"
    @clear="navigateTo(entityListUrl('quotation'))"
  />
</template>
```

## Props

### `filters`

```ts
defineProps<{ filters: ListFilterChip<T>[] }>();
```

The active filters, in display order. `T` is the page's union of filter types; `remove` emits it back.

```ts
interface ListFilterChip<T extends string = string> {
  type: T; // identifies the filter in `remove`
  typeLabel: string; // translated filter name, e.g. "Status"
  label: string; // translated value, e.g. "Failed"
}
```

## Events

| Event    | Payload   | When                    |
| -------- | --------- | ----------------------- |
| `remove` | `type: T` | A chip's × is clicked   |
| `clear`  | —         | "Clear filters" clicked |

## Dependencies

- [`ButtonIcon`](/components/button/ButtonIcon)
- shadcn-vue `Tooltip`
