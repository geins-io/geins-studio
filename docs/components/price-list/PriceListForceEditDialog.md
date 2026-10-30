# `PriceListForceEditDialog`

`PriceListForceEditDialog` asks before a user edits a read-only (ERP) price list anyway. It only confirms: the host unlocks the list on `confirm` and sends `force: 'true'` on its saves. See [pricing → Read-only lists and `force`](/domains/pricing).

## Features

- Default copy for the price list page: "Edit a read-only price list?" and a description saying changes last only until the next import
- `title` and `description` props replace the copy for another host (e.g. a company list)
- Regular confirm button ("Edit anyway"), not red: the override is a soft action
- Two-way `open` binding via `v-model:open`

## Usage

```vue
<script setup lang="ts">
const forceEditDialogOpen = ref(false);
const forceEdit = ref(false);
</script>

<template>
  <PriceListForceEditDialog
    v-model:open="forceEditDialogOpen"
    @confirm="forceEdit = true"
  />
  <ButtonIcon
    icon="SquarePen"
    variant="secondary"
    @click="forceEditDialogOpen = true"
  >
    {{ $t('edit_anyway') }}
  </ButtonIcon>
</template>
```

The price list page (`pricing/price-lists/[id].vue`) opens it from the summary's lock item, and passes the saved `readOnly` through `priceListForceOptions` (`#shared/utils/price-list`) to get `force` for its saves.

## Props

### `title`

```ts
title?: string
```

Replaces the default title (`pricing.price_list_force_edit_title`). Already translated.

### `description`

```ts
description?: string
```

Replaces the default description (`pricing.price_list_force_edit_description`). Already translated.

### `open`

```ts
open: boolean; // v-model:open
```

Whether the dialog is open. Both buttons close it.

## Events

### `confirm`

Emitted when the user clicks "Edit anyway".

## Dependencies

- shadcn-vue [`AlertDialog`](/components/shadcn-vue)
