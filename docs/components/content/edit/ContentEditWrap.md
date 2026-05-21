# `ContentEditWrap`

`ContentEditWrap` is the outermost container for entity edit pages — a `container p-0` div with a `header` slot and a default content slot.

## Features

- Slot-only — no logic, no props
- Provides the page-level container width
- `header` slot for the page heading + action bar; default slot for the body

## Usage

```vue
<template>
  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="entity?.name" />
    </template>

    <ContentEditMain>
      <!-- main content + sidebar -->
    </ContentEditMain>
  </ContentEditWrap>
</template>
```

## Slots

### `header`

The page heading area, typically [`ContentHeader`](/components/content/ContentHeader).

### default

The page body, typically [`ContentEditMain`](/components/content/edit/ContentEditMain).
