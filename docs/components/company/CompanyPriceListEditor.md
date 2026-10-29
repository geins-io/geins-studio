# `CompanyPriceListEditor`

`CompanyPriceListEditor` edits a company's own (Studio-managed) price list: global rules, product selection and the company price grid. It hosts a [`usePriceListEditor`](/composables/usePriceListEditor) instance and renders it with [`PriceListEditor`](/components/price-list/PriceListEditor). The company page shows it in a sub view of the Pricing tab, and "Save company" saves what it edits.

It's the per-list unit: a page that offers several company lists (one per channel and currency) renders one per list.

## Features

- **Its own draft and editor.** A new list starts from `seed`, the create body without content; an existing one loads its rules and selection on mount (`fields: ['rules', 'selectionquery']`), since `CustomerPriceList` leaves them out.
- **New lists preview too.** Without an id, the preview posts the draft to `POST product/pricelist/preview`, and volume pricing works out prices locally.
- **The grid says "Company price"** (`pricing.company_price`) and uses the list's currency.
- **`v-model:content` and `v-model:dirty`.** The host reads the edited `PriceListContent` for its save body and counts `dirty` as an unsaved change. Dirty compares against a baseline captured after the first preview (via `usePanelDirty`), so loading never reads as an edit.
- **`afterSave(saved)`** re-seeds from the saved list (new rule `_id`s, the list id after a create), previews to rebuild its rows, and captures a new baseline.
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
    :price-list="priceList"
    :seed="seed"
  />
</template>
```

## Props

### `priceList`

```ts
priceList?: CustomerPriceList;
```

The company's own list. It's missing until "Save company" creates it, and it's read once, on mount; after a save, `afterSave` carries the new id.

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

## Notes

- Mount it lazily and keep it mounted (`v-if` once opened, then `v-show`), so edits survive going back to the Pricing cards.
- Consumers: `app/pages/customers/companies/[id].vue` (Pricing tab sub view).
