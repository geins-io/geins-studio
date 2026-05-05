# `ContentEditMainContent`

`ContentEditMainContent` is a flex-column wrapper for the stack of [`ContentEditCard`](/components/content/edit/ContentEditCard) instances inside [`ContentEditMain`](/components/content/edit/ContentEditMain) — adds `gap-4` between cards.

## Features

- `flex flex-col gap-4` — nothing more
- Slot-only

## Usage

```vue
<template>
  <ContentEditMain>
    <ContentEditMainContent>
      <ContentEditCard :title="$t('general')"><!-- ... --></ContentEditCard>
      <ContentEditCard :title="$t('settings')"><!-- ... --></ContentEditCard>
    </ContentEditMainContent>
  </ContentEditMain>
</template>
```

## Slots

### default

The cards or other main-column content.
