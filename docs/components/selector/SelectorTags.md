# `SelectorTags`

A flex-wrap container that holds a row of [`SelectorTag`](/components/selector/SelectorTag) or [`SelectorTagLink`](/components/selector/SelectorTagLink) elements with consistent spacing.

## Features

- Pure layout wrapper — no props, no emits
- `flex-wrap` ensures tags reflow across multiple lines on narrow viewports

## Usage

### Basic Usage

```vue
<template>
  <SelectorTags>
    <SelectorTag label="Category A" @remove="remove('a')" />
    <SelectorTag label="Category B" @remove="remove('b')" />
  </SelectorTags>
</template>
```

## Slots

### default

The `SelectorTag` or `SelectorTagLink` children to render.

## Dependencies

None — pure layout component.
