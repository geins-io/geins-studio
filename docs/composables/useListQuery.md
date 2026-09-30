# `useListQuery`

The `useListQuery` composable owns the state of a **server-driven list**: page, page size, sort, search and filters. It fetches one page at a time through a repository adapter. The state lives outside any table, so a card grid and a `TableView` can share it. The table only reads and writes it, following the TanStack "controlled state" pattern.

It also manages the batch `_id` lifecycle, so pages come from one consistent snapshot. See [List queries](/concepts/list-queries) for the state shape and the adapter rule.

## Usage

```ts
const { assetApi } = useGeinsRepository();
const selectedFolder = ref<string | null>(null);

const {
  items,
  total,
  pending,
  error,
  searchInput,
  hasActiveQuery,
  pagination,
  sorting,
  refresh,
} = useListQuery<Asset, AssetQueryFilters>({
  key: 'asset-library-query',
  fetcher: (state, options) =>
    assetApi.query(state, assetListOptions(selectedFolder.value), options),
  defaults: { filters: {}, pageSize: 48 },
  pageSizes: [24, 48, 96],
  deps: () => selectedFolder.value,
});

// after a mutation
await assetApi.delete(id);
await refresh();
```

Show skeletons only when `pending && items.length === 0`. While the next page loads, the previous page's rows stay in `items`.

`deps` lists the inputs the fetcher reads from outside the list state, such as `selectedFolder` above. A change to them resets the list like any other query change: back to page 1, on a new batch.

## Options

| Option             | Type                                                                | Default          | Notes                                                                            |
| ------------------ | ------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------- |
| `key`              | `string`                                                            | —                | Stable `useAsyncData` key.                                                       |
| `fetcher`          | `(state, { batchId, signal }) => Promise<BatchQueryResult<T>>`      | —                | The repository adapter, e.g. `assetApi.query`. Forward `signal`.                 |
| `defaults`         | `{ filters: TFilters; pageSize?: number; sort?: ListSort \| null }` | —                | `resetFilters()` returns to `defaults.filters`.                                  |
| `pageSizes`        | `number[]`                                                          | —                | Allowed sizes. Any other value falls back to the default.                        |
| `searchDebounceMs` | `number`                                                            | `300`            | Clearing the search applies at once.                                             |
| `deps`             | `() => unknown`                                                     | —                | Outside inputs the fetcher reads (e.g. folder scope). A change resets the query. |
| `route`            | `{ keys?, sortFields?, filters? }`                                  | —                | Two-way URL sync. See [URL sync](#url-sync).                                     |
| `immediate`/`lazy` | `boolean`                                                           | `useAsyncData`'s | Passed through.                                                                  |

The default page size is `defaults.pageSize`, then `pageSizes[0]`, then `30`.

## Returns

### State

`page` (1-based), `pageSize`, `sort` (`ListSort | null`), `filters`, `searchInput` (raw; bind this to the input) and `search` (read-only, debounced and trimmed; the value that's sent).

Replace `filters` or use `setFilter(name, value)`. Don't mutate it in place. `resetFilters()` restores the defaults.

### Results

`items`, `total` (`totalItemCount`), `pageCount`, `pending`, `error` and `refresh()`.

`hasActiveQuery` is true when there's a search or any filter is set (a non-empty array or string). Use it to tell an empty result from a "no matches" state.

### TanStack adapters

Writable computeds for `TableView` server mode:

- `pagination`: a `PaginationState` with a 0-based `pageIndex`, mapped to the 1-based `page`. A page-size change always returns to page 1.
- `sorting`: a `SortingState` mapped to `sort`. Single-column: only the first entry is kept.

## Behaviour

- **A query change starts over.** Changing page size, sort, search, filters or `deps` sets `page = 1` and drops the batch `_id`. The backend rejects an `_id` sent with a different query.
- **A page change keeps the batch.** Only `page` moving keeps the `_id`, so every page comes from the same batch.
- **Rejected batch → one silent retry.** If a request that carried an `_id` fails with `400` (an expired batch or `BATCH_FILTER_MISMATCH`), it's retried once on a fresh batch. Any other failure sets `error`.
- **Last request wins.** `useAsyncData` runs with `dedupe: 'cancel'`. A superseded request is aborted through `signal`, and its response is dropped.
- **Shrunk sets clamp.** If a response reports `page > pageCount` (for example after deletes), the list steps to the last page and refetches.
- **`refresh()`** keeps page, sort and search, and drops the `_id` so a mutation shows up.

## URL sync

Pass `route` to sync the state with the route query both ways, so a link reopens the exact page, sort, search and filters:

```ts
import { listParam } from '#shared/utils/list-query';

useListQuery<Asset, AssetQueryFilters>({
  // …
  route: {
    sortFields: ['name', 'type', 'sizeBytes', 'updatedAt'],
    filters: { assetTypes: listParam<AssetType>(['image', 'svg', 'pdf']) },
  },
});
```

| State    | Default key | Format                                     |
| -------- | ----------- | ------------------------------------------ |
| `page`   | `page`      | `3`                                        |
| pageSize | `perPage`   | `48`                                       |
| `sort`   | `sort`      | `name` ascending, `-name` descending       |
| `search` | `q`         | the debounced value                        |
| filters  | filter name | the filter's `serialize`, e.g. `image,svg` |

- **Restored before the first fetch.** The state starts from the URL, so the list doesn't fetch twice.
- **Validated.** A non-numeric or `< 1` page reads as 1. A page size outside `pageSizes`, a sort field outside `sortFields` and an unparsable filter fall back to their defaults. Invalid values are then cleaned out of the URL.
- **Written with `router.replace`.** No history entry per keystroke, and search is written after the debounce.
- **Defaults are omitted.** No `?page=1` and no default sort. A value cleared from a non-empty default is written as an empty key (`?sort=`) so it survives a reload.
- **Other params are left alone,** e.g. the asset page's `folder`.
- **Back / forward** updates the state, which refetches.
- **`keys`** overrides any key name, so two lists on one page don't collide: `route: { keys: { page: 'p', search: 's' } }`.

Each filter's codec comes from the page, so the generic layer knows nothing about filter semantics. `#shared/utils/list-query` ships two:

- `listParam(allowed?)`: a comma-separated array. Values outside `allowed` are dropped.
- `stringParam()`: a trimmed string.

For anything else, pass `{ parse(raw), serialize(value), key? }`. `parse` returns `undefined` for invalid input. Empty values (`undefined`, `''`, `[]`) are never serialized.

## Type Definitions

```ts
function useListQuery<T, TFilters extends object>(
  options: UseListQueryOptions<T, TFilters>,
): UseListQueryReturnType<T, TFilters>;
```
