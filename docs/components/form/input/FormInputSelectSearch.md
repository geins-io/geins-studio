# `FormInputSelectSearch`

`FormInputSelectSearch` is the base single-value combobox: a button trigger that opens a portaled list with a search input. Most other "select X" inputs ([`FormInputCountrySelect`](/components/form/input/FormInputCountrySelect), [`FormInputLanguageSelect`](/components/form/input/FormInputLanguageSelect), [`FormInputMarketSelect`](/components/form/input/FormInputMarketSelect)) wrap this one with a domain-specific dataset.

## Features

- Portaled dropdown via reka-ui `ComboboxPortal` — escapes parent overflow/clip issues
- Optional `disableTeleport` switches to inline `position`, useful inside dialogs/sheets
- Built-in search filter, empty state, "select…" placeholder via i18n
- Hidden autocomplete-bridge `<input>` so browser autofill still hits the model
- `string` model bound via `defineModel<string>()`

## Usage

### Basic Usage

```vue
<script setup lang="ts">
const country = ref<string>('SE');
const dataSet: PlainDataItem[] = [
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
];
</script>

<template>
  <FormInputSelectSearch
    v-model="country"
    :data-set="dataSet"
    entity-name="country"
    autocomplete="country"
  />
</template>
```

## Props

### `dataSet`

```ts
dataSet: PlainDataItem[]
```

Selectable items with `{ value, label }` shape.

### `entityName`

```ts
entityName?: string
```

i18n key for the entity — used in the placeholder, search placeholder, and empty state.

### `autocomplete`

```ts
autocomplete?: string
```

When set, renders a hidden bridge input with this `autocomplete` attribute so browser autofill still updates the model (e.g. `'country'`, `'organization'`).

### `disableTeleport`

```ts
disableTeleport?: boolean
```

Render the dropdown inline instead of portaled to `body`. Use inside dialogs or sheets where teleport breaks layout.

- **Default:** `false`

## v-model

### default

```ts
v-model: string
```

The selected value (matches one of `dataSet[i].value`).

## Type Definitions

```ts
interface PlainDataItem {
  value: string;
  label: string;
}
```

## Dependencies

- reka-ui `Combobox`, `ComboboxPortal`, `ComboboxList`, `ComboboxInput`, `ComboboxGroup`, `ComboboxItem`
- Used as the base by [`FormInputCountrySelect`](/components/form/input/FormInputCountrySelect)
