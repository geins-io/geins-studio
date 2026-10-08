<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core';
import type {
  Asset,
  AssetBulkLinkValue,
  AssetListFilters,
  BulkAction,
  BulkRunResult,
  ListSort,
} from '#shared/types';
import { TableMode } from '#shared/types';
import {
  ASSET_LABEL_LIMITS,
  assetLabelLimitError,
  assetListOptions,
  assetSelectionKind,
  bulkLinkCalls,
  bulkMoveErrorKey,
  countAssetIds,
  folderIdForSelection,
  ROOT_FOLDER_KEY,
  TRASH_KEY,
  TRASH_RETENTION_DAYS,
  normalizeAssetLabels,
} from '#shared/utils/asset';
import { ENTITIES } from '#shared/utils/entities';
import { formatFileSize } from '#shared/utils/file';
import { serializeSort } from '#shared/utils/list-query';
import { useToast } from '@/components/ui/toast/use-toast';
import { cn, segmentedButtonClass } from '@/utils/index';
import type { ColumnDef } from '@tanstack/vue-table';

// Fixed-height list layout: header + toolbar + folder nav + pagination stay put;
// only the grid/table body scrolls (default.vue → overflow-hidden).
definePageMeta({ pageType: 'list' });

const { t } = useI18n();
const { assetApi } = useGeinsRepository();
const { getColumns, getBasicCellStyle, getBasicHeaderStyle } =
  useColumns<Asset>();
const { folderName } = useFolders();
const { resolveIcon } = useLucideIcon();
const entityKey = ENTITIES.asset.key;
const route = useRoute();
const router = useRouter();
const { formatRelativeDate } = useDate();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog('pages/asset-library');

// Trash lists most recently trashed first. Its date fields mean nothing on a
// live folder, so leaving trash drops them.
const TRASH_SORT: ListSort = { field: 'deletedAt', direction: 'desc' };
const TRASH_SORT_FIELDS = ['deletedAt', 'purgeAfter'];
const isTrashSort = (sort: ListSort | null) =>
  !!sort && TRASH_SORT_FIELDS.includes(sort.field);

const view = ref<'grid' | 'list'>('grid');
// Open by default where the panel sits inline (sm+, the same 640px boundary the
// template uses to switch from overlay-drawer to inline) so the active folder
// filter is always visible; below sm it starts closed and overlays on demand.
const showFolders = ref(useMediaQuery('(min-width: 640px)').value);
// Rail selection: a folder id, `null` for All assets, `ROOT_FOLDER_KEY` for
// Uncategorised, or `TRASH_KEY` for the soft-deleted set — all four scope the
// server-side query. Read straight from `?folder`: a local ref synced by its
// own `router.replace` would race useListQuery's write of the same query (both
// merge a stale `route.query`, and the later navigation cancels the earlier).
const selectedFolder = computed<string | null>({
  get: () => {
    const folder = route.query.folder;
    return typeof folder === 'string' && folder ? folder : null;
  },
  set: (folder) => {
    // A new folder starts on page 1; a leftover ?page would be read back as a
    // navigation to that page. Crossing into or out of trash swaps the sort in
    // the same navigation, for the same reason.
    const crossesTrash = (folder === TRASH_KEY) !== isTrash.value;
    const rest = Object.fromEntries(
      Object.entries(route.query).filter(
        ([key]) =>
          key !== 'folder' &&
          key !== 'page' &&
          !(crossesTrash && key === 'sort'),
      ),
    );
    const entersTrash = crossesTrash && folder === TRASH_KEY;
    router.replace({
      query: {
        ...rest,
        ...(folder ? { folder } : {}),
        ...(entersTrash ? { sort: serializeSort(TRASH_SORT) } : {}),
      },
    });
  },
});
// Uncategorised is a query, not a folder, so uploads from there land at the root.
const uploadFolderId = computed(() =>
  folderIdForSelection(selectedFolder.value),
);
// Trash lists the soft-deleted assets instead of a folder scope: restore and
// purge are the only actions there, and upload / detail panel / trash are off.
const isTrash = computed(() => selectedFolder.value === TRASH_KEY);
// Stated, not enforced — the backend owns the retention window.
const retentionNote = computed(() =>
  t('asset_library.trash_retention', { days: TRASH_RETENTION_DAYS }),
);
const uploadOpen = ref(false);

// Storage usage (mocked; phase-2 API). Summary in the header + a details panel.
const storageOpen = ref(false);
const { storage } = useAssetStorage();
const storageUsedPct = computed(() =>
  storage.value.totalBytes
    ? Math.round((storage.value.usedBytes / storage.value.totalBytes) * 100)
    : 0,
);

const detailOpen = ref(false);
const detailAsset = ref<Asset | null>(null);

// const enum is erased at runtime — resolve to a value in script (not template).
const listMode = TableMode.Simple;
const columns = ref<ColumnDef<Asset>[]>([]);

