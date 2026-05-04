# `FormInputCountrySelect`

`FormInputCountrySelect` is the standard country picker — wraps [`FormInputSelectSearch`](/components/form/input/FormInputSelectSearch) with the countries exposed by `useAccountStore`.

## Features

- Auto-binds to `accountStore.currentCountries` — no dataset prop needed
- Browser autocomplete bridge (`autocomplete="country"`) — autofill writes back through the model
- Inherits search and dropdown behaviour from [`FormInputSelectSearch`](/components/form/input/FormInputSelectSearch)

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const countryCode = ref<string>('SE');
</script>

<template>
  <FormInputCountrySelect v-model="countryCode" />
</template>
```

## Props

### `disableTeleport`

```ts
disableTeleport?: boolean
```

Render the dropdown inline. Use inside dialogs/sheets where the teleported portal misaligns.

- **Default:** `false`

## v-model

### default

```ts
v-model: string
```

Selected country `_id` (e.g. `'SE'`, `'NO'`).

## Dependencies

- [`FormInputSelectSearch`](/components/form/input/FormInputSelectSearch) — base picker
- `useAccountStore` — source of `currentCountries`
