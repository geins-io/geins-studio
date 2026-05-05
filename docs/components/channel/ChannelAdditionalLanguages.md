# `ChannelAdditionalLanguages`

`ChannelAdditionalLanguages` is the section inside a channel's edit page that manages every language **except** the default — heading + Add button, a minimal-mode [`TableView`](/components/table/TableView) with active toggles + delete actions, and the supporting Add/Remove dialogs.

## Features

- Filters the default language out of the table (managed separately on the channel)
- Inline active toggle per row — emits `update` so the parent can persist
- Delete action opens an `AlertDialog` confirmation; confirms emit `remove`
- Add dialog uses [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) over the languages not yet assigned, with [`ChannelLanguageIcon`](/components/channel/LanguageIcon) flags
- Empty state with a `Languages` icon when there are no additional languages

## Usage

```vue
<template>
  <ChannelAdditionalLanguages
    :all-languages="allLanguages"
    :channel-languages="channel.languages"
    :default-language-id="channel.defaultLanguage"
    @add="(langs) => addLanguages(langs)"
    @update="(lang) => updateLanguage(lang)"
    @remove="(id) => removeLanguage(id)"
  />
</template>
```

## Props

### `allLanguages`

```ts
allLanguages: Language[]
```

Full language list — drives the Add dialog options.

### `channelLanguages`

```ts
channelLanguages: ChannelLanguageAssignment[]
```

Languages already assigned to the channel.

### `defaultLanguageId`

```ts
defaultLanguageId: string
```

Used to filter out the default from the additional table.

## Events

### `add`

```ts
(languages: ChannelLanguageAssignment[]): void
```

Emitted with new `{ _id, active: true }` entries from the Add dialog.

### `update`

```ts
(language: ChannelLanguageAssignment): void
```

Emitted when a row's active toggle flips.

### `remove`

```ts
(languageId: string): void
```

Emitted after the user confirms the remove dialog.

## Dependencies

- shadcn-vue `Item`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `Button`, [`Dialog`](/components/shadcn-vue), [`AlertDialog`](/components/shadcn-vue)
- [`TableView`](/components/table/TableView) (in `Minimal` mode), [`useColumns`](/composables/useColumns)
- [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch), `ChannelLanguageIcon`
- `languageToCountryCode` utility