// One query drives both views, so the grid and the list share page, page
// size, sort and search (all mirrored to the URL). The grid has no sort control
// of its own; it shows whatever the list set, or the backend's default.
const PAGE_SIZES = [24, 48, 96];
const { definitions: filterDefinitions, toQueryFilters } =
  useAssetListFilters();
const {
  items,
  total,
  pending,
  error,
  page,
  pageSize,
  sort,
  search,
  searchInput,
  filters,
  resetFilters,
  hasActiveQuery,
  pagination,
  sorting,
  refresh,
} = useListQuery<Asset, AssetListFilters>({
  key: 'asset-library-list',
  fetcher: ({ filters, ...state }, options) =>
    assetApi.query(
      { ...state, filters: toQueryFilters(filters) },
      assetListOptions(selectedFolder.value),
      options,
    ),
  defaults: { filters: {} },
  pageSizes: PAGE_SIZES,
  deps: () => selectedFolder.value,
  route: {
    sortFields: [
      'name',
      'type',
      'folderPath',
      'sizeBytes',
      'updatedAt',
      ...TRASH_SORT_FIELDS,
    ],
    filters: listFilterRouteParams(filterDefinitions),
  },
});
// A link into trash with no sort, or a live link carrying a trash sort.
if (isTrash.value && !sort.value) sort.value = TRASH_SORT;
else if (!isTrash.value && isTrashSort(sort.value)) sort.value = null;

// Filters scope trash too — a folder change keeps them.
const listFilters = useListFilters<AssetListFilters>({
  definitions: filterDefinitions,
  filters,
  resetFilters,
  defaultPinned: ['assetTypes'],
});
const filterSheetOpen = ref(false);
const clearQuery = () => {
  searchInput.value = '';
  listFilters.clearAll();
};

// Skeletons on the first load only; later fetches keep the rows on screen.
const loading = computed(() => pending.value && !items.value.length);
const fetchError = computed(() => !!error.value);

// Empty-state descriptor shared by the grid (inline <Empty>) and the list
// (TableView props): a search with no matches reads differently from an empty
// folder / empty library.
const emptyIcon = computed(() => {
  if (hasActiveQuery.value) return resolveIcon('SearchX') ?? undefined;
  return resolveIcon(isTrash.value ? 'Trash2' : 'FolderOpen') ?? undefined;
});
const emptyTitle = computed(() => {
  if (hasActiveQuery.value) return t('no_entity_found', { entityKey }, 2);
  if (isTrash.value) return t('asset_library.trash_empty');
  return selectedFolder.value && selectedFolder.value !== ROOT_FOLDER_KEY
    ? t('asset_library.no_assets_in_folder')
    : t('no_entity', { entityKey }, 2);
});
const emptyDescription = computed(() => {
  if (hasActiveQuery.value)
    return t('empty_filtered_description', { entityKey }, 2);
  if (isTrash.value) return retentionNote.value;
  return t('empty_description', { entityKey }, 2);
});

// List columns — useColumns generates tags + modified; the type-badge,
// thumbnail, name-opens-panel, and byte-formatted size need custom cells, so
// they are defined explicitly and prepended.
const TableCellAssetThumbnail = resolveComponent('TableCellAssetThumbnail');
const AssetTypeBadge = resolveComponent('AssetTypeBadge');
const AssetActionsMenu = resolveComponent('AssetActionsMenu');

