# List queries

Most lists in Studio fetch everything and let TanStack sort, paginate and search on the client. A **server-driven list** hands that work to the backend instead: it sends one page's worth of state and gets back one page of rows. This page covers the shared contract that every server-driven list uses.

## State shape

`ListQueryState<TFilters>` (`#shared/types`) is endpoint-agnostic:

```ts
interface ListQueryState<TFilters = Record<string, never>> {
  page: number; // 1-based, like BatchQuery.page and PaginationBar
  pageSize: number;
  sort: ListSort | null; // null = the endpoint's default sort
  search: string; // '' = no search
  filters: TFilters;
}

interface ListSort {
  field: string; // the column id
  direction: 'asc' | 'desc';
}
```

The response is always the existing `BatchQueryResult<T>`: `_id`, `page`, `pageSize`, `totalItemCount`, `pageCount` and `items`. There is no list-specific response type.

## The adapter rule

Each repository owns one **adapter** method that maps `ListQueryState` onto its endpoint's request body. The state never goes over the wire as-is. The adapter:

- **Maps `sort.field` (a column id) to the endpoint's sort field**, and drops any column the endpoint can't sort by. Otherwise the backend answers `400`.
- **Omits empty values.** It skips a blank `search`, a `null` sort and empty filter arrays or strings, so the backend defaults apply.
- **Respects the endpoint's match-all semantics.** On batch queries, `all: true` matches every row _regardless of_ the other criteria. Send it only when there is no filter, search or scope at all.
- **Clamps `pageSize`** to the endpoint's maximum.
- **Returns the full `BatchQueryResult`**, not `.items`, because the list needs `totalItemCount` and the batch `_id`.
- **Passes `suppressErrorToast: true`.** The queries are `POST`s, so without the flag a failed read fires the global _mutation_ error toast. Show read errors in the list's error state instead.

Scope that has its own UI and URL key, such as the asset folder rail, is a **separate argument** to the adapter. It doesn't go in `filters`, which holds only the filter-kit filters.

## Batch ids

The first page of a query creates a batch, and `_id` on the result identifies it. To fetch later pages of the **same** query, pass that id back (`batchId`). Whenever sort, search, filters or scope change, drop the id so the backend starts a new batch. A batch expires 24 hours after it's created. Paging an expired batch answers `400 Batch not found.`

## State management

[`useListQuery`](/composables/useListQuery) holds the state, calls the adapter and runs the batch lifecycle, including a retry on a rejected batch. Pages don't wire the adapter to `useAsyncData` themselves.

## Adapters

| Repository | Adapter                                  | Filters             | Scope                                                                                    |
| ---------- | ---------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------- |
| Assets     | `assetApi.query(state, scope, options?)` | `AssetQueryFilters` | `AssetQueryScope` from `assetListOptions(selected)` (see [assets](../domains/assets.md)) |

```ts
const { assetApi } = useGeinsRepository();

const result = await assetApi.query(
  {
    page: 1,
    pageSize: 50,
    sort: { field: 'name', direction: 'asc' },
    search: 'hero',
    filters: { assetTypes: ['image'] },
  },
  assetListOptions(selectedFolder),
  { batchId, signal },
);
```
