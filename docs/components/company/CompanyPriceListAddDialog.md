# `CompanyPriceListAddDialog`

`CompanyPriceListAddDialog` picks the channel and currency of a new company price list, and optionally a shared list to start from. It creates nothing: on Continue it emits the slot (and the source's id), and the company page adds an unsaved draft to [`useCompanyPriceLists`](/composables/useCompanyPriceLists) and opens its sub view. "Save company" creates the list.

## Features

- **Free slots only.** An account owns at most one list per channel and currency, so the dialog offers only the `slots` it's given — the page builds them with `getFreeCompanyPriceListSlots` from the company's **saved** channels, with saved lists (ERP and Studio-managed) and drafts counted as taken. Channels show by name (`accountStore.getChannelNameById`).
- **Currency follows the channel.** Each open preselects the first free slot; picking another channel keeps the currency if it's free there and otherwise takes that channel's first free one.
- **Start from.** Below channel and currency, "Start from" offers "Empty list" (the default) and the `sources` in the chosen slot (same channel and currency). Changing the channel or currency, or opening the dialog again, resets it to "Empty list". The dialog doesn't fetch: the page passes the shared lists it already loads (`GET product/pricelist/list`, which never returns account lists).
- **Loading and errors.** The host loads the chosen source on Continue: with `loading`, Continue shows a spinner and the fields are disabled; with `error`, an inline error shows and the dialog stays open (the source's reads show no toast).
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
const loading = ref(false);
const error = ref(false);
const add = async (
  slot: { channel: string; currency: string },
  sourceId?: string,
) => {
  error.value = false;
  loading.value = !!sourceId;
  try {
    const start = sourceId ? await loadSource(sourceId) : undefined;
    open.value = false;
    openCompanyPriceList(addDraft(slot, start));
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Button :disabled="!slots.length" @click="open = true">
    {{ $t('add_entity', { entityKey: 'company_price_list' }) }}
  </Button>
  <CompanyPriceListAddDialog
    v-model:open="open"
    :slots="slots"
    :sources="allPriceLists"
    :external-id="company.externalId"
    :loading="loading"
    :error="error"
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

### `sources`

```ts
sources?: CustomerPriceList[]; // default []
```

The shared lists a new list can start from. Only those whose `channel` and `currency` match the chosen slot are offered.

### `loading`

```ts
loading?: boolean;
```

The chosen source is loading: Continue shows a spinner and the fields are disabled.

### `error`

```ts
error?: boolean;
```

The chosen source failed to load: shows an inline error above the buttons.

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
(slot: { channel: string; currency: string }, sourceId?: string): void;
```

The picked slot and, unless "Empty list" is picked, the source list's `_id`, on Continue. The dialog doesn't close itself: the host closes it once the draft is added, and keeps it open (with `error`) if the source fails to load.
