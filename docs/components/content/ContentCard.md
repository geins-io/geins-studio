# `ContentCard`

Thin wrapper around the shadcn-vue `Card` primitive that applies the standard content page padding (`p-4`, `@2xl:p-6`).

## Features

- Zero configuration — applies consistent padding at all breakpoints
- All content is rendered through the default slot

## Usage

### Basic Usage

```vue
<template>
  <ContentCard>
    <p>Card body goes here</p>
  </ContentCard>
</template>
```

## Slots

### default

Any content to render inside the padded card.

## Dependencies

- shadcn-vue [`Card`](/components/shadcn-vue)
