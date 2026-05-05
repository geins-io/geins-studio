# `LanguageIcon`

`LanguageIcon` is a circular flag + optional name display for a language id — derives the country code from the language id, then renders the flag via the `flagClass` utility. Used wherever channel languages are displayed (selects, tables, mail config sheet).

## Features

- Resolves country code from language id via `languageToCountryCode`
- Two sizes: `sm` (default, gap-2, 4.5 size, text-sm) and `md` (gap-2.5, 5 size, text-base)
- `name` is optional — omit to render just the flag

## Usage

```vue
<template>
  <ChannelLanguageIcon language-id="en-GB" name="English" />
  <ChannelLanguageIcon language-id="sv-SE" size="md" />
</template>
```

> [!NOTE]
> The component lives at `app/components/channel/LanguageIcon.vue` so its auto-import name is `ChannelLanguageIcon`.

## Props

### `languageId`

```ts
languageId: string
```

Language id (e.g. `'en-GB'`, `'sv-SE'`). The country code is derived for the flag image.

### `name`

```ts
name?: string
```

Optional label rendered next to the flag.

### `size`

```ts
size?: 'sm' | 'md'
```

- **Default:** `'sm'`

## Dependencies

- `flagClass` utility — Tailwind class for the flag background image
- `languageToCountryCode` utility — language id → country code
