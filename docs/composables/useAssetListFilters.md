# `useAssetListFilters`

The `useAssetListFilters` composable holds the asset list's filter-kit definitions — **Type**, **Channel**, **Content language** and **Modified** — and maps the filter-bar state onto the `assetQuery` request. The library page and the `/dev/server-table` harness both use it, so the filters and their wire mapping live in one place.

## Usage

```ts
const { definitions, toQueryFilters } = useAssetListFilters();

const { filters, resetFilters, ...query } = useListQuery<
  Asset,
  AssetListFilters
>({
  key: 'asset-library-list',
  fetcher: ({ filters, ...state }, options) =>
    assetApi.query(
      { ...state, filters: toQueryFilters(filters) },
      assetListOptions(selectedFolder.value),
      options,
    ),
  defaults: { filters: {} },
  route: { filters: listFilterRouteParams(definitions) },
});

const listFilters = useListFilters<AssetListFilters>({
  definitions,
  filters,
  resetFilters,
  defaultPinned: ['assetTypes'],
});
```

## Returns

### `definitions`

<!-- prettier-ignore -->
```ts
definitions: ListFilterDefinition<AssetListFilters>[]
```

| Filter           | Name         | Kind          | URL key     | Options                                                                                                                              |
| ---------------- | ------------ | ------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Type             | `assetTypes` | `multiselect` | `type`      | Every `AssetType` (`ASSET_TYPES`), labelled + iconed via [`useAssetType`](/composables/useAssetType)                                 |
| Channel          | `channels`   | `multiselect` | `channels`  | The account's channels by `_id`, loaded from the account store on first open                                                         |
| Content language | `languages`  | `multiselect` | `languages` | The account's languages by code (`_id`, e.g. `sv`), loaded from the account store on first open. Matches assets carrying any of them |
| Modified         | `modified`   | `dateRange`   | `modified`  | Presets + custom range                                                                                                               |

Channel and Content language set their `icon` (`Globe`, `Languages`) to match the library's bulk **Add channels** / **Add content languages** actions; Type and Modified use the kind defaults.

### `toQueryFilters`

```ts
toQueryFilters(filters: AssetListFilters): AssetQueryFilters
```

Turns the bar state into `assetQuery` filters: `modified` becomes `modifiedFrom` / `modifiedTo` via `resolveListDateRange`. Call it inside the fetcher, so a preset like "this week" resolves when the query is sent and never goes stale.

## Types

`AssetListFilters` (`#shared/types`) is `AssetQueryFilters` with the modified bounds kept as one `ListDateRange`:

```ts
interface AssetListFilters {
  assetTypes?: AssetType[];
  channels?: string[];
  languages?: string[];
  modified?: ListDateRange;
}
```

## Consumed by

- The asset library page (`app/pages/asset-library/index.vue`)
- The server-table dev harness (`app/pages/dev/server-table.vue`)
