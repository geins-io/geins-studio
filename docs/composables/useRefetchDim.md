# `useRefetchDim`

`useRefetchDim` gives a delayed busy flag for a refetch that keeps the current results on screen. Skeletons are for the first load only; once there are results, a refetch (search, filter, sort, page, folder) leaves them in place and dims them.

`dimmed` turns on only after the refetch has run for **200 ms**, so fast queries never flicker, and turns off the moment it ends.

## The refetch look

Every consumer applies the same treatment:

- `transition-opacity` on the results, plus `pointer-events-none opacity-60` while `dimmed` (a stale row or card can't be opened mid-query).
- `aria-busy` from the **raw** refetch flag, not `dimmed`, so assistive tech hears about every refetch.
- Optionally a spinner (`LucideLoaderCircle`, `size-4`, `text-muted-foreground`, `animate-spin`, `aria-hidden`) where the user started the query — the asset library and picker put it in the search field via `Input`'s `#icon` slot.

## Usage

```ts
const loading = computed(() => pending.value && !items.value.length);
const refetching = computed(() => pending.value && !!items.value.length);
const { dimmed } = useRefetchDim(refetching);
```

```vue
<div
  :class="
    cn('grid transition-opacity', dimmed && 'pointer-events-none opacity-60')
  "
  :aria-busy="refetching || undefined"
>
  …
</div>
```

Server-mode [`TableView`](/components/table/TableView) does this itself: pass `:loading="pending"` and it shows the skeleton while it has no rows and the delayed dim otherwise.

## Parameters

### `refetching`

```ts
refetching: MaybeRefOrGetter<boolean>;
```

True while a refetch runs over results already on screen. Exclude the first load — that one shows skeletons.

### `delayMs`

```ts
delayMs?: number; // default 200
```

How long `refetching` must hold before `dimmed` turns on.

## Returns

### `dimmed`

```ts
dimmed: Readonly<Ref<boolean>>;
```

`true` once `refetching` has held for `delayMs`; `false` as soon as it ends. The pending timer is cleared when the calling scope is disposed.

## Notes

- Consumers: [`TableView`](/components/table/TableView), the asset library grid (`pages/asset-library/index.vue`), [`AssetPickerPanel`](/components/asset/AssetPickerPanel), [`AssetFolderTree`](/components/asset/AssetFolderTree#loading), [`AssetUsedIn`](/components/asset/AssetUsedIn#states).
