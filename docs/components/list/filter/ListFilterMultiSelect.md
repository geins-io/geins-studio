# `ListFilterMultiSelect`

`ListFilterMultiSelect` is the checkbox option list for a `multiselect` filter. Each toggle writes straight to the filter state it's given. It's usually rendered through [`ListFilterValues`](/components/list/filter/ListFilterValues).

## Features

- Built on the `Command` (listbox) and `Checkbox` primitives. Arrow keys move through the options, and Space or Enter toggles one.
- A local search input when the filter is `searchable` (by default, when there are more than 10 options — `LIST_FILTER_SEARCH_THRESHOLD`). It looks like an `Input size="md"` search, the same as the table search but shorter. The search survives toggles, so several matches can be picked in a row.
- "No options found" when nothing matches
- Async options through `resolvedOptions(name)`: skeleton rows while loading, and an inline error with **Retry**
- Option icons (Lucide names) resolved with `useLucideIcon`
- Scrolls past `max-h-52`

## Usage

```vue
<ListFilterMultiSelect :definition="typeFilter" :list-filters="listFilters" />
```

```ts
const typeFilter: ListFilterMultiselectDefinition<LibraryFilters> = {
  name: 'assetTypes',
  label: 'type',
  kind: 'multiselect',
  options: [
    {
      value: 'image',
      label: t('asset_library.asset_type.image'),
      icon: 'Image',
    },
    {
      value: 'pdf',
      label: t('asset_library.asset_type.pdf'),
      icon: 'FileText',
    },
  ],
};
```

Option labels are display text. Translate them, or use data values, at the consumer.

## Props

### `definition`

```ts
definition: ListFilterMultiselectDefinition<TFilters>;
```

### `listFilters`

```ts
listFilters: ListFilterEditor<TFilters>;
```

The committed `useListFilters` instance or a `stage()` draft.

### `fill`

```ts
fill?: boolean;
```

Fill the container's height instead of capping the list at `max-h-52`. The list then scrolls inside whatever height it gets, under a fixed search. The sheet's values pane sets it; the pinned popover keeps the cap.

## Dependencies

- `ui/command`, `ui/checkbox`, `ui/skeleton`
- [`useListFilters`](/composables/useListFilters), `useLucideIcon`