// getColumns builds every column (consistent header / sort / cell style /
// ordering); only the cell BODY is swapped for the asset-specific columns.
function buildColumns(rows: Asset[]): ColumnDef<Asset>[] {
  // Trash swaps "Modified" for when the asset was trashed and when it purges.
  const dateColumns: (keyof Asset)[] = isTrash.value
    ? ['deletedAt', 'purgeAfter']
    : ['updatedAt'];
  const cols = getColumns(rows, {
    selectable: true,
    includeColumns: [
      'name',
      'type',
      'folderPath',
      'sizeBytes',
      'tags',
      ...dateColumns,
    ],
    columnTitles: {
      name: t('name', 1),
      type: t('type'),
      folderPath: t('folder', 1),
      sizeBytes: t('size'),
      tags: t('tag', 2),
      updatedAt: t('modified'),
      deletedAt: t('asset_library.moved_to_trash'),
      purgeAfter: t('asset_library.deleted_permanently'),
    },
    columnTypes: {
      sizeBytes: 'filesize',
      tags: 'tags',
      updatedAt: 'date',
      deletedAt: 'date',
      purgeAfter: 'date',
    },
    // Column ids are the query's `sortBy`; tags isn't one.
    sortableColumns: { tags: false },
  });

  // Sorts by `folderPath` (the closest server field) but shows the folder name.
  const folderCol = cols.find((col) => col.id === 'folderPath');
  if (folderCol) {
    folderCol.cell = ({ table, row }) =>
      h(
        'div',
        { class: getBasicCellStyle(table) },
        folderName(row.original.folderId) ?? '—',
      );
  }

  // Relative ("in 12 days"): how long is left matters more than the date.
  const purgeCol = cols.find((col) => col.id === 'purgeAfter');
  if (purgeCol) {
    purgeCol.cell = ({ table, row }) =>
      h(
        'div',
        { class: getBasicCellStyle(table) },
        formatRelativeDate(row.original.purgeAfter) || '---',
      );
  }

  const typeCol = cols.find((col) => col.id === 'type');
  if (typeCol) {
    typeCol.cell = ({ table, row }) =>
      h(
        'div',
        { class: getBasicCellStyle(table) },
        h(AssetTypeBadge, { type: row.original.type }),
      );
  }

  const nameCol = cols.find((col) => col.id === 'name');
  if (nameCol) {
    nameCol.cell = ({ table, row }) =>
      h(
        'div',
        { class: getBasicCellStyle(table) },
        isTrash.value
          ? row.original.name
          : h(
              'button',
              {
                type: 'button',
                class: 'link-text text-left',
                onClick: () => openAsset(row.original),
              },
              row.original.name,
            ),
      );
  }

  // Fixed-width thumbnail column — same size/style as the built-in image type.
  cols.push({
    id: 'thumb',
    enableSorting: false,
    size: 40,
    minSize: 40,
    maxSize: 40,
    meta: { type: 'image' },
    header: ({ table }) =>
      h('div', { class: cn(getBasicHeaderStyle(table), 'px-2') }),
    cell: ({ table, row }) =>
      h(TableCellAssetThumbnail, {
        type: row.original.type,
        url: row.original.url,
        alt: row.original.name,
        className: getBasicCellStyle(table),
      }),
  });

  // Per-row actions — same context menu as the grid card (AssetActionsMenu).
  cols.push({
    id: 'actions',
    enableSorting: false,
    enableHiding: false,
    size: 49,
    minSize: 49,
    maxSize: 49,
    header: ({ table }) => h('div', { class: getBasicHeaderStyle(table) }),
    cell: ({ table, row }) =>
      h(
        'div',
        { class: cn(getBasicCellStyle(table), 'justify-center px-2') },
        h(AssetActionsMenu, {
          asset: row.original,
          trigger: 'table',
          trashed: isTrash.value,
          onOpen: () => openAsset(row.original),
          onDownload: () => download(row.original),
          onCopyUrl: () => copyUrl(row.original),
          onDelete: () => requestDelete(row.original),
          onRestore: () => restore(row.original),
          onPurge: () => requestPurge(row.original),
        }),
      ),
    meta: { type: 'actions' },
  });

  const order = [
    'select',
    'thumb',
    'name',
    'type',
    'folderPath',
    'sizeBytes',
    'tags',
    ...dateColumns,
    'actions',
  ];
  return order
    .map((id) => cols.find((col) => col.id === id))
    .filter((col): col is ColumnDef<Asset> => col !== undefined);
}

// `getColumns` derives the keys from a row, so keep the last set when a query
// comes back empty — the empty state spans `columns.length`.
watch(
  [items, isTrash],
  ([rows]) => {
    if (rows.length || !columns.value.length)
      columns.value = buildColumns(rows);
  },
  { immediate: true },
);

// Bulk selection — one id list for both views, so it survives view switches,
// paging, sort, search and filters (the bar counts the selection, not the rows
// on screen). A folder change clears it: the actions assume one scope. Trash
// selects too, but its only bulk action is Delete permanently.
const selectedIds = ref<string[]>([]);
const selectedSet = computed(() => new Set(selectedIds.value));
// Select-all in a folder also takes its subfolders' assets (the folder query
// includes them); the confirm step says so.
const selectedWithSubfolders = ref(false);

const clearSelection = () => {
  selectedIds.value = [];
};

// Every asset that could be selected, so bulk actions know a selected asset
// (a link's type split, a zip's url/name/size) without a fetch. Filled from
// each loaded page and from select-all before ids reach the selection; plain
// (non-reactive) because it only grows.
const knownAssets = new Map<string, Asset>();
watch(
  items,
  (rows) => rows.forEach((asset) => knownAssets.set(asset._id, asset)),
  { immediate: true },
);
watch(selectedFolder, clearSelection);
watch(selectedIds, (ids) => {
  if (!ids.length) selectedWithSubfolders.value = false;
});

function toggleSelect(id: string) {
  selectedIds.value = selectedSet.value.has(id)
    ? selectedIds.value.filter((selected) => selected !== id)
    : [...selectedIds.value, id];
}

