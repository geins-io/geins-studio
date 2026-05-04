# `ContentAddressDisplay`

Read-only formatted display of an `AddressUpdate` object. Handles loading skeletons and gracefully renders a `–` when no address is set.

## Features

- Shows full name, company, street lines, zip/city, region, and country
- Resolves country code to human-readable name via `useAccountStore`
- Loading state renders three `Skeleton` placeholders
- `addressOnly` prop hides the person name and company rows

## Usage

### Basic Usage

```vue
<script setup lang="ts">
import type { AddressUpdate } from '#shared/types'

const address = ref<AddressUpdate | null>(null)
</script>

<template>
  <ContentAddressDisplay :address="address" />
</template>
```

### Loading state

```vue
<template>
  <ContentAddressDisplay :loading="true" />
</template>
```

## Props

### `address`

```ts
address?: AddressUpdate | null
```

- **Type:** `AddressUpdate | null`
- **Default:** `undefined`
- **Description:** The address to display. When `null` or `undefined`, renders `–`.

### `addressOnly`

```ts
addressOnly?: boolean
```

- **Type:** `boolean`
- **Default:** `false`
- **Description:** When `true`, hides the person name and company rows; only shows street/city/country.

### `loading`

```ts
loading?: boolean
```

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Renders skeleton placeholders while data is being fetched.

## Type Definitions

```ts
interface AddressUpdate {
  firstName?: string
  lastName?: string
  company?: string
  addressLine1?: string
  addressLine2?: string
  zip?: string
  city?: string
  region?: string
  country?: string
  email?: string
  phone?: string
}
```

## Dependencies

- `useAccountStore` — resolves country ID to display name
- shadcn-vue [`Skeleton`](/components/shadcn-vue) — loading placeholder
