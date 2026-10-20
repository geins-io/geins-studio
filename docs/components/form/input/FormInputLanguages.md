# `FormInputLanguages`

`FormInputLanguages` is the multi-select language picker — a thin wrapper around [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) bound to the languages exposed by `useAccountStore`. It backs an asset's **content languages** (the languages an asset is intended for). For picking a single language, use [`FormInputLanguageSelect`](/components/form/input/FormInputLanguageSelect) instead.

## Features

- Auto-binds to `accountStore.languages` — no dataset prop needed
- Selected languages render as chips with the language name
- Each option shows the uppercase code (`SV`, `EN`) as a muted hint on the right. No flags: countries aren't languages
- A stored code the account doesn't have (written by another client — the backend treats values as free labels) still renders as a chip, using the uppercased code as its name. It never appears as an option
- Inherits all behaviour from [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) (search, multi-select, portaled dropdown). No custom values

## Usage

### Basic usage

```vue
<script setup lang="ts">
const languages = ref<string[]>(['sv']);
</script>

<template>
  <FormInputLanguages v-model="languages" />
</template>
```

### In a form

```vue
<FormField v-slot="{ value, handleChange }" name="languages" keep-value>
  <FormItem>
    <FormLabel :optional="true">{{ $t('content_language', 2) }}</FormLabel>
    <FormControl>
      <FormInputLanguages
        :model-value="value"
        @update:model-value="handleChange"
      />
    </FormControl>
    <FormMessage />
  </FormItem>
</FormField>
```

## Props

### `placeholder`

```ts
placeholder?: string
```

Override the default "Add languages…" placeholder.

- **Default:** `''`

## v-model

### default

```ts
v-model: string[]
```

Array of selected language codes — the account language `_id`s (ISO 639-1, e.g. `sv`, `en`).

## Dependencies

- [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) — base picker
- `useAccountStore` — source of `languages`
