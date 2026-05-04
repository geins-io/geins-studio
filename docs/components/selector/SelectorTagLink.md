# `SelectorTagLink`

Wrapper that renders a [`SelectorTag`](/components/selector/SelectorTag) with an optional inline linking word (e.g. "or") shown between consecutive tags. The last item in a series omits the linking word.

## Features

- Hides the linking word when `isLast` is `true`
- Uses [`SelectorLinkingWord`](/components/selector/SelectorLinkingWord) for consistent uppercase styling

## Usage

### Basic Usage

```vue
<template>
  <SelectorTags>
    <SelectorTagLink
      v-for="(id, i) in categoryIds"
      :key="id"
      linking-word="or"
      :is-last="i === categoryIds.length - 1"
    >
      <SelectorTag :label="getCategoryName(id)" @remove="remove(i)" />
    </SelectorTagLink>
  </SelectorTags>
</template>
```

## Props

### `linkingWord`

```ts
linkingWord: string
```

- **Type:** `string`
- **Required:** yes
- **Description:** The word or phrase shown between tags (e.g. `'or'`, `'and'`).

### `isLast`

```ts
isLast: boolean
```

- **Type:** `boolean`
- **Required:** yes
- **Description:** When `true`, the linking word is hidden after this item.

## Slots

### default

The `SelectorTag` (or any content) to render as the tagged item.

## Dependencies

- [`SelectorLinkingWord`](/components/selector/SelectorLinkingWord)
