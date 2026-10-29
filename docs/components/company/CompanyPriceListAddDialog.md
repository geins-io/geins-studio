# `CompanyPriceListAddDialog`

`CompanyPriceListAddDialog` picks the channel and currency of a new company price list. It creates nothing: on Continue it emits the slot, and the company page adds an unsaved draft to [`useCompanyPriceLists`](/composables/useCompanyPriceLists) and opens its sub view. "Save company" creates the list.

## Features

- **Free slots only.** An account owns at most one list per channel and currency, so the dialog offers only the `slots` it's given — the page builds them with `getFreeCompanyPriceListSlots` from the company's **saved** channels, with saved lists (ERP and Studio-managed) and drafts counted as taken. Channels show by name (`accountStore.getChannelNameById`).
- **Currency follows the channel.** Each open preselects the first free slot; picking another channel keeps the currency if it's free there and otherwise takes that channel's first free one.
- **External-system warning.** With an `externalId`, the company's next import may take over a Studio-created list, so the dialog shows the same warning as the card (never blocking).
- **Continue** is disabled until both a channel and a currency are picked.

## Usage

```vue
<script setup lang="ts">
const open = ref(false);
const slots = computed(() =>
  getFreeCompanyPriceListSlots(
    company.value.channels ?? [],
    (channel) => accountStore.getCurrenciesByChannelId(channel),
    entries.value,
  ),
);
const add = (slot: { channel: string; currency: string }) => {
  openCompanyPriceList(addDraft(slot));
};
</script>

<template>
  <Button :disabled="!slots.length" @click="open = true">
    {{ $t('add_entity', { entityKey: 'company_price_list' }) }}
  </Button>
  <CompanyPriceListAddDialog
    v-model:open="open"
    :slots="slots"
    :external-id="company.externalId"
    @add="add"
  />
</template>
```

## Props

### `open`

```ts
open: boolean;
```

Whether the dialog shows. Use with `v-model:open`.

### `slots`

```ts
slots: FreeCompanyPriceListSlot[]; // { channel: string; currency: string[] }[]
```

The free channel and currency slots, from `getFreeCompanyPriceListSlots` (`#shared/utils/price-list`). Disable the button that opens the dialog when it's empty.

### `externalId`

```ts
externalId?: string;
```

The company's external id; when set (not blank), the external-system warning shows.

## Events

### `update:open`

```ts
(value: boolean): void;
```

### `add`

```ts
(slot: { channel: string; currency: string }): void;
```

The picked slot, on Continue. The dialog closes itself.
