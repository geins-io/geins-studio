<script setup lang="ts">
import type {
  Asset,
  AssetQueryFilters,
  AssetType,
  ListSort,
} from '#shared/types';
import { TableMode } from '#shared/types';
import { assetListOptions } from '#shared/utils/asset';
import { ENTITIES } from '#shared/utils/entities';
import { cn } from '@/utils/index';
import type { ColumnDef } from '@tanstack/vue-table';

/**
 * Wide slide-in panel that browses the asset library and lets the user pick one
 * or many assets to LINK onto an entity — it never copies, so the library stays
 * the single source of truth. Composed from the same pieces as the library page
 * (AssetFolderTree, AssetCard, TableView, PaginationBar) plus a selection layer.
 *
 * Not a PanelEdit: a picker has no unsaved-changes semantics, so it uses a plain
 * wide Sheet with a custom footer. The public trigger API (composable + wrapper)
 * lands in a follow-up issue; here `open` is driven directly.
 */
const props = withDefaults(
  defineProps<{
    /** Single vs multi-select. Single = a new pick replaces the selection. */
    multiple?: boolean;
    /** Allowed types. `null` = all; e.g. `['image']` = images only. Assets outside are filtered out. */
    types?: AssetType[] | null;
    /** Already-linked assets — shown checked with a "linked" tag; the confirm button counts only NEW picks. */
    preselectedIds?: string[];
    title?: string;
    /** Initial folder scope (server-side filter). */
    folderId?: string | null;
  }>(),
  {
    multiple: true,
    types: null,
    preselectedIds: () => [],
    title: undefined,
    folderId: null,
  },
);

const emit = defineEmits<{
  confirm: [assets: Asset[]];
}>();

const open = defineModel<boolean>('open', { default: false });

const { t } = useI18n();
const { geinsLogError } = useGeinsLog('AssetPickerPanel');
const { assetApi } = useGeinsRepository();
const { folderName } = useFolders();
const { resolveIcon } = useLucideIcon();
const { getColumns, getBasicCellStyle, getBasicHeaderStyle } =
  useColumns<Asset>();

const entityKey = ENTITIES.asset.key;
const listMode = TableMode.Simple;

// "Recently added" is a virtual folder — a sentinel that matches no real folder
// id, so the tree highlights nothing while the quick item is active.
const RECENT_SENTINEL = '__recent__';
const RECENT_SORT: ListSort = { field: 'createdAt', direction: 'desc' };
const PAGE_SIZES = [12, 24, 48];
const DEFAULT_PAGE_SIZE = 24;

// ── Browse state (reset each time the panel opens) ──────────────────────────
const view = ref<'grid' | 'list'>('grid');
const recent = ref(false);
const selectedFolder = ref<string | null>(props.folderId ?? null);
const selectedIds = ref<string[]>([]);
const uploadOpen = ref(false);

// Files-only pickers (no images) default to list — you pick documents by
// name/type/date, not by thumbnail. Everything else defaults to grid.
const defaultView = (): 'grid' | 'list' =>
  props.types && !props.types.includes('image') ? 'list' : 'grid';

// ── Data ────────────────────────────────────────────────────────────────────
// One server-driven query feeds both views. `types` is a fixed filter added in
// the fetcher rather than a list filter, so it is always sent and never counts
// as an active (clearable) query.
const {
  items,
  total,
  pending,
  error,
  page,
  pageSize,
  sort,
  searchInput,
  hasActiveQuery,
  pagination,
  sorting,
  refresh,
} = useListQuery<Asset, AssetQueryFilters>({
  key: 'asset-picker-list',
  fetcher: (state, options) =>
    assetApi.query(
      props.types
        ? { ...state, filters: { ...state.filters, assetTypes: props.types } }
        : state,
      assetListOptions(selectedFolder.value),
      options,
    ),
  defaults: { filters: {}, pageSize: DEFAULT_PAGE_SIZE },
  pageSizes: PAGE_SIZES,
  deps: () => [selectedFolder.value, props.types],
  immediate: false,
  lazy: true,
});