const pageIds = computed(() => items.value.map((asset) => asset._id));
const pageSelected = computed(
  () =>
    pageIds.value.length > 0 &&
    pageIds.value.every((id) => selectedSet.value.has(id)),
);
const pageCheckState = computed<boolean | 'indeterminate'>(() => {
  if (pageSelected.value) return true;
  return pageIds.value.some((id) => selectedSet.value.has(id))
    ? 'indeterminate'
    : false;
});
function togglePage() {
  const onPage = new Set(pageIds.value);
  selectedIds.value = pageSelected.value
    ? selectedIds.value.filter((id) => !onPage.has(id))
    : [...new Set([...selectedIds.value, ...pageIds.value])];
}

const canSelectAll = computed(
  () => pageSelected.value && selectedIds.value.length < total.value,
);
const selectingAll = ref(false);
async function selectAllMatching() {
  selectingAll.value = true;
  try {
    const assets = await assetApi.matchingAssets(
      {
        page: 1,
        pageSize: pageSize.value,
        sort: sort.value,
        search: search.value,
        filters: toQueryFilters(filters.value),
      },
      assetListOptions(selectedFolder.value),
    );
    assets.forEach((asset) => knownAssets.set(asset._id, asset));
    selectedIds.value = [
      ...new Set([...selectedIds.value, ...assets.map((asset) => asset._id)]),
    ];
    selectedWithSubfolders.value =
      !!selectedFolder.value &&
      selectedFolder.value !== ROOT_FOLDER_KEY &&
      !isTrash.value;
  } catch (err) {
    geinsLogError('selectAllMatching', getErrorMessage(err));
    toast({
      title: t('error_fetching_entity', { entityKey }, 2),
      variant: 'negative',
    });
  } finally {
    selectingAll.value = false;
  }
}

