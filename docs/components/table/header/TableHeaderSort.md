# `TableHeaderSort`

`TableHeaderSort` is the sortable column header — renders a ghost button with the title and a stacked up/down chevron, cycling through `asc → desc → none` on click. Generic over the row type.

## Features

- Three-state cycle: ascending → descending → unsorted
- Active sort direction highlights the matching chevron
- Renders only when the column reports `getCanSort()` is `true`
- Border indicator while a sort is active

## Usage

```ts
import { h } from 'vue';

const columns: ColumnDef<Quotation>[] = [
  {
    accessorKey: 'createdAt',
    header: ({ column }) =>
      h(TableHeaderSort, { column, title: t('created') }),
    enableSorting: true,
  },
];
```

## Props

### `column`

```ts
column: Column<T>
```

[TanStack Table](https://tanstack.com/table/latest/docs/introduction) column instance.

### `title`

```ts
title: string
```

Header label.

### `className`

```ts
className?: string
```

Extra classes for the button.

## Dependencies

- shadcn-vue [`Button`](/components/button/ButtonIcon)
- TanStack Table for the column sorting API