// The last open's rows may be for another scope or types, so skeleton until
// this open's first fetch lands; after that, page changes keep rows on screen.
const opening = ref(false);
watch(pending, (isPending) => {
  if (!isPending) opening.value = false;
});
const loading = computed(
  () => pending.value && (opening.value || !items.value.length),
);
const fetchError = computed(() => !!error.value);

// Selection lives in `selectedIds` for both views. `seen` resolves ids to
// assets across pages and folders; a selected id that was never loaded (e.g.
// a preselected asset on another page) is resolved on confirm.
const seen = ref<Record<string, Asset>>({});
function remember(assets: Asset[]) {
  const next = { ...seen.value };
  for (const asset of assets) next[asset._id] = asset;
  seen.value = next;
}
watch(items, remember);

// ── Selection ────────────────────────────────────────────────────────────────
function toggle(id: string) {
  if (!props.multiple) {
    selectedIds.value = selectedIds.value.includes(id) ? [] : [id];
    return;
  }
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((x) => x !== id)
    : [...selectedIds.value, id];
}

// Server-mode TableView seeds its selection from `selectedIds` and emits the
// whole set back, picks on other pages and folders included. Only multi-select
// lists have a select column, so this never sees a single-select pick.
function onListSelectedIds(ids: string[]) {
  selectedIds.value = ids;
}

const isPreselected = (id: string) => props.preselectedIds.includes(id);
const newCount = computed(
  () => selectedIds.value.filter((id) => !isPreselected(id)).length,
);

// Noun for the footer counts, derived from the allowed types.
const noun = computed<'image' | 'file' | 'asset'>(() => {
  const types = props.types;
  if (!types) return 'asset';
  if (types.length === 1 && types[0] === 'image') return 'image';
  if (!types.includes('image')) return 'file';
  return 'asset';
});

const selectedLabel = computed(() =>
  selectedIds.value.length === 0
    ? t('asset_library.picker_nothing_selected')
    : t(
        `asset_library.picker_selected_${noun.value}`,
        { count: selectedIds.value.length },
        selectedIds.value.length,
      ),
);
const addLabel = computed(() =>
  t(
    `asset_library.picker_add_${noun.value}`,
    { count: newCount.value },
    newCount.value,
  ),
);
const panelTitle = computed(
  () => props.title || t('asset_library.picker_title'),
);

// ── Folder rail ──────────────────────────────────────────────────────────────
// "Recently added" is every asset, newest first. Picking a folder drops that
// sort unless the user has since sorted by a column.
const treeSelected = computed<string | null>({
  get: () => (recent.value ? RECENT_SENTINEL : selectedFolder.value),
  set: (value) => {
    if (recent.value && sort.value?.field === RECENT_SORT.field)
      sort.value = null;
    recent.value = false;
    selectedFolder.value = value;
  },
});
function selectRecent() {
  recent.value = true;
  selectedFolder.value = null;
  sort.value = RECENT_SORT;
}

// ── List columns ─────────────────────────────────────────────────────────────
const TableCellAssetThumbnail = resolveComponent('TableCellAssetThumbnail');
const AssetTypeBadge = resolveComponent('AssetTypeBadge');

