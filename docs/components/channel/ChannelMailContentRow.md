# `ChannelMailContentRow`

`ChannelMailContentRow` is one row in [`ChannelMailContentTab`](/components/channel/ChannelMailContentTab) — icon (semantic per mail type) + name + description, an "Overridden" badge when custom texts exist, an active toggle, and an Edit button.

## Features

- Maps each mail type `_id` to a Lucide icon (e.g. `orderConfirmation` → `MailPlus`, `customerPasswordReset` → `KeyRound`); falls back to `Mail`
- Header dims when the mail type is inactive
- "Overridden" warning badge surfaces when `mailType.hasOverrides`
- `update:active` event for toggling on/off
- `edit` event opens [`ChannelMailConfigSheet`](/components/channel/ChannelMailConfigSheet)

## Usage

```vue
<template>
  <ChannelMailContentRow
    v-for="mailType in mailTypes"
    :key="mailType._id"
    :mail-type="mailType"
    @update:active="onUpdateActive"
    @edit="onEdit"
  />
</template>
```

## Props

### `mailType`

```ts
mailType: ChannelMailType
```

The mail type to render.

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

- shadcn-vue `Switch`, `Button`, `Badge`
- [`ContentCardHeader`](/components/content/ContentCardHeader)