const bulkSheetOpen = ref(false);
const bulkTrashOpen = ref(false);
const trashAction = computed<BulkAction>(() => ({
  key: 'move-to-trash',
  label: t('asset_library.move_to_trash'),
  icon: 'Trash2',
  description: (count) =>
    t('asset_library.bulk_trash_description', { count }, count),
  note: () =>
    t('asset_library.trash_restore_note', { days: TRASH_RETENTION_DAYS }, 2),
  run: (ids, _value, options) => assetApi.bulkDelete(ids, options),
  successMessage: (count) =>
    t('asset_library.bulk_moved_to_trash', { count }, count),
}));
// Hard delete: trash-only, red, and can't be undone. The purge lands about a
// minute after the call, so the refresh after the run can still list some.
const purgeAction = computed<BulkAction>(() => ({
  key: 'delete-permanently',
  label: t('asset_library.delete_permanently'),
  icon: 'Trash2',
  destructive: true,
  description: (count) =>
    t('asset_library.bulk_purge_description', { count }, count),
  note: () => t('asset_library.purge_note'),
  run: (ids, _value, options) => assetApi.bulkPurge(ids, options),
  successMessage: (count) =>
    t('asset_library.bulk_deleted_permanently', { count }, count),
}));
// The bar's shortcut action: the soft trash on live assets, the purge in trash.
const barAction = computed(() =>
  isTrash.value ? purgeAction.value : trashAction.value,
);
const AssetBulkMoveFolder = resolveComponent('AssetBulkMoveFolder');
// The value is the folder tree's selection (a folder id or ROOT_FOLDER_KEY).
// A 202 means the copies are still landing, so the refresh after the run may
// still show some assets in their old folder.
const moveAction = computed<BulkAction<string | null>>(() => ({
  key: 'move-to-folder',
  label: t('asset_library.move_to_folder'),
  icon: 'FolderInput',
  component: AssetBulkMoveFolder,
  initialValue: () => null,
  isValid: (value) => !!value && value !== TRASH_KEY,
  summary: (value) =>
    value === ROOT_FOLDER_KEY
      ? t('asset_library.uncategorised')
      : (folderName(value) ?? ''),
  note: () => t('asset_library.bulk_move_url_description'),
  describeError: (error) => {
    const key = bulkMoveErrorKey(
      getErrorStatus(error),
      getApiErrorTitle(error),
    );
    return key ? t(`asset_library.${key}`) : undefined;
  },
  run: (ids, value, options) =>
    assetApi.bulkMove(ids, folderIdForSelection(value), options),
  // Every chunk answering 204 means nothing had to move.
  successMessage: (count, responses) =>
    responses.every((response) => response === null)
      ? t('asset_library.bulk_already_in_folder')
      : t('asset_library.bulk_moved_to_folder', { count }, count),
}));
const AssetBulkLabels = resolveComponent('AssetBulkLabels');
const { channels: accountChannels } = storeToRefs(useAccountStore());
const channelName = (id: string) => {
  const channel = accountChannels.value.find((c) => c._id === id);
  return channel?.name || id;
};
// Both routes add to each asset's set and never remove, so the confirm says the
// run can't be undone in bulk. Values are normalized the way the backend stores
// them; a 422 names the assets that would pass the per-asset limit.
function labelsAction(kind: 'tags' | 'channels'): BulkAction<string[]> {
  const entityKey = kind === 'tags' ? 'tag' : 'channel';
  const display = (value: string) =>
    kind === 'channels' ? channelName(value) : value;
  return {
    key: `add-${kind}`,
    label: t('add_entity', { entityKey }, 2),
    icon: kind === 'tags' ? 'Tag' : 'Globe',
    component: AssetBulkLabels,
    componentProps: { kind },
    initialValue: () => [],
    isValid: (value) =>
      normalizeAssetLabels(value).length > 0 &&
      !assetLabelLimitError(value, kind),
    summary: (value) => normalizeAssetLabels(value).map(display).join(', '),
    note: () => t('asset_library.bulk_add_note'),
    describeError: (error) => {
      if (getErrorStatus(error) !== 422) return undefined;
      const count = countAssetIds(getApiErrorDetail(error));
      return t(
        `asset_library.bulk_${entityKey}_limit`,
        { count, max: ASSET_LABEL_LIMITS[kind].maxCount },
        count,
      );
    },
    run: (ids, value, options) =>
      kind === 'tags'
        ? assetApi.bulkTag(ids, normalizeAssetLabels(value), options)
        : assetApi.bulkAssignChannels(
            ids,
            normalizeAssetLabels(value),
            options,
          ),
    successMessage: () => t('entity_added', { entityKey }, 2),
  };
}
const AssetBulkLinkProducts = resolveComponent('AssetBulkLinkProducts');
const bulkLinkSummary = (value: AssetBulkLinkValue) => {
  const assets = selectedIds.value.length;
  const products = value.productIds.length;
  const links = assets * products;
  return t('asset_library.bulk_link_summary', {
    assets: t('count_entity', { count: assets, entityKey: 'asset' }, assets),
    products: t(
      'count_entity',
      { count: products, entityKey: 'product' },
      products,
    ),
    links: t('count_entity', { count: links, entityKey: 'link' }, links),
  });
};
// Images and files go in separate calls (a productimage link on a file fails
// the whole call), each capped at 100 links. Linking only adds.
const linkAction = computed<BulkAction<AssetBulkLinkValue>>(() => {
  const composition = assetSelectionKind(
    selectedIds.value.map((id) => knownAssets.get(id)?.type),
  );
  return {
    key: 'link-to-products',
    label: t('asset_library.link_to_products'),
    icon: 'Link2',
    component: AssetBulkLinkProducts,
    componentProps: { composition, summary: bulkLinkSummary },
    initialValue: () => ({
      mode: composition === 'files' ? 'file' : 'byType',
      productIds: [],
    }),
    isValid: (value) => value.productIds.length > 0,
    summary: bulkLinkSummary,
    note: () => t('asset_library.bulk_add_note'),
    run: async (ids, value, options) => {
      const calls = bulkLinkCalls(
        ids,
        (id) => knownAssets.get(id)?.type,
        value.mode,
        value.productIds,
      );
      for (const call of calls)
        await assetApi.bulkLink(call.assetIds, call.links, options);
    },
    successMessage: () => t('entity_added', { entityKey: 'link' }, 2),
  };
});
const tagsAction = computed(() => labelsAction('tags'));
const channelsAction = computed(() => labelsAction('channels'));
const bulkActions = computed<BulkAction[]>(() => [
  tagsAction.value,
  channelsAction.value,
  linkAction.value,
  moveAction.value,
  trashAction.value,
]);
const bulkScopeNote = computed(() =>
  selectedWithSubfolders.value
    ? t('asset_library.bulk_includes_subfolders')
    : undefined,
);

// Failed chunks stay selected so the user can retry just those.
// `asset-tags` too: a bulk tag can coin new tags, and trashing can drop the
// last asset carrying one. `asset-links` so a detail panel shows new links.
async function onBulkDone(result: BulkRunResult) {
  selectedIds.value = result.failed;
  await Promise.all([
    refresh(),
    refreshNuxtData(['asset-tags', 'asset-links']),
  ]);
}

function openAsset(asset: Asset) {
  detailAsset.value = asset;
  detailOpen.value = true;
}

const { copyUrl, download, deleteAsset, restoreAsset, purgeAsset } =
  useAssetActions();
const { downloading, downloadZip } = useAssetZipDownload();
const downloadSelected = () =>
  downloadZip(selectedIds.value.flatMap((id) => knownAssets.get(id) ?? []));
const deleteOpen = ref(false);
const deleting = ref(false);
const pendingDelete = ref<Asset | null>(null);

function requestDelete(asset: Asset) {
  pendingDelete.value = asset;
  deleteOpen.value = true;
}

// Restore refreshes the list inside the action, so the row leaves trash on its
// own — no local bookkeeping.
async function restore(asset: Asset) {
  await restoreAsset(asset);
}

async function confirmDelete() {
  if (!pendingDelete.value) return;
  deleting.value = true;
  const ok = await deleteAsset(pendingDelete.value);
  deleting.value = false;
  if (!ok) return;
  deleteOpen.value = false;
  pendingDelete.value = null;
}

