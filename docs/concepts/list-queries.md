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

[`useListQuery`](/composables/useListQuery) holds the state, calls the adapter and runs the batch lifecycle, including a retry on a rejected batch. Optionally it also syncs the state with the URL query. Pages don't wire the adapter to `useAsyncData` themselves.

## Filters

`filters` is the list's own filter shape, not the endpoint's. The filter kit ([`useListFilters`](/composables/useListFilters)) builds it from **filter definitions** (`ListFilterDefinition`), one per filter:

- a `multiselect` value is a `string[]`;
- a `dateRange` value is a `ListDateRange`: a preset (`today`, `week`, `month`) or inclusive ISO `from`/`to`.

The adapter maps each value onto its request fields. For assets, `modified` becomes `modifiedFrom`/`modifiedTo`. A preset is resolved with `resolveListDateRange` **when the query is sent**, never when it's picked, so a restored or long-open list stays correct.

The semantics match the backend: values inside one filter OR, and filters AND. `matchesListFilters` applies the same rules to a client-side list, so moving a page from client to server mode doesn't change its results.

Every committed filter is in the URL. Pass `listFilterRouteParams(definitions)` as `useListQuery`'s `route.filters`: it maps `multiselect` to `listParam(option values)` and `dateRange` to `dateRangeParam()`.

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
