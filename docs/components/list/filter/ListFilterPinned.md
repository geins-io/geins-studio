# `ListFilterPinned`

`ListFilterPinned` is one pinned filter in the [`ListFilterBar`](/components/list/filter/ListFilterBar): a dashed button that opens a popover with the filter's [`ListFilterValues`](/components/list/filter/ListFilterValues).

## Features

- Dashed `outline` button with the filter label; when active, a count badge (labelled "2 selected" for screen readers) and a chevron
- Popover header with the label, the value editor as body, and a "Clear" footer that clears only this filter
- **Applies live:** each toggle commits to the filter state straight away and the popover stays open, so several values can be picked in one go. A date preset applies on click, a custom range once both ends are picked. There is no Apply button. `useListQuery` cancels superseded requests, so rapid clicks refetch only once in effect.

## Usage

The bar renders it for every pinned filter; pages rarely use it directly.

```vue
<ListFilterPinned :definition="definition" :list-filters="listFilters" />
```

## Props

### `definition`

```ts
definition: ListFilterDefinition<TFilters>;
```

The filter to edit.

### `listFilters`

```ts
listFilters: ListFilterEditor<TFilters>;
```

The committed `useListFilters` instance. Don't pass a `stage()` draft: nothing would apply it.

## Dependencies

- [`ListFilterValues`](/components/list/filter/ListFilterValues)
- shadcn-vue `Popover`, `Button`, `Badge`
