# `TableCellLongText`

`TableCellLongText` truncates a long text value at a fixed character count and shows the full text in a tooltip on hover.

## Features

- Hard truncation by character count (not pixel width)
- Adds `…` when truncated
- Full text rendered in the tooltip
- Slot lets you override the visible content while keeping the full text in the tooltip

## Usage

```ts
{
  id: 'description',
  cell: ({ row }) =>
    h(TableCellLongText, {
      text: row.original.description,
      maxTextLength: 60,
    }),
}
```

## Props

### `text`

```ts
text: string
```

The full text. Always shown in the tooltip; trimmed for the trigger.

### `maxTextLength`

```ts
maxTextLength: number
```

Max characters before truncation.

### `className`

```ts
className?: string
```

Extra Tailwind classes for the trigger.

## Slots

### default

Override the trimmed display while keeping the full `text` in the tooltip.

## Dependencies

- shadcn-vue [`Tooltip`](/components/shadcn-vue)
