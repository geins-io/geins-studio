# `ChannelMailContentTab`

`ChannelMailContentTab` renders the mail types for a channel — grouped into Order / Customer / Product sections, each rendered as a stack of [`ChannelMailContentRow`](/components/channel/ChannelMailContentRow). Used inside the Mails tab.

## Features

- Three category groups in a fixed order: Order → Customer → Product (empty groups are skipped)
- Localized category headings via `channels.mail_category_<lower>` keys
- `Empty` state with a `Mail` icon when there are no mail types at all
- `loading` greys the section out and disables interactions

## Usage

```vue
<template>
  <ChannelMailContentTab
    :mail-types="channel.mailTypes"
    :loading="loading"
    @edit="onEdit"
    @update:active="onUpdateActive"
  />
</template>
```

## Props

### `mailTypes`

```ts
mailTypes: ChannelMailType[]
```

Full mail-type list — grouped by `category` internally.

### `loading`

```ts
loading?: boolean
```

Greys the section out and disables pointer events.

- **Default:** `false`

## Events

### `edit`

```ts
(mailType: ChannelMailType): void
```

### `update:active`

```ts
(payload: { _id: string; active: boolean }): void
```

## Dependencies

- [`ChannelMailContentRow`](/components/channel/ChannelMailContentRow), [`ContentCardHeader`](/components/content/ContentCardHeader)
- shadcn-vue `Empty`
