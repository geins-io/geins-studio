# `CompanyBuyerPanel`

`CompanyBuyerPanel` is the sheet used to add or edit a B2B buyer attached to a customer company — handles email-driven existing-customer detection, pricelist assignment, and the optional restriction to dedicated price lists.

## Features

- Two modes (`add` and `edit`) — same form, different submit semantics
- Debounced email lookup (`customerApi.customer.get`) detects when the email already belongs to an existing customer; when so, surfaces an info banner with an "assign + update" toggle
- Optional pricelist assignment via [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch), with a follow-up "restrict to dedicated price lists" toggle
- Edit mode adds a destructive remove block that calls `customerApi.company.id(companyId).buyer.delete`
- Owns its toast feedback via [`useToast`](/components/shadcn-vue) — emits `added` / `removed` so the parent can refetch

## Usage

```vue
<script setup lang="ts">
const open = ref(false);
const buyer = ref<CompanyBuyerUpdate | undefined>();

const onAdded = () => refetchBuyers();
const onRemoved = () => refetchBuyers();
</script>

<template>
  <CompanyBuyerPanel
    v-model:open="open"
    :company-id="company._id"
    :company-name="company.name"
    :price-lists="priceLists"
    mode="add"
    @added="onAdded"
    @removed="onRemoved"
  >
    <Button variant="outline">{{ $t('add_entity', { entityName: 'buyer' }) }}</Button>
  </CompanyBuyerPanel>
</template>
```

## Props

### `companyId`

```ts
companyId: string
```

Company `_id` the buyer is attached to.

### `companyName`

```ts
companyName: string
```

Used in the "assign existing customer" banner copy.

### `priceLists`

```ts
priceLists: CustomerPriceList[]
```

Pricelists available for assignment.

### `buyer`

```ts
buyer?: CompanyBuyerUpdate
```

Existing buyer to edit. Required when `mode` is `'edit'`.

### `mode`

```ts
mode?: 'edit' | 'add'
```

- **Default:** `'add'`

## v-model

### `open`

```ts
v-model:open: boolean
```

Sheet visibility.

## Events

### `added`

Emitted after a successful create or assign-and-update.

### `removed`

Emitted after a successful delete (edit mode only).

## Slots

### default

The `SheetTrigger` content (typically a button).

## Dependencies

- shadcn-vue [`Sheet`](/components/shadcn-vue), `Form`, `Input`, `Button`
- [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) — pricelist multi-select
- [`FormItemSwitch`](/components/form/item/FormItemSwitch), [`ContentSwitch`](/components/content/ContentSwitch), [`ContentCardHeader`](/components/content/ContentCardHeader)
- [`Feedback`](/components/feedback/Feedback) — existing-customer banner
- [`useGeinsRepository`](/composables/useGeinsRepository) (`customerApi.company.buyer`, `customerApi.customer`)
