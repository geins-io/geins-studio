# `FormInputDate`

`FormInputDate` is a date picker that renders the localized date inside a `Button` trigger and opens a `Calendar` in a popover. Stores the selected date as an ISO string.

## Features

- ISO-string model — `defineModel<string>()` writes `new Date(value).toISOString()`
- Locale-aware display via [`useDate`](/composables/useDate) (`formatDate`)
- Optional `minValue` to disable past dates (typed as `@internationalized/date` `DateValue`)
- Empty-state placeholder when no date is selected

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import { getLocalTimeZone, today } from '@internationalized/date';

const expirationDate = ref<string>();
</script>

<template>
  <FormInputDate
    v-model="expirationDate"
    :placeholder="$t('expiration_date')"
    :min-value="today(getLocalTimeZone())"
  />
</template>
```

## Props

### `placeholder`

```ts
placeholder?: string
```

Shown when no date is selected.

- **Default:** `'Pick a date'`

### `minValue`

```ts
minValue?: DateValue
```

Earliest selectable date (a `@internationalized/date` value — typically `today(getLocalTimeZone())`).

## v-model

### default

```ts
v-model: string
```

ISO 8601 date string. Empty string / `undefined` shows the placeholder.

## Dependencies

- shadcn-vue [`Popover`](/components/shadcn-vue), `Calendar`, [`Button`](/components/button/ButtonIcon)
- [`useDate`](/composables/useDate) — locale-aware formatting
- [`@internationalized/date`](https://react-spectrum.adobe.com/internationalized/date/index.html) — the `DateValue` type and helpers
