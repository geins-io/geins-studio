# `ContentAddressForm`

VeeValidate-integrated address form block that renders all standard address fields in a responsive grid. Designed to be embedded inside an existing VeeValidate `<Form>` context.

## Features

- Renders `addressLine1/2`, `zip`, `city`, `country`, `region`, `firstName`, `lastName`, `email`, `phone`
- Supports a `formInputPrefix` for nested field paths (e.g. `'billing'` → field name `'billing.addressLine1'`)
- `addressType` is forwarded to HTML `autocomplete` attributes for browser autofill
- Country field uses [`FormInputCountrySelect`](/components/form/input/FormInputCountrySelect)
- Optional `disableTeleport` for country select (use when inside a `Sheet`)

## Usage

### Basic Usage

```vue
<script setup lang="ts">
// Assumes a VeeValidate Form with a matching Zod schema
</script>

<template>
  <Form>
    <ContentAddressForm address-type="shipping" />
  </Form>
</template>
```

### Nested field path

```vue
<template>
  <Form>
    <!-- Fields will be named billing.addressLine1, billing.zip, etc. -->
    <ContentAddressForm
      address-type="billing"
      form-input-prefix="billing"
    />
  </Form>
</template>
```

## Props

### `addressType`

```ts
addressType?: AddressType
```

- **Type:** `AddressType` (`'billing' | 'shipping'`)
- **Default:** `undefined`
- **Description:** Used as a prefix in HTML `autocomplete` attributes and as part of the field path when no `formInputPrefix` is given.

### `formInputPrefix`

```ts
formInputPrefix?: string
```

- **Type:** `string`
- **Default:** `undefined`
- **Description:** Dot-notation prefix prepended to all field names (e.g. `'customer'` → `'customer.shipping.addressLine1'`).

### `disableTeleport`

```ts
disableTeleport?: boolean
```

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Disables portal teleportation on the country select dropdown. Set to `true` when this form is inside a `Sheet` or `Dialog` to prevent z-index stacking issues.

## Dependencies

- [`FormGrid`](/components/form/FormGrid), [`FormGridWrap`](/components/form/FormGridWrap)
- [`FormInputCountrySelect`](/components/form/input/FormInputCountrySelect)
- [`ContentCardHeader`](/components/content/ContentCardHeader) — contact person sub-section heading
- shadcn-vue [`Input`](/components/shadcn-vue), VeeValidate `FormField` / `FormItem`
