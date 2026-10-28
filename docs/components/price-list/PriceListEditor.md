# `PriceListEditor`

`PriceListEditor` renders a price list's "Products & pricing" editor from a [`usePriceListEditor`](/composables/usePriceListEditor) instance — the global rules card and the product selection card with the editable products grid.

## Features

- **Global rules card**: base rule (margin or discount, apply / apply and overwrite, removable tag) and volume pricing ([`PriceListRules`](/components/price-list/PriceListRules) in a [`PriceListRulesWrapper`](/components/price-list/PriceListRulesWrapper)). Both tabs are inactive until the selection has products.
- **Product selection card**: a [`Selector`](/components/selector/Selector) (quick add, browse, exclude) whose list slot is the products grid — price, discount and margin cells, volume pricing and price mode.
- **Dialogs and panels**: the four confirmation prompts (rules mode change, overwrite product prices, overwrite volume pricing, remove base rule) and the [`PriceListVolumePricingPanel`](/components/price-list/PriceListVolumePricingPanel) — editable, or view-only for a read-only list.
- **Read-only lists**: every control disabled, read-only grid columns, and an inline error state with retry when the saved rows fail to load.
- No `FormField`s: the editor writes its draft directly, so it can sit in a lazily mounted tab or sub view.

## Usage

Create the editor in the host's setup and pass it in:

```vue
<script setup lang="ts">
const editor = usePriceListEditor({
  priceListId: entityId,
  draft: entityDataUpdate,
  readOnly,
  onSynced: setOriginalSavedData,
});
</script>

<template>
  <ContentEditMainContent>
    <PriceListEditor :editor="editor" />
  </ContentEditMainContent>
</template>
```

The two cards sit in their own column with a `gap-8` between them; the dialogs and panels teleport, so the component adds nothing else to the host's layout.

## Props

### `editor`

```ts
editor: UsePriceListEditorReturnType;
```

The editor to render. One per mount: the component unwraps its refs once at setup.

## Notes

- The `Selector` is keyed on `editor.seedVersion` — it reads its selection and currency only once, so it remounts when a seed brings in another list.
- Consumers: `app/pages/pricing/price-lists/[id].vue` (tab 2).