const purgeOpen = ref(false);
const purging = ref(false);
const pendingPurge = ref<Asset | null>(null);

function requestPurge(asset: Asset) {
  pendingPurge.value = asset;
  purgeOpen.value = true;
}

// The row can still list for about a minute after the purge, so drop its id
// from the selection: a later bulk purge would 404 on it once it's gone.
async function confirmPurge() {
  const asset = pendingPurge.value;
  if (!asset) return;
  purging.value = true;
  const ok = await purgeAsset(asset);
  purging.value = false;
  if (!ok) return;
  selectedIds.value = selectedIds.value.filter((id) => id !== asset._id);
  purgeOpen.value = false;
  pendingPurge.value = null;
}

// Empty trash purges the whole trash, not what the search / filters show, so a
// filtered view counts the trash separately for the confirm.
const emptyTrashOpen = ref(false);
const emptyingTrash = ref(false);
const countingTrash = ref(false);
const trashCount = ref(0);
const trashIsEmpty = computed(
  () => !loading.value && !hasActiveQuery.value && total.value === 0,
);

async function requestEmptyTrash() {
  if (!hasActiveQuery.value) {
    trashCount.value = total.value;
    emptyTrashOpen.value = true;
    return;
  }
  countingTrash.value = true;
  try {
    const result = await assetApi.query(
      { page: 1, pageSize: 1, sort: null, search: '', filters: {} },
      assetListOptions(TRASH_KEY),
    );
    trashCount.value = result.totalItemCount;
    emptyTrashOpen.value = true;
  } catch (err) {
    geinsLogError('requestEmptyTrash', getErrorMessage(err));
    toast({
      title: t('error_fetching_entity', { entityKey }, 2),
      variant: 'negative',
    });
  } finally {
    countingTrash.value = false;
  }
}

// Like a single purge, the trash can still list some assets for about a minute.
async function confirmEmptyTrash() {
  emptyingTrash.value = true;
  try {
    const { assetCount } = await assetApi.emptyTrash();
    emptyTrashOpen.value = false;
    clearSelection();
    toast({
      title: t(
        'asset_library.bulk_deleted_permanently',
        { count: assetCount },
        assetCount,
      ),
      variant: 'positive',
    });
    await Promise.all([refresh(), refreshNuxtData(['asset-tags'])]);
  } catch (err) {
    geinsLogError('confirmEmptyTrash', getErrorMessage(err));
  } finally {
    emptyingTrash.value = false;
  }
}
</script>

