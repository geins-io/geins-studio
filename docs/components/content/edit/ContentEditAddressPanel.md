# `ContentEditAddressPanel`

`ContentEditAddressPanel` is the sheet for editing a billing or shipping address on a customer or quotation. Renders [`ContentAddressForm`](/components/content/ContentAddressForm) inside a sheet with delete (shipping only) and save actions.

## Features

- Sheet wrapping a full address form (vee-validate + zod, all required fields enforced)
- Validation triggered on demand on first save attempt; debounced revalidation after that
- Shipping addresses get a destructive delete block when they have content (`addressLine1` + `zip`)
- Adapts the entity name (`billing_address` / `shipping_address`) for headings and toasts

## Usage

```vue
<script setup lang="ts">
const onSave = (address: AddressUpdate) => updateAddress(address);
const onDelete = (id: string) => removeAddress(id);
</script>

<template>
  <ContentEditAddressPanel :address="billingAddress" @save="onSave" @delete="onDelete">
    <Button variant="outline">{{ $t('edit') }}</Button>
  </ContentEditAddressPanel>
</template>
```

## Props

### `address`

```ts
address: AddressUpdate
```

The address to edit. `addressType` drives whether the delete block is shown.

## Events

### `save`

```ts
(address: AddressUpdate): void
```

Emitted with the merged address after a successful validation. Parent owns the API call.

### `delete`

```ts
(id: string): void
```

Emitted from the destructive button. Falls back to `'new'` when the address has no `_id` yet.

## Slots

### default

The `SheetTrigger` content.

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Button`
- [`ContentAddressForm`](/components/content/ContentAddressForm) — the actual fields
- [`ContentCardHeader`](/components/content/ContentCardHeader) — delete block heading
- vee-validate + zod
