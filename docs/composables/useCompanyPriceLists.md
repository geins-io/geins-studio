# `useCompanyPriceLists`

`useCompanyPriceLists` holds a company's own price lists on its Pricing tab — saved lists and unsaved drafts — and the step of "Save company" that saves them before the company. Each list is a `CompanyPriceListEntry`; an account owns at most one per channel and currency (see [Pricing → Shared and account lists](/domains/pricing#shared-and-account-lists)).

## Usage

```ts
const {
  entries,
  hasChanges,
  merge,
  addDraft,
  loadSource,
  removeDraft,
  seedFor,
  save,
} = useCompanyPriceLists({
  companyId: () => entityId.value,
  company: () => entityData.value,
  onSaved: async (entry, saved, action) => {
    if (action === 'create' || action === 'update') {
      await editorFor(entry.key)?.afterSave(saved);
    }
  },
});

// useEntityEdit({ …, externalChanges: hasChanges })
// parseEntityData: merge(ownAccountPriceLists)
// handleUpdateCompany: validate → if (await save()) await updateEntity(…)
```

```vue
<CompanyPriceListEditor
  :key="entry.key"
  v-model:content="entry.content"
  v-model:dirty="entry.contentDirty"
  :price-list="entry.saved"
  :seed="seedFor(entry)"
/>
```

## Parameters

### `companyId`

```ts
companyId: MaybeRefOrGetter<string>;
```

The company (wholesale account) that owns new lists.

### `company`

```ts
company: MaybeRefOrGetter<
  Partial<Pick<CustomerCompanyBase, 'name' | 'externalId' | 'channels'>>
>;
```

The **saved** company. Its name, external id and channel count name new lists (`companyPriceListCreateBody`): with more than one channel, the name and identifier include the channel.

### `onSaved`

```ts
onSaved?: (entry, saved: ProductPriceList, action: CompanyPriceListSaveAction) => Promise<void> | void;
```

Runs after each list saves, before the next one. Use it to re-seed that list's editor (`afterSave`) and refresh its counts. The list is saved by then, so a throw is logged and the save goes on.

## Returns

### `entries`

```ts
entries: Ref<CompanyPriceListEntry[]>;
```

Saved lists in the order the company returns them, then drafts. An entry's `key` is the list `_id`, or `draft-…` for a draft; it stays the same after "Save company" creates the draft, so its editor isn't remounted. `content` and `contentDirty` are bound from the editor with `v-model`.

### `hasChanges`

```ts
hasChanges: ComputedRef<boolean>;
```

Any entry dirty by `isCompanyPriceListEntryDirty`: a draft, an `active` that differs from the saved list, or edited content (even while the list is inactive). Read-only (ERP) lists never are. Pass it to `useEntityEdit` as `externalChanges`.

### `merge`

```ts
merge: (lists: CustomerPriceList[]) => string[];
```

Takes in the company's own lists on every load and reload — `parseEntityData` runs again whenever the company reloads, e.g. after the buyer panel closes. Entries are matched by `_id` and get the server fields; an unsaved switch change, edited content and drafts survive. Returns the keys of entries whose list is gone (e.g. taken over by an ERP import, which gives it a new id), so the page can close their sub view.

### `addDraft` / `removeDraft`

```ts
addDraft: (
  slot: { channel: string; currency: string },
  start?: { active?: boolean; content?: PriceListContent; exVat?: boolean },
) => string;
removeDraft: (key: string) => void;
```

Add an unsaved list for a free slot (`getFreeCompanyPriceListSlots`) and return its key; `active` defaults to `true`. With `content` (a list it starts from, from `loadSource`), the draft holds that content with `contentDirty: true`, so its editor opens with it and "Save company" creates the list with it; `exVat` is kept on the entry for the create body and the editor's seed. `removeDraft` drops a draft and leaves saved lists alone.

### `loadSource`

```ts
loadSource: (sourceId: string) =>
  Promise<{ content: PriceListContent; exVat: boolean }>;
```

The start of a draft based on another list, for `addDraft`. It reads the source's rules and selection (`GET product/pricelist/{id}?fields=rules,selectionquery`) and all its rows (`POST product/pricelist/{id}/query`, `fields: ['products']`, like a read-only editor), and turns them into content with `companyPriceListContentFromSource`: rules without ids, the selection, and the manual rows only. Neither read shows a toast, so it throws for the caller to show an inline error.

### `seedFor`

```ts
seedFor: (slot: { channel: string; currency: string; exVat?: boolean }) =>
  ProductPriceListCreate;
```

The create body of a new list in that slot, without content — the editor's `seed`, which a new list previews from. Pass the entry, so a draft started from another list previews with that list's `exVat`.

### `save`

```ts
save: () => Promise<boolean>;
```

Saves the dirty entries one at a time, in table order. Each uses `getCompanyPriceListSaveAction(entry.saved, entry.active, entry.contentDirty)`; a draft always creates, with its own `active`. Create and update ask for `fields: ['rules', 'selectionquery']`, and an update that returns nothing is read back. After each success the response is written into the entry (`saved`, server fields, `contentDirty: false`), then `onSaved` runs.

On the first failure it stops and returns `false` — the global API error toast says why, so the page calls nothing else (no company update). The lists saved before it are clean, so a retry only re-sends the rest.

## Notes

- Pure helpers live in `#shared/utils/price-list` (create/update bodies, save action, free slots, dirty predicate).
- Consumer: `pages/customers/companies/[id].vue`.
