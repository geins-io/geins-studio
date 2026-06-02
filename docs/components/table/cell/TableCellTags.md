# `TableCellTags`

`TableCellTags` renders a row of pill-style tags — a compact visual list for tag/label arrays.

## Features

- Inline-flex layout, single line
- Each tag is a small bordered pill

## Usage

```ts
{
  id: 'tags',
  cell: ({ row }) => h(TableCellTags, { tags: row.original.tags }),
}
```

## Props

### `tags`

```ts
tags: string[]
```

The tags to render. Empty array renders nothing.
