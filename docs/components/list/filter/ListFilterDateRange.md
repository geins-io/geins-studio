# `ListFilterDateRange`

`ListFilterDateRange` edits a `dateRange` filter. It offers three presets and a custom range on a range calendar. It's usually rendered through [`ListFilterValues`](/components/list/filter/ListFilterValues).

## Features

- Presets: **Today**, **This week** and **This month**. Picking one stores `{ preset }`, which `resolveListDateRange` turns into dates when the query is sent. Presets are calendar-based: the week starts on Monday, and the month on the 1st.
- **Custom range** reveals a `RangeCalendar` (locale-aware, week starting on Monday). The range is written once both ends are picked, as ISO `from` (the start of the first day) and `to` (the end of the last day).
- The picked custom range is shown beside its option with `useDate().formatDate`.
- Keyboard operable: the radio group and the calendar grid.

## Usage

```vue
<ListFilterDateRange :definition="modifiedFilter" :list-filters="listFilters" />
```

```ts
const modifiedFilter: ListFilterDateRangeDefinition<LibraryFilters> = {
  name: 'modified',
  label: 'modified',
  kind: 'dateRange',
};
```

## Props

### `definition`

```ts
definition: ListFilterDateRangeDefinition<TFilters>;
```

### `listFilters`

```ts
listFilters: ListFilterEditor<TFilters>;
```

The committed `useListFilters` instance or a `stage()` draft.

## Dependencies

- `ui/radio-group`, `ui/range-calendar` (installed with the shadcn-vue CLI)
- [`useListFilters`](/composables/useListFilters), `useDate`, `useCookieLocale`