<template>
  <AssetUploadDialog
    v-model:open="uploadOpen"
    :default-folder-id="uploadFolderId"
  />
  <AssetDetailPanel
    v-model:open="detailOpen"
    :asset="detailAsset"
    @updated="refresh"
    @replaced="detailAsset = $event"
  />

  <DialogDelete
    v-model:open="deleteOpen"
    :entity-key="entityKey"
    :loading="deleting"
    :title="$t('asset_library.trash_confirm_title')"
    :description="
      $t('asset_library.trash_restore_note', { days: TRASH_RETENTION_DAYS }, 1)
    "
    :confirm-label="$t('asset_library.move_to_trash')"
    confirm-variant="default"
    :warning-title="$t('asset_library.removing_everywhere')"
    :warning-description="$t('asset_library.remove_everywhere_description', 1)"
    @confirm="confirmDelete"
    @cancel="deleteOpen = false"
  />
  <DialogDelete
    v-model:open="purgeOpen"
    :entity-key="entityKey"
    :loading="purging"
    :title="$t('asset_library.purge_confirm_title')"
    :confirm-label="$t('asset_library.delete_permanently')"
    @confirm="confirmPurge"
    @cancel="purgeOpen = false"
  />
  <DialogDelete
    v-model:open="emptyTrashOpen"
    :entity-key="entityKey"
    :loading="emptyingTrash"
    :title="$t('asset_library.empty_trash_title')"
    :description="
      $t(
        'asset_library.empty_trash_description',
        { count: trashCount },
        trashCount,
      )
    "
    :confirm-label="$t('asset_library.empty_trash')"
    @confirm="confirmEmptyTrash"
    @cancel="emptyTrashOpen = false"
  />

  <ContentHeader :title="$t(entityKey, 2)">
    <ContentActionBar>
      <!-- Storage summary + details panel (mocked usage; phase-2 API). -->
      <div class="hidden w-64 sm:me-4 sm:block">
        <div class="flex items-center gap-1.5">
          <p class="text-xs whitespace-nowrap">
            <span class="font-semibold">
              {{ formatFileSize(storage.usedBytes) }}
            </span>
            <!-- explicit space: Vue condenses the whitespace between spans -->
            {{ ' ' }}
            <span class="text-muted-foreground">
              {{
                $t('asset_library.storage.of_used', {
                  total: formatFileSize(storage.totalBytes),
                })
              }}
            </span>
          </p>
          <button
            type="button"
            class="text-muted-foreground hover:text-foreground focus-visible:ring-ring shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
            :aria-label="$t('asset_library.storage.title')"
            @click="storageOpen = true"
          >
            <LucideInfo class="size-4" aria-hidden="true" />
          </button>
        </div>
        <Progress :model-value="storageUsedPct" class="mt-1.5 h-1.5" />
      </div>
      <ButtonIcon v-if="!isTrash" icon="upload" @click="uploadOpen = true">
        {{ $t('asset_library.upload_assets') }}
      </ButtonIcon>
      <Button
        v-else
        variant="secondary"
        :loading="countingTrash"
        :disabled="trashIsEmpty"
        @click="requestEmptyTrash"
      >
        <LucideTrash2 v-if="!countingTrash" class="mr-2 size-4" />
        {{ $t('asset_library.empty_trash') }}
      </Button>
    </ContentActionBar>
  </ContentHeader>

  <AssetStoragePanel v-model:open="storageOpen" />

  <ListFilterSheet v-model:open="filterSheetOpen" :list-filters="listFilters" />

  <ListBulkActionSheet
    v-model:open="bulkSheetOpen"
    :actions="bulkActions"
    :ids="selectedIds"
    :entity-key="entityKey"
    :scope-note="bulkScopeNote"
    @done="onBulkDone"
  />
  <ListBulkActionConfirm
    v-model:open="bulkTrashOpen"
    :action="barAction"
    :ids="selectedIds"
    :entity-key="entityKey"
    :scope-note="bulkScopeNote"
    @done="onBulkDone"
  />

  <!-- Toolbar: folder toggle + search + filters (left), view toggle (right) -->
  <div class="flex flex-wrap items-center gap-2">
    <Button
      variant="outline"
      size="icon"
      :class="segmentedButtonClass(showFolders)"
      :aria-label="$t('folder', 2)"
      :aria-pressed="showFolders"
      @click="showFolders = !showFolders"
    >
      <LucideFolder class="size-4" aria-hidden="true" />
    </Button>
    <Input
      v-model="searchInput"
      :placeholder="$t('search')"
      class="order-2 w-full sm:order-1 sm:w-64"
    />
    <ListFilterBar
      :list-filters="listFilters"
      class="order-3 w-full sm:order-1 sm:w-auto"
      @open-all="filterSheetOpen = true"
    />
    <ListBulkBar
      v-if="selectedIds.length"
      :count="selectedIds.length"
      :total="total"
      :can-select-all="canSelectAll"
      :selecting-all="selectingAll"
      class="order-4 w-full sm:order-1 sm:w-auto"
      @select-all="selectAllMatching"
      @clear="clearSelection"
    >
      <Button
        v-if="!isTrash"
        variant="link"
        size="sm"
        @click="bulkSheetOpen = true"
      >
        {{ $t('choose_action') }}
      </Button>
      <Button
        v-if="!isTrash"
        variant="link"
        size="sm"
        class="gap-1"
        :disabled="downloading"
        @click="downloadSelected"
      >
        <LucideDownload class="size-3.5" aria-hidden="true" />
        {{ $t('download') }}
      </Button>
      <Button
        variant="link"
        size="sm"
        class="gap-1"
        @click="bulkTrashOpen = true"
      >
        <LucideTrash2 class="size-3.5" aria-hidden="true" />
        {{ barAction.label }}
      </Button>
    </ListBulkBar>
    <ButtonGroup class="order-1 ml-auto sm:order-2">
      <Button
        variant="outline"
        size="icon"
        :class="segmentedButtonClass(view === 'grid')"
        :aria-label="$t('grid_view')"
        :aria-pressed="view === 'grid'"
        @click="view = 'grid'"
      >
        <LucideLayoutGrid class="size-4" aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        :class="segmentedButtonClass(view === 'list')"
        :aria-label="$t('list_view')"
        :aria-pressed="view === 'list'"
        @click="view = 'list'"
      >
        <LucideList class="size-4" aria-hidden="true" />
      </Button>
    </ButtonGroup>
  </div>

  <p v-if="isTrash" class="text-muted-foreground mt-2 text-xs">
    {{ retentionNote }}
  </p>

  <SidebarProvider
    class="relative mt-4 -mb-12 min-h-0! flex-1 items-stretch gap-4 @2xl:-mb-14"
  >
    <!-- Below sm the folder panel overlays the grid (see the Sidebar's
         absolute/sm:relative classes) instead of stealing 256px of width, so
         this backdrop dismisses it. Hidden at sm+ where the panel is inline. -->
    <div
      v-if="showFolders"
      class="absolute inset-0 z-30 bg-black/40 sm:hidden"
      aria-hidden="true"
      @click="showFolders = false"
    />
    <Transition name="folder-panel">
      <Sidebar
        v-if="showFolders"
        collapsible="none"
        class="absolute inset-y-0 left-0 z-40 w-(--sidebar-width) shrink-0 self-stretch overflow-y-auto shadow-xl sm:relative sm:inset-auto sm:z-auto sm:bg-transparent! sm:shadow-none"
      >
        <AssetFolderTree v-model:selected="selectedFolder" />
      </Sidebar>
    </Transition>

    <!-- LIST VIEW: flex column so TableView's `.table-view` is a flex child —
         it hugs content when short (its own overflow-hidden zeroes its flex
         min-height) and shrinks to scroll internally with a floating header +
         pinned pagination once it's taller than the viewport, matching the
         regular list pages. -->
    <div
      v-if="view === 'list'"
      class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <NuxtErrorBoundary>
        <TableView
          v-model:selected-ids="selectedIds"
          v-model:pagination="pagination"
          v-model:sorting="sorting"
          :loading="loading"
          :entity-key="entityKey"
          :columns="columns"
          data-source="server"
          :data="items"
          :row-count="total"
          :filtered="hasActiveQuery"
          :page-sizes="PAGE_SIZES"
          :error="fetchError"
          :on-retry="refresh"
          :mode="listMode"
          :show-search="false"
          :empty-icon="emptyIcon"
          :empty-text="emptyTitle"
          :empty-description="emptyDescription"
          @clear-filters="clearQuery"
        />
      </NuxtErrorBoundary>
    </div>

    <!-- GRID VIEW: only the grid body scrolls; pagination is a fixed footer -->
    <div v-else class="flex min-h-0 min-w-0 flex-1 flex-col">
      <label
        v-if="!loading && !fetchError && items.length"
        class="text-muted-foreground flex w-fit cursor-pointer items-center gap-2 pb-3 text-xs"
      >
        <Checkbox
          :model-value="pageCheckState"
          data-test="asset-grid-select-page"
          @update:model-value="togglePage"
        />
        {{ $t('select_all_on_page') }}
      </label>
      <div class="min-h-0 flex-1 overflow-y-auto pb-4">
        <div
          v-if="loading"
          class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 p-0.5 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
        >
          <AssetCardSkeleton v-for="n in 8" :key="n" />
        </div>

        <!-- Grid canvas is the gray page background, so the state sits directly
             on it (no Card) — the list view gets the white surface via
             TableView's `.table-view`. Copy + shape mirror TableView. -->
        <Empty v-else-if="fetchError" class="mt-12">
          <EmptyHeader>
            <EmptyMedia variant="destructive">
              <LucideCircleAlert />
            </EmptyMedia>
            <EmptyTitle>
              {{ $t('error_fetching_entity', { entityKey }, 2) }}
            </EmptyTitle>
            <EmptyDescription>
              {{ $t('error_empty_description') }}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <ButtonIcon icon="retry" variant="secondary" @click="refresh">
              {{ $t('retry') }}
            </ButtonIcon>
          </EmptyContent>
        </Empty>

        <Empty v-else-if="!items.length" class="mt-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <component :is="emptyIcon" />
            </EmptyMedia>
            <EmptyTitle>{{ emptyTitle }}</EmptyTitle>
            <EmptyDescription>{{ emptyDescription }}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent v-if="hasActiveQuery">
            <Button variant="secondary" @click="clearQuery">
              {{ $t('clear_search') }}
            </Button>
          </EmptyContent>
        </Empty>

        <div
          v-else
          class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 p-0.5 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
        >
          <AssetCard
            v-for="asset in items"
            :key="asset._id"
            :asset="asset"
            :folder-name="folderName(asset.folderId)"
            :trashed="isTrash"
            selectable
            :select-on-click="false"
            :selected="selectedSet.has(asset._id)"
            @open="openAsset(asset)"
            @download="download(asset)"
            @copy-url="copyUrl(asset)"
            @delete="requestDelete(asset)"
            @restore="restore(asset)"
            @purge="requestPurge(asset)"
            @toggle-select="toggleSelect(asset._id)"
          />
        </div>
      </div>

      <PaginationBar
        v-if="!loading && !fetchError && items.length"
        :page="page"
        :page-size="pageSize"
        :total="total"
        :entity-key="entityKey"
        :page-sizes="PAGE_SIZES"
        class="shrink-0"
        @update:page="page = $event"
        @update:page-size="pageSize = $event"
      />
    </div>
  </SidebarProvider>
</template>

<style scoped>
/* Slide the folder panel in/out by animating its width (grid reflows with it). */
.folder-panel-enter-active,
.folder-panel-leave-active {
  overflow: hidden;
  transition:
    width 200ms ease,
    opacity 200ms ease;
}
.folder-panel-enter-from,
.folder-panel-leave-to {
  width: 0 !important;
  opacity: 0;
}
</style>