function buildListColumns(rows: Asset[]): ColumnDef<Asset>[] {
  const cols = getColumns(rows, {
    selectable: props.multiple,
    includeColumns: ['name', 'type', 'folderPath', 'sizeBytes', 'updatedAt'],
    columnTitles: {
      name: t('name', 1),
      type: t('type'),
      folderPath: t('folder', 1),
      sizeBytes: t('size'),
      updatedAt: t('modified'),
    },
    columnTypes: { sizeBytes: 'filesize', updatedAt: 'date' },
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

  const typeCol = cols.find((col) => col.id === 'type');
  if (typeCol) {
    typeCol.cell = ({ table, row }) =>
      h(
        'div',
        { class: getBasicCellStyle(table) },
        h(AssetTypeBadge, { type: row.original.type }),
      );
  }

  // Fixed-width leading thumbnail — same size/style as the library list.
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

  const order = [
    'select',
    'thumb',
    'name',
    'type',
    'folderPath',
    'sizeBytes',
    'updatedAt',
  ];
  return order
    .map((id) => cols.find((col) => col.id === id))
    .filter((col): col is ColumnDef<Asset> => col !== undefined);
}

// `getColumns` derives the keys from a row, so keep the last set when a query
// comes back empty — the empty state spans `columns.length`.
const listColumns = ref<ColumnDef<Asset>[]>([]);
watch(
  items,
  (rows) => {
    if (rows.length || !listColumns.value.length)
      listColumns.value = buildListColumns(rows);
  },
  { immediate: true },
);

// ── Empty state (grid; TableView owns the list one) ─────────────────────────
const emptyIcon = computed(
  () =>
    resolveIcon(hasActiveQuery.value ? 'SearchX' : 'FolderOpen') ?? undefined,
);
const emptyTitle = computed(() =>
  hasActiveQuery.value
    ? t('no_entity_found', { entityKey }, 2)
    : t('no_entity', { entityKey }, 2),
);
const emptyDescription = computed(() =>
  hasActiveQuery.value
    ? t('empty_filtered_description', { entityKey }, 2)
    : t('empty_description', { entityKey }, 2),
);

// ── Lifecycle ────────────────────────────────────────────────────────────────
watch(
  open,
  (isOpen) => {
    if (!isOpen) return;
    view.value = defaultView();
    recent.value = false;
    selectedFolder.value = props.folderId ?? null;
    searchInput.value = '';
    sort.value = null;
    pageSize.value = DEFAULT_PAGE_SIZE;
    page.value = 1;
    selectedIds.value = [...props.preselectedIds];
    seen.value = {};
    uploadOpen.value = false;
    opening.value = true;
    refresh();
  },
  { immediate: true },
);

// Quick-upload success: the new assets are already in the library. Seed them so
// they resolve immediately, auto-select the ones matching this picker's types,
// flip the rail to "Recently added" (newest first, so they lead) and refetch.
function handleUploaded(assets: Asset[]) {
  remember(assets);

  const matching = assets.filter(
    (asset) => !props.types || props.types!.includes(asset.type),
  );
  const ids = matching.map((asset) => asset._id);
  if (ids.length) {
    selectedIds.value = props.multiple
      ? [...new Set([...selectedIds.value, ...ids])]
      : [ids[0]!];
  }

  selectRecent();
  refresh();
}

const confirming = ref(false);
async function confirmSelection() {
  const missing = selectedIds.value.filter((id) => !seen.value[id]);
  if (missing.length) {
    confirming.value = true;
    try {
      remember(await assetApi.byIds(missing));
    } catch (err) {
      // Stay open: confirming without them would unlink them from the entity.
      // The global error toast reports the failure.
      geinsLogError('could not resolve the selected assets', err);
      return;
    } finally {
      confirming.value = false;
    }
  }
  // Ids still unresolved are no longer live assets (trashed or deleted).
  emit(
    'confirm',
    selectedIds.value
      .map((id) => seen.value[id])
      .filter((asset): asset is Asset => !!asset),
  );
  open.value = false;
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent width="wide" class="gap-0 p-0">
      <SheetHeader>
        <SheetTitle>{{ panelTitle }}</SheetTitle>
        <SheetDescription>
          {{ $t('asset_library.picker_subtitle') }}
        </SheetDescription>
      </SheetHeader>

      <!-- Library header + inline upload entry (spans the rail + main split) -->
      <div class="flex items-center justify-between border-b px-4 py-2.5">
        <span class="text-sm font-bold">
          {{ $t('asset_library.picker_library') }}
        </span>
        <ButtonIcon
          icon="upload"
          variant="outline"
          size="sm"
          @click="uploadOpen = true"
        >
          {{ $t('asset_library.picker_upload_new') }}
        </ButtonIcon>
      </div>

      <SidebarProvider
        class="min-h-0! flex-1 items-stretch gap-0 overflow-hidden"
      >
        <!-- Folder rail: "Recently added" quick item stacked above the tree -->
        <Sidebar
          collapsible="none"
          class="w-56 shrink-0 self-stretch overflow-y-auto border-r bg-transparent!"
        >
          <div class="px-2 pt-3">
            <button
              type="button"
              :class="
                cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  recent
                    ? 'bg-card font-medium shadow-sm'
                    : 'text-muted-foreground hover:bg-muted',
                )
              "
              :aria-pressed="recent"
              @click="selectRecent"
            >
              <LucideClock class="size-4 shrink-0" aria-hidden="true" />
              {{ $t('asset_library.picker_recently_added') }}
            </button>
          </div>
          <AssetFolderTree v-model:selected="treeSelected" readonly />
        </Sidebar>

        <!-- Main: toolbar + body + (grid) pagination -->
        <main class="flex min-h-0 min-w-0 flex-1 flex-col">
          <div class="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <Input
              v-model="searchInput"
              :placeholder="$t('search')"
              class="order-2 w-full sm:order-1 sm:w-64"
            />

            <span class="text-muted-foreground order-3 ml-auto text-xs">
              {{ $t('rows_total', { total, entityKey }, total) }}
            </span>

            <ButtonGroup class="order-1 sm:order-4">
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

          <!-- LIST VIEW -->
          <div
            v-if="view === 'list'"
            class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-4"
          >
            <NuxtErrorBoundary>
              <TableView
                v-model:pagination="pagination"
                v-model:sorting="sorting"
                :loading="loading"
                :entity-key="entityKey"
                :columns="listColumns"
                data-source="server"
                :data="items"
                :row-count="total"
                :filtered="hasActiveQuery"
                :page-sizes="PAGE_SIZES"
                :error="fetchError"
                :on-retry="refresh"
                :mode="listMode"
                :show-search="false"
                :pinned-state="{}"
                :selected-ids="selectedIds"
                :empty-icon="emptyIcon"
                :empty-text="emptyTitle"
                :empty-description="emptyDescription"
                @update:selected-ids="onListSelectedIds"
                @clear-filters="searchInput = ''"
              />
            </NuxtErrorBoundary>
          </div>

          <!-- GRID VIEW -->
          <div v-else class="flex min-h-0 min-w-0 flex-1 flex-col">
            <div class="min-h-0 flex-1 overflow-y-auto p-4">
              <div
                v-if="loading"
                class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]"
              >
                <AssetCardSkeleton v-for="n in 8" :key="n" />
              </div>

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
              </Empty>

              <div
                v-else
                class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]"
              >
                <div v-for="asset in items" :key="asset._id" class="relative">
                  <Badge
                    v-if="isPreselected(asset._id)"
                    size="sm"
                    variant="slate"
                    class="absolute top-2 right-2 z-10"
                  >
                    {{ $t('asset_library.picker_linked') }}
                  </Badge>
                  <AssetCard
                    selectable
                    hide-actions
                    :asset="asset"
                    :selected="selectedIds.includes(asset._id)"
                    :folder-name="folderName(asset.folderId) ?? undefined"
                    @toggle-select="toggle(asset._id)"
                  />
                </div>
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
        </main>
      </SidebarProvider>

      <SheetFooter>
        <span class="text-muted-foreground self-center text-sm">
          {{ selectedLabel }}
        </span>
        <div class="flex items-center gap-2">
          <Button variant="outline" @click="open = false">
            {{ $t('cancel') }}
          </Button>
          <Button
            data-test="asset-picker-confirm"
            :disabled="newCount === 0"
            :loading="confirming"
            @click="confirmSelection"
          >
            {{ addLabel }}
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>

  <!-- Quick-upload only — the wizard would navigate away and abandon the picker. -->
  <AssetUploadDialog
    v-model:open="uploadOpen"
    :methods="['quick']"
    :multiple="multiple"
    :default-folder-id="folderId"
    @uploaded="handleUploaded"
  />
</template>
