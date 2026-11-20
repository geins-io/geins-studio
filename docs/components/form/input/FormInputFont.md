# `FormInputFont`

`FormInputFont` is the font picker for storefront theming — a searchable combobox that offers the curated `storefrontFonts` as suggestions and searches the full Google Fonts catalogue, previewing each option in its own typeface.

## Features

- **Suggestions**: the curated `storefrontFonts`, always listed (filtered while searching)
- **All Google Fonts**: while the user types, up to 30 matches from the full catalogue (~2,000 families), best match first — name prefix, then word start, then any match, each in popularity order
- The catalogue (`app/assets/google-fonts.json`) loads on demand — on first open, or on mount when the stored value isn't curated — so it stays out of the main bundle
- Live font preview: each option renders in its own font-family with a CSS fallback. Curated previews load on mount; search results and a non-curated selection add a `&text=` subset stylesheet per batch of new families (never swapped out, so on-screen previews don't flicker)
- A stored family that's in neither list still shows by name, in the fallback face
- Inline custom focus/blur handling for the portaled dropdown
- `string` model bound to `StorefrontFont.value` — a searched font is stored exactly like a curated one: by family name

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const headingFont = ref<string>('Inter');
</script>

<template>
  <FormInputFont v-model="headingFont" />
</template>
```

## v-model

### default

```ts
v-model: string
```

The selected font family (matches `StorefrontFont.value`). Empty string when none selected.

## Catalogue snapshot

The full catalogue is a bundled snapshot, not a live API call — no API key, and no Content Security Policy origins beyond the Google Fonts CSS and font hosts the previews already use. Fonts Google adds later show up once the snapshot is refreshed:

```bash
pnpm fonts:update
```

`scripts/update-google-fonts.mjs` reads the keyless metadata feed behind fonts.google.com and rewrites `app/assets/google-fonts.json` (`{ family, category }` per line, most popular first). It leaves out the few families without a regular (400) face — a bare `css2?family=…` URL answers `400 Bad Request` for them. A test checks that every curated font is in the snapshot.

## Type Definitions

```ts
type FontCategory =
  | 'sans-serif'
  | 'serif'
  | 'display'
  | 'handwriting'
  | 'monospace';

interface StorefrontFont {
  label: string;
  value: string;
  category: FontCategory;
}
```

Exported from `@/utils/storefrontFonts`, with the helpers below.

| Helper                       | Purpose                                                                     |
| ---------------------------- | --------------------------------------------------------------------------- |
| `loadGoogleFonts()`          | Lazily imports the catalogue snapshot once and maps it to `StorefrontFont`s |
| `searchFonts(fonts, q, max)` | Ranked name search (prefix → word start → contains)                         |
| `fontPreviewCssUrl(names)`   | One Google Fonts CSS URL with a name-preview subset of each family          |
| `fontToGoogleUrl(name)`      | Full Google Fonts CSS URL for a family (`null` when blank)                  |
| `fontFallback(category)`     | CSS generic family for a category (`handwriting` → `cursive`)               |

## Dependencies

- reka-ui `Combobox` (with `ignore-filter` — the component filters itself), `ComboboxPortal`
- `@vueuse/core` `refDebounced` for the catalogue search
- `useHead` to load the preview stylesheets
