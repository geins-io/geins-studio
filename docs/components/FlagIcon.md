# `FlagIcon`

`FlagIcon` is a circular country flag + optional name display. Generic — takes an ISO 3166-1 alpha-2 country code (e.g. `gb`, `se`, `de`) and renders the flag via the `flagClass` utility. Used wherever a flag indicator is shown: language selects, market selects, mail config sheet, etc.

## Features

- Country-code-based — pass the code directly, no internal mapping
- Two sizes: `sm` (default, gap-2, 4.5 size, text-sm) and `md` (gap-2.5, 5 size, text-base)
- `name` is optional — omit to render just the bare flag div (no `<span>` wrapper)

## Usage

```vue
<template>
  <!-- bare flag -->
  <FlagIcon country-code="se" />

  <!-- with label -->
  <FlagIcon country-code="gb" name="United Kingdom" />

  <!-- from a language code, use the helper -->
  <FlagIcon
    :country-code="languageToCountryCode('sv')"
    name="Swedish"
    size="md"
  />
</template>
```

> [!NOTE]
> For language-shaped data, call the auto-imported `languageToCountryCode(langCode)` helper before passing the result into `FlagIcon`. Keeps the component domain-agnostic.

## Props

### `countryCode`

```ts
countryCode: string;
```

ISO 3166-1 alpha-2 country code. Case-insensitive — the `flagClass` utility lower-cases internally.

### `name`

```ts
name?: string
```

Optional label rendered next to the flag. When omitted, the component renders the bare flag div (no wrapping `<span>`).

### `size`

```ts
size?: 'sm' | 'md'
```

- **Default:** `'sm'`

## Dependencies

- `flagClass` utility — Tailwind class for the flag background image
