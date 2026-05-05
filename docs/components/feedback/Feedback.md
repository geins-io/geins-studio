# `Feedback`

`Feedback` is the inline alert component — a thin wrapper around shadcn-vue's `Alert` that maps four semantic types (`positive`, `negative`, `warning`, `info`) to the matching variant and Lucide icon. Used for in-page status messaging that's stronger than helper text but doesn't need a toast.

## Features

- Four `type` values mapped to `Alert` variants and icons:
  - `positive` → `positive` variant + `CheckCircle2`
  - `negative` → `destructive` variant + `TriangleAlert`
  - `warning` → `warning` variant + `CircleAlert`
  - `info` (default) → `info` variant + `Info`
- Three slots: `title`, `description`, optional `actions`

## Usage

### Basic Usage

```vue
<template>
  <Feedback type="warning">
    <template #title>{{ $t('orders.send_blocked_title') }}</template>
    <template #description>
      {{ $t('orders.send_blocked_description') }}
    </template>
  </Feedback>
</template>
```

### With actions

```vue
<template>
  <Feedback type="negative">
    <template #title>{{ $t('feedback_error_title') }}</template>
    <template #description>{{ $t('feedback_error_description') }}</template>
    <template #actions>
      <Button variant="secondary" @click="retry">{{ $t('retry') }}</Button>
    </template>
  </Feedback>
</template>
```

## Props

### `type`

```ts
type?: 'positive' | 'negative' | 'warning' | 'info'
```

Drives the variant and icon.

- **Default:** `'info'`

## Slots

### `title`

The alert headline.

### `description`

The alert body — supports markup (used by [`DialogStatusTransition`](/components/dialog/DialogStatusTransition) to render a bulleted block-reasons list).

### `actions`

Optional trailing action row, rendered only when the slot is provided.

## Dependencies

- shadcn-vue `Alert`, `AlertTitle`, `AlertDescription`
