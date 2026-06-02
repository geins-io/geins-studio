# `ContentTextTooltip`

Wraps inline text with a `TooltipProvider` so that hovering reveals additional detail. Used in `ContentDataList` for array values that show a count with a tooltip listing the items.

## Features

- 100ms hover delay for snappy feel
- Tooltip content max-width `24rem` to wrap long lists cleanly
- `triggerClass` prop for custom trigger styling

## Usage

### Basic Usage

```vue
<template>
  <ContentTextTooltip>
    3 categories
    <template #tooltip>
      Accessories, Footwear, Outerwear
    </template>
  </ContentTextTooltip>
</template>
```

## Props

### `triggerClass`

```ts
triggerClass?: string
```

- **Type:** `string`
- **Default:** `''`
- **Description:** Additional CSS classes applied to the trigger `<span>`.

## Slots

### default

The visible trigger content (e.g. a count label like "3 categories").

### `tooltip`

The content shown inside the tooltip popover on hover.

## Dependencies

- shadcn-vue [`Tooltip`](/components/shadcn-vue)
