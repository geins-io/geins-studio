# `useListFilters`

The `useListFilters` composable is the logic behind the list filter kit. It reads and edits a list's filter state from a set of **filter definitions**: active counts, value toggles, date ranges, pinned filters and async options. It has no UI. The filter bar, pinned popovers and "All filters" sheet all render from it.

It works on any `Ref<TFilters>`. In server mode that's `useListQuery().filters`, so every committed change refetches and reaches the URL. In client mode it's a local ref, paired with [`matchesListFilters`](#client-mode).

## Features

- Filter definitions per kind: `multiselect` (`string[]`) and `dateRange` (`ListDateRange`)
- Active counts per filter and in total, for badges
- Pinned filters (max 3), saved in a per-user, per-route cookie like column options
- Async multiselect options, loaded once, with `pending`/`error`/`reload`
- Staged drafts (`stage()`) so an editor commits only on apply
- URL codecs derived from the definitions (`listFilterRouteParams`)

## Usage

```ts
import type { ListDateRange, ListFilterDefinition } from '#shared/types';

interface LibraryFilters {
  assetTypes?: AssetType[];
  channels?: string[];
  modified?: ListDateRange;
}

const definitions: ListFilterDefinition<LibraryFilters>[] = [
  {
    name: 'assetTypes',
    label: 'type',
    kind: 'multiselect',
    options: typeOptions,
  },
  {
    name: 'channels',
    label: 'channel',
    kind: 'multiselect',
    options: loadChannels,
  },
  { name: 'modified', label: 'modified', kind: 'dateRange' },
];

const query = useListQuery<Asset, LibraryFilters>({
  key: 'asset-library',
  fetcher: (state, options) =>
    assetApi.query(toAssetState(state), scope, options),
  defaults: { filters: {} },
  route: { filters: listFilterRouteParams(definitions) },
});

const listFilters = useListFilters<LibraryFilters>({
  definitions,
  filters: query.filters,
  resetFilters: query.resetFilters,
  defaultPinned: ['assetTypes', 'modified'],
});
```

The adapter maps each value to its own request fields. A date range's preset is resolved **when the query is sent**, so "Today" never goes stale on a page left open overnight or restored from a link:

```ts
const toAssetState = ({ filters, ...rest }: ListQueryState<LibraryFilters>) => {
  const { modified, ...other } = filters;
  const { from, to } = modified ? resolveListDateRange(modified) : {};
  return { ...rest, filters: { ...other, modifiedFrom: from, modifiedTo: to } };
};
```

## Definitions

`ListFilterDefinition<TFilters>` (`#shared/types`) is a union on `kind`:

| Field        | Kinds       | Notes                                                                                    |
| ------------ | ----------- | ---------------------------------------------------------------------------------------- |
| `name`       | all         | The key in `TFilters`. Typed to keys holding `string[]` (multiselect) or `ListDateRange` |
| `label`      | all         | An i18n **key**, resolved in the UI. Never a translated string.                          |
| `kind`       | all         | `'multiselect'` or `'dateRange'`.                                                        |
| `icon`       | all         | Lucide name. Defaults to `ListFilter` / `CalendarRange` (`listFilterIcon`).              |
| `pinnable`   | all         | Default `true`.                                                                          |
| `urlKey`     | all         | URL query key. Defaults to `name`.                                                       |
| `options`    | multiselect | `ListFilterOption[]` or `() => Promise<ListFilterOption[]>`. Labels are display text.    |
| `searchable` | multiselect | Default: more than 7 options (`isListFilterSearchable`).                                 |

`ListDateRange` is `{ preset?: 'today' | 'week' | 'month'; from?: string; to?: string }`. `from`/`to` are inclusive ISO date-times. Presets are calendar-based in local time: this week starts on Monday, this month on the 1st.

## Options

| Option          | Type                                       | Notes                                                               |
| --------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| `definitions`   | `MaybeRefOrGetter<ListFilterDefinition[]>` | —                                                                   |
| `filters`       | `Ref<TFilters>`                            | The committed state. Replaced on every change, never mutated.       |
| `resetFilters`  | `() => void`                               | What `clearAll()` calls. Defaults to clearing every defined filter. |
| `defaultPinned` | `ListFilterName<TFilters>[]`               | Used only while no pinned cookie exists.                            |
| `persistKey`    | `string`                                   | Tells two filter bars on one route apart in the cookie.             |

## Returns

### Values

- `values(name)`: a multiselect's selected values. `range(name)`: a date range's value.
- `activeCount(name)`: selected values for a multiselect, 1 or 0 for a date range. `isActive(name)`.
- `totalActive`: the number of filters with a value.
- `toggleValue(name, value)`, `setRange(name, range)`, `clear(name)`, `clearAll()`.

An emptied filter drops its key, so a cleared state equals the defaults. That keeps `hasActiveQuery` false and the key out of the URL.

### Pinned

- `pinned`: ordered names, at most `LIST_FILTER_MAX_PINNED` (3).
- `isPinned(name)`, `canPin(name)` (pinned already, or pinnable with room left).
- `togglePin(name)`: a no-op for an unpinnable filter or past the limit.

Pins are saved with [`useUserRouteCookie`](/composables/useUserRouteCookie) as `geins-filters-pinned-${userId}${path}` (with `persistKey`: `geins-filters-pinned-${persistKey}-…`), kept for a year. Names that no longer exist or aren't pinnable are dropped on read.

### Options

`resolvedOptions(name)` returns a reactive `ListFilterOptionsState`: `options`, `pending`, `error` and `reload()`. Static options come back as-is. An async loader runs on the first call and is cached per filter; after an error, `reload()` retries.

### Staging

`stage()` returns a draft over a local copy of the filters, with the same value API plus `dirty`, `apply()` and `discard()`. Nothing reaches `filters` (or the URL) until `apply()`, which merges only the defined filters and skips an unchanged draft.

```ts
const draft = listFilters.stage();
draft.toggleValue('assetTypes', 'image'); // local only
draft.apply(); // commits → refetch + URL
```

Pinned state and options are shared with the parent, not staged.

## URL sync

`listFilterRouteParams(definitions)` (`#shared/utils/list-filter`) returns the `route.filters` codecs for `useListQuery`, so no filter can be left out of the URL:

| Kind        | Codec                      | URL                                                |
| ----------- | -------------------------- | -------------------------------------------------- |
| multiselect | `listParam(option values)` | `types=image,video`                                |
| dateRange   | `dateRangeParam()`         | `modified=week`, `modified=2026-09-01..2026-09-30` |

Static options restrict the values read back. Async options can't be checked before they load, so any value is accepted, and an unknown one matches nothing. The URL changes only when filters are **committed**. Staged edits never reach it, and clearing a filter removes its key.

## Client mode

`matchesListFilters(row, definitions, filters, accessors?, now?)` (`#shared/utils/list-filter`) is the local predicate, with the backend's semantics:

- values within one multiselect OR;
- filters AND;
- a date range is inclusive at both ends, and a preset resolves against `now`.

An inactive filter matches every row. `accessors` maps a filter name to the row value (a string, string array, or date); without one, the row property of the same name is read.

```ts
const filters = ref<LibraryFilters>({});
const listFilters = useListFilters({ definitions, filters });
const visible = computed(() =>
  assets.value.filter((a) =>
    matchesListFilters(a, definitions, filters.value, {
      assetTypes: (x) => x.type,
      modified: (x) => x.updatedAt,
    }),
  ),
);
```

## Type Definitions

```ts
function useListFilters<TFilters extends object>(
  options: UseListFiltersOptions<TFilters>,
): UseListFiltersReturnType<TFilters>;
```

## Dependencies

- [`useUserRouteCookie`](/composables/useUserRouteCookie) for pinned filters
- `useGeinsLog('useListFilters')` for option load errors
