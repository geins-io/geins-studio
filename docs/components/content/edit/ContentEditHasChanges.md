# `ContentEditHasChanges`

`ContentEditHasChanges` is the inline "unsaved changes" indicator rendered above edit-page action bars — a tiny info icon plus localized text in the negative color, shown only when `changes` is `true`.

## Features

- Single-line, negative color, info icon + localized text
- Renders nothing when `changes` is `false` (`v-if`)

## Usage

```vue
<template>
  <ContentEditHasChanges :changes="hasUnsavedChanges" />
</template>
```

Most edit pages bind this to [`useEntityEdit`](/composables/useEntityEdit)'s `formTouched` ref.

## Props

### `changes`

```ts
changes?: boolean
```

When `true`, renders the indicator. When `false` / `undefined`, renders nothing.
