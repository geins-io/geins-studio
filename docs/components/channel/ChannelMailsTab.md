# `ChannelMailsTab`

`ChannelMailsTab` is the top-level **Mails** card on a channel's edit page — wraps a tabbed UI ([`ChannelMailGeneralTab`](/components/channel/ChannelMailGeneralTab), [`ChannelMailContentTab`](/components/channel/ChannelMailContentTab), [`ChannelMailLayoutTab`](/components/channel/ChannelMailLayoutTab)) and the [`ChannelMailConfigSheet`](/components/channel/ChannelMailConfigSheet) editor invoked from a content row.

## Features

- Three sub-tabs inside a [`ContentEditCard`](/components/content/edit/ContentEditCard): General, Mail content, Layout
- Reads `mail.disabled` from the parent VeeValidate form via `useFieldValue` — when the master toggle is on:
  - The Mail content + Layout tabs are disabled
  - If the user is on a now-disabled tab, snaps them back to General
- General tab uses `force-mount` + `data-[state=inactive]:hidden` so VeeValidate fields never unmount when the user switches tabs
- Hosts the [`ChannelMailConfigSheet`](/components/channel/ChannelMailConfigSheet) — opens when a row's Edit button is clicked
- Forwards mail-type active toggles up via `update:mail-type-active`; emits `mail-saved` after the sheet saves

## Usage

```vue
<template>
  <ChannelMailsTab
    v-model:layout-fields="channel.mailLayout"
    v-model:layout-files="layoutFiles"
    :mail-types="channel.mailTypes"
    :loading="loading"
    :channel-id="channel._id"
    :languages="channel.languages"
    :default-language="channel.defaultLanguage"
    :storefront-url="channel.storefrontUrl"
    :mail-from-email="channel.mailFromEmail"
    @mail-saved="refetchMailTypes"
    @update:mail-type-active="onMailTypeActive"
  />
</template>
```

## Props

### `mailTypes`

```ts
mailTypes: ChannelMailType[]
```

### `loading`

```ts
loading?: boolean
```

Forwarded to the Mail content tab.

- **Default:** `false`

### `channelId`

```ts
channelId: string
```

### `languages`

```ts
languages: Language[]
```

### `defaultLanguage`

```ts
defaultLanguage: string
```

### `storefrontUrl`

```ts
storefrontUrl?: string
```

Forwarded to the General tab for URL-slug field addons.

### `mailFromEmail`

```ts
mailFromEmail?: string
```

Forwarded to the General tab's locked from-email field.

## v-model

### `layoutFields`

```ts
v-model:layout-fields: Partial<ChannelMailSettings>
```

The layout settings object — required by the Layout tab.

### `layoutFiles`

```ts
v-model:layout-files: MailLayoutStagedFiles
```

Staged file uploads for logo / header image.

- **Default:** `{}`

## Events

### `mail-saved`

Emitted after the config sheet saves successfully.

### `update:mail-type-active`

```ts
(payload: { _id: string; active: boolean }): void
```

Bubbled from each row's active toggle.

## Dependencies

- shadcn-vue [`Tabs`](/components/shadcn-vue), `TabsList`, `TabsTrigger`, `TabsContent`
- [`ContentEditCard`](/components/content/edit/ContentEditCard)
- [`ChannelMailGeneralTab`](/components/channel/ChannelMailGeneralTab), [`ChannelMailContentTab`](/components/channel/ChannelMailContentTab), [`ChannelMailLayoutTab`](/components/channel/ChannelMailLayoutTab), [`ChannelMailConfigSheet`](/components/channel/ChannelMailConfigSheet)
- vee-validate `useFieldValue` — reads `mail.disabled` from parent form
