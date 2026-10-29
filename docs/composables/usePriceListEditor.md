# `usePriceListEditor`

`usePriceListEditor` is the "Products & pricing" editor of one price list — base rule, volume pricing, product selection and the editable products grid. It takes the list as input (an id and a draft), so any page can host it; [`PriceListEditor`](/components/price-list/PriceListEditor) renders it.

It wires the focused pricing composables together: [`usePriceListPreview`](usePriceListPreview.md) (live previews), [`usePriceListRules`](usePriceListRules.md) and [`usePriceListVolumePricing`](usePriceListVolumePricing.md) (rules), and [`usePriceListProducts`](usePriceListProducts.md) / [`usePriceListProductsTable`](usePriceListProductsTable.md) (grid rows and columns).

:::warning Call it in the host's setup
Not inside the component, and not inside a lazily mounted tab: the host seeds and loads the editor when its data arrives, and the editor's first preview sets the host's clean baseline (`onSynced`).
:::

## Usage

The price list page, where `useEntityEdit` tracks dirty state over the whole list:

```ts
const editor = usePriceListEditor({
  priceListId: entityId,
  draft: entityDataUpdate,
  readOnly,
  onSynced: setOriginalSavedData,
});

// parseEntityData
editor.seed(entity);

// onMounted — a list with a selection gets its baseline from the first preview
const previews = !priceList.readOnly && !!priceList.productSelectionQuery;
await parseAndSaveData(priceList, !previews);
await editor.load();

// Save
editor.saving.value = true;
try {
  await updateEntity(
    undefined,
    { fields: ['rules', 'selectionquery'] },
    !editor.hasProductSelection.value,
  );
  await editor.afterSave();
} finally {
  editor.saving.value = false;
}
```

```vue
<PriceListEditor :editor="editor" />
```

A host without an entity snapshot over the list tracks `content` with `isDirty` instead, and calls `captureBaseline()` once the editor has synced.

## Options

### `UsePriceListEditorOptions`

```ts
interface UsePriceListEditorOptions {
  priceListId: MaybeRefOrGetter<string | undefined>;
  draft: Ref<ProductPriceListUpdate>;
  readOnly?: MaybeRefOrGetter<boolean>;
  onSynced?: () => void;
}
```

- **`priceListId`**: the list's `_id`. Previews, volume-pricing previews and the read-only rows need it.
- **`draft`**: the list being edited. The editor reads `channel`, `currency` and `exVat`, and writes `rules`, `productSelectionQuery` and `products`. Always read through the ref — the host may replace the object.
- **`readOnly`**: an ERP-managed list. Its saved rows load read-only (query, not preview), the grid has read-only columns, the volume pricing panel opens view-only, and every control is disabled.
- **`onSynced`**: called after a preview rebuilt the saved rows (`updateProducts`) — the host's moment to capture its clean baseline.

## Returns

### Lifecycle

```ts
seed: (list: Pick<ProductPriceListUpdate, 'rules' | 'productSelectionQuery'>) => void;
load: () => Promise<void>;
afterSave: () => Promise<void>;
saving: Ref<boolean>;
seedVersion: Ref<number>;
```

- **`seed(list)`**: copies the saved selection and rules into the editor — rule modes, global rules (with internal ids) and the product selection. Bumps `seedVersion` on the first seed and when the list id changes; re-seeding the same list after a save doesn't.
- **`load()`**: a read-only list loads its saved rows; otherwise a list with a selection previews with `updateProducts` (→ `onSynced`). Then the selection watcher turns on, so later selection changes preview.
- **`afterSave()`**: previews the saved list again with `updateProducts`, rebuilding the saved rows and the baseline.
- **`saving`**: set it while the host saves. The save re-seeds the selection, and the selection watcher ignores changes while it's `true`.
- **`seedVersion`**: the `Selector` reads its selection and currency once, so `PriceListEditor` keys it on this.

### Dirty state

```ts
content: ComputedRef<PriceListContent>;
isDirty: ComputedRef<boolean>;
captureBaseline: () => void;
```

`content` is the edited part of the draft: `Pick<ProductPriceListUpdate, 'rules' | 'productSelectionQuery' | 'products'>`. `isDirty` and `captureBaseline` come from [`usePanelDirty`](usePanelDirty.md) over it. The price list page doesn't use them — `useEntityEdit`'s snapshot covers the list there.

### Template state

Everything `PriceListEditor` binds: the selection (`productSelection`, `productSelector`), the grid (`columns`, `selectedProducts`, `pinnedState`, the read-only rows' loading/error/retry), the base rule input and its handlers, volume pricing rules and the per-product panel state, and the four confirmation prompts (rules mode change, overwrite base rule, overwrite volume pricing, remove base rule).

## Notes

- `editedProducts` is the single source of the manual rows: cell edits, the volume pricing panel and "Apply and overwrite" (via `usePriceListRules`) all write it, and a deep `flush: 'sync'` watcher copies it into `draft.products`, so the draft is current before the next preview reads it.
- Consumers: `app/pages/pricing/price-lists/[id].vue`.
