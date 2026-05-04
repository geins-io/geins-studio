# `FormInputFont`

`FormInputFont` is the font picker for storefront theming — a searchable combobox of `storefrontFonts` that previews each option in its own typeface.

## Features

- Live font preview: each option renders in its own font-family with a CSS fallback
- Lazy-loads the storefront fonts stylesheet via `useHead` on mount
- Searchable list with inline custom focus/blur handling for portaled dropdowns
- `string` model bound to `StorefrontFont.value`

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

The selected font value (matches `StorefrontFont.value`). Empty string when none selected.

## Type Definitions

```ts
interface StorefrontFont {
  label: string;
  value: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'display' | string;
}
```

Exported from `@/utils/storefrontFonts`.

## Dependencies

- reka-ui `Combobox`, `ComboboxPortal`
- `storefrontFonts`, `storefrontFontsCssUrl`, `fontFallback` from `@/utils/storefrontFonts`
- `useHead` to lazy-load the preview stylesheet
