# `ChannelMailConfigSheet`

`ChannelMailConfigSheet` is the per-mail-type editor — a sheet with an **Edit** tab (per-language overridable text fields with template-variable hints) and a **Preview** tab (live HTML rendered in a sandboxed iframe). Owns its own data fetching against `accountApi.channel.mail`.

## Features

- Tabs: Edit (text overrides) + Preview (live HTML iframe, lazy-loaded)
- Language picker via [`FormInputLanguageSelect`](/components/form/input/FormInputLanguageSelect) with flags
- Each text field shows an "Overridden" badge when a custom value is set, plus inline `{variable}` hints under the textarea
- Sends only the changed text fields to `accountApi.channel.mail.updateTexts` (not the full set)
- Restore-defaults button visible when any field is overridden — submits empty strings for every override and reloads
- Preview is lazy: fetched the first time the user opens the tab; reloaded after a save or a language change while visible
- Surfaces save / load errors via toast + `usePageError().showErrorToast`

## Usage

This is mounted inside [`ChannelMailsTab`](/components/channel/ChannelMailsTab) and opened by clicking the Edit button on a [`ChannelMailContentRow`](/components/channel/ChannelMailContentRow). Direct usage is rare:

```vue
<template>
  <ChannelMailConfigSheet
    v-model:open="open"
    :channel-id="channel._id"
    :mail-type="activeMailType"
    :languages="channel.languages"
    :default-language="channel.defaultLanguage"
    @saved="refetchMailTypes"
  />
</template>
```

## Props

### `channelId`

```ts
channelId: string
```

### `mailType`

```ts
mailType: ChannelMailType | null
```

Which mail type is being configured. `null` keeps the sheet idle.

### `languages`

```ts
languages: Language[]
```

Languages available for the language picker.

### `defaultLanguage`

```ts
defaultLanguage: string
```

Pre-selected language when the sheet opens.

## v-model

### `open`

```ts
v-model:open: boolean
```

Sheet visibility. **Required.**

## Events

### `saved`

Emitted after a successful save (or restore-defaults). Parent typically refetches the mail-type list.

### `update:open`

Standard `defineModel` companion.

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), [`Tabs`](/components/shadcn-vue), `Textarea`, `Label`, `Badge`, `Skeleton`, `Empty`, `Button`
- [`FormInputLanguageSelect`](/components/form/input/FormInputLanguageSelect), [`FormInputDescription`](/components/form/input/FormInputDescription), [`Feedback`](/components/feedback/Feedback), [`ButtonIcon`](/components/button/ButtonIcon)
- [`useGeinsRepository`](/composables/useGeinsRepository) — `accountApi.channel.id(...).mail`
- [`usePageError`](/composables/usePageError), `useToast`
- `prettifyLangKey` utility
