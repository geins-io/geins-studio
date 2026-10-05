import type {
  AssetListFilters,
  AssetQueryFilters,
  ListFilterDefinition,
} from '#shared/types';

export interface UseAssetListFiltersReturnType {
  /** Type, channel and modified — for `useListFilters` and `listFilterRouteParams`. */
  definitions: ListFilterDefinition<AssetListFilters>[];
  /** The filter-bar state as `assetQuery` filters. Call at send time. */
  toQueryFilters: (filters: AssetListFilters) => AssetQueryFilters;
}

/**
 * The asset list's filter-kit definitions and their mapping onto the media
 * query. Channel options load from the account store on first open.
 */
export function useAssetListFilters(): UseAssetListFiltersReturnType {
  const { label, meta } = useAssetType();
  const accountStore = useAccountStore();
  const { channels } = storeToRefs(accountStore);

  const definitions: ListFilterDefinition<AssetListFilters>[] = [
    {
      name: 'assetTypes',
      label: 'type',
      kind: 'multiselect',
      urlKey: 'type',
      options: ASSET_TYPES.map((type) => ({
        value: type,
        label: label(type),
        icon: meta(type).icon,
      })),
    },
    {
      name: 'channels',
      label: 'channel',
      kind: 'multiselect',
      options: async () =>
        (channels.value.length
          ? channels.value
          : await accountStore.fetchChannels()
        ).map((c) => ({ value: c._id, label: c.name || c.identifier })),
    },
    { name: 'modified', label: 'modified', kind: 'dateRange' },
  ];

  // Presets resolve here, at send time, so a long-open list stays current.
  const toQueryFilters = ({
    modified,
    ...rest
  }: AssetListFilters): AssetQueryFilters => {
    const range = modified ? resolveListDateRange(modified) : {};
    return { ...rest, modifiedFrom: range.from, modifiedTo: range.to };
  };

  return { definitions, toQueryFilters };
}
