# `CompanyPriceListEditor`

`CompanyPriceListEditor` edits a company's own (Studio-managed) price list: global rules, product selection and the company price grid. An ERP-managed (`readOnly`) list opens in it read-only. It hosts a [`usePriceListEditor`](/composables/usePriceListEditor) instance and renders it with [`PriceListEditor`](/components/price-list/PriceListEditor). The company page shows it in a sub view of the Pricing tab, and "Save company" saves what it edits.

It's the per-list unit: a page that offers several company lists (one per channel and currency) renders one per list, each with its own `listKey`.

## Features

- **A header for the list:** its name, channel · currency, and the manual and volume price counts (`fields: ['counts']`, left out while the API has none or the read fails). A draft takes its name, channel and currency from `seed`.
- **Read-only lists.** For a `readOnly` (ERP) list, `usePriceListEditor` runs read-only: the saved rows load through `query`, the controls are disabled and the volume pricing panel is view only. The header adds the lock ("Managed externally…"), and the inactive notice when the list is inactive.
- **Its own draft and editor.** A new list starts from `seed`, the create body without content; an existing one loads its rules and selection on mount (`fields: ['rules', 'selectionquery']`), since `CustomerPriceList` leaves them out.
- **New lists preview too.** Without an id, the preview posts the draft to `POST product/pricelist/preview`, and volume pricing works out prices locally.
- **The grid says "Company price"** (`pricing.company_price`) and uses the list's currency.
- **`v-model:content` and `v-model:dirty`.** The host reads the edited `PriceListContent` for its save body and counts `dirty` as an unsaved change. Dirty compares against a baseline captured after the first preview (via `usePanelDirty`), so loading never reads as an edit.
- **`afterSave(saved)`** re-seeds from the saved list (new rule `_id`s, the list id after a create), previews to rebuild its rows, captures a new baseline and refreshes the header counts.
- **Load errors.** If the rules and selection fail to load, it shows an error state with a retry, never an empty editor whose save would replace the list's content. A skeleton shows while they load.

## Usage

```vue
<script setup lang="ts">
const editor = useTemplateRef('editor');
const content = ref<PriceListContent>();
const dirty = ref(false);

const seed = computed(() =>
  companyPriceListCreateBody({
    companyId,
    companyName,
    externalId,
    channel,
    currency,
  }),
);

const save = async () => {
  const saved = await productApi.priceList.update(
    priceList._id,
    companyPriceListUpdateBody(
      priceList,
      true,
      dirty.value ? content.value : undefined,
    ),
    { fields: ['rules', 'selectionquery'] },
  );
  await editor.value?.afterSave(saved);
};
</script>

<template>
  <CompanyPriceListEditor
    ref="editor"
    v-model:content="content"
    v-model:dirty="dirty"
    :list-key="priceList._id"
    :price-list="priceList"
    :seed="seed"
  />
</template>
```

## Props

### `listKey`

```ts
listKey: string;
```

The list's entry key: its `_id`, or a draft's key that stays the same after "Save company" creates it. It keys the editor's data, so two drafts never share a load. Read once, on mount.

### `priceList`

```ts
priceList?: CustomerPriceList;
```

The company's own list. It's missing until "Save company" creates it. Its id is read once, on mount; after a save, `afterSave` carries the new id. Its `readOnly` flag switches the editor to read-only, and its name, channel, currency and `active` feed the header.

### `seed`

```ts
seed: ProductPriceListCreate;
```

The create body of a new list, from `companyPriceListCreateBody` without `content`. It gives a new list's draft its channel, currency and VAT setting for previews.

## Models

### `content`

```ts
content: PriceListContent;
```

The edited `rules`, `productSelectionQuery` and `products`, for `companyPriceListCreateBody` / `companyPriceListUpdateBody`.

### `dirty`

```ts
dirty: boolean;
```

`true` once the content differs from the last baseline: on load, or after `afterSave`.

## Exposed

### `afterSave`

```ts
afterSave: (saved: ProductPriceList) => Promise<void>;
```

Call it after the list saves, with the response (request `fields: ['rules', 'selectionquery']`). Saving mutes the selection watcher while it re-seeds.

### `refreshCounts`

```ts
refreshCounts: () => Promise<void>;
```

Re-reads the header's manual and volume price counts. `afterSave` already calls it; call it after any other change to the list's prices.

## Notes

- Mount it lazily and keep it mounted (`v-if` once opened, then `v-show`), so edits survive going back to the Pricing cards.
- Consumers: `app/pages/customers/companies/[id].vue` (Pricing tab sub view).
