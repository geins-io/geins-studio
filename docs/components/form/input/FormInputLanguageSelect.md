# `FormInputLanguageSelect`

`FormInputLanguageSelect` is a single-value language picker — a combobox over a `Language[]` dataset with optional flag rendering via `ChannelLanguageIcon`.

## Features

- Searchable combobox with portaled dropdown
- Optional flag display (`showFlags`) — renders `ChannelLanguageIcon` next to each option
- Caller-supplied dataset (no implicit account-store binding — use the appropriate language list for your context)
- `disableTeleport` escape hatch for dialogs/sheets

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import type { Language } from '#shared/types';

const languageId = ref<string>();
const languages: Language[] = await fetchLanguages();
</script>

<template>
  <FormInputLanguageSelect
    v-model="languageId"
    :data-set="languages"
    show-flags
  />
</template>
```

## Props

### `dataSet`

```ts
dataSet?: Language[]
```

Languages to choose from.

- **Default:** `[]`

### `disableTeleport`

```ts
disableTeleport?: boolean
```

Render the dropdown inline.

- **Default:** `false`

### `showFlags`

```ts
showFlags?: boolean
```

Render the flag icon next to each option (and the selected value).

- **Default:** `false`

## v-model

### default

```ts
v-model: string
```

Selected language `_id`.

## Dependencies

- reka-ui `Combobox`, `ComboboxPortal`
- `ChannelLanguageIcon` (used when `showFlags` is on)
