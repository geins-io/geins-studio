# `FlagIcon`

`FlagIcon` is a circular flag + optional name display for a language id — derives the country code from the language id, then renders the flag via the `flagClass` utility. Used wherever channel languages are displayed (selects, tables, mail config sheet).

## Features

- Resolves country code from language id via `languageToCountryCode`
- Two sizes: `sm` (default, gap-2, 4.5 size, text-sm) and `md` (gap-2.5, 5 size, text-base)
- `name` is optional — omit to render just the flag

## Usage

```vue
<template>
  <FlagIcon language-id="en-GB" name="English" />
  <FlagIcon language-id="sv-SE" size="md" />
</template>
```

> [!NOTE]
> The component lives at `app/components/FlagIcon.vue` so its auto-import name is `FlagIcon`. The prop is still `languageId` (not `countryCode`) — the component resolves the country code internally.

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
