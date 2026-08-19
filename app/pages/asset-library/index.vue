<script setup lang="ts">
import type { Asset } from '#shared/types';
import { TableMode } from '#shared/types';
import { ENTITIES } from '#shared/utils/entities';
import { cn } from '@/utils/index';
import type { ColumnDef } from '@tanstack/vue-table';

// Fixed-height list layout: header + toolbar + folder nav + pagination stay put;
// only the grid/table body scrolls (default.vue → overflow-hidden).
definePageMeta({ pageType: 'list' });

const { t } = useI18n();
const { assetApi } = useGeinsRepository();
const { getColumns, getBasicCellStyle, getBasicHeaderStyle } =
  useColumns<Asset>();
const { folderName } = useFolders();
const entityKey = ENTITIES.asset.key;
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const fetchError = ref(false);
const dataList = ref<Asset[]>([]);

const view = ref<'grid' | 'list'>('grid');
const search = ref('');
const showFolders = ref(false);
// Selected folder id (null = All assets); drives the server-side filter.
// Browse state (folder + page + page size) is restored from / synced to the URL.
const selectedFolder = ref<string | null>(
  (route.query.folder as string) || null,
);
const uploadOpen = ref(false);
const detailOpen = ref(false);
const detailAsset = ref<Asset | null>(null);

// const enum is erased at runtime — resolve to a value in script (not template).
const listMode = TableMode.Simple;
const columns = ref<ColumnDef<Asset>[]>([]);

const { data, error, refresh } = await useAsyncData<Asset[]>(
  'asset-library-list',
  () =>
    assetApi.list(
      selectedFolder.value ? { folderId: selectedFolder.value } : undefined,
    ),
  { watch: [selectedFolder] },
);

// Shared name filter across both views (the page owns search, so TableView's
// built-in search is disabled below).
const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return dataList.value;
  return dataList.value.filter((asset) =>
    asset.name.toLowerCase().includes(term),
  );
});

// Grid pagination (list view paginates via TableView). Page + size live in the
// URL (?page, ?perPage) so a link opens the exact page.
const GRID_PAGE_SIZES = [24, 48, 96];
const DEFAULT_PAGE_SIZE = 24;
const clampPageSize = (value: number) =>
  GRID_PAGE_SIZES.includes(value) ? value : DEFAULT_PAGE_SIZE;
const pageSize = ref(clampPageSize(Number(route.query.perPage)));
const page = ref(Math.max(1, Number(route.query.page) || 1));

const pageCount = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize.value)),
);
const pagedAssets = computed(() => {
  const current = Math.min(page.value, pageCount.value);
  return filtered.value.slice(
    (current - 1) * pageSize.value,
    current * pageSize.value,
  );
});

// User-driven changes to the result set / size go back to page 1 (not on load,
// so a deep-linked ?page survives the initial fetch).
watch([search, selectedFolder, pageSize], () => {
  page.value = 1;
});

// Mirror browse state to the URL (omit defaults to keep it clean).
watch([selectedFolder, page, pageSize], () => {
  const query: Record<string, string> = {};
  if (selectedFolder.value) query.folder = selectedFolder.value;
  if (page.value > 1) query.page = String(page.value);
  if (pageSize.value !== DEFAULT_PAGE_SIZE) {
    query.perPage = String(pageSize.value);
  }
  router.replace({ query });
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
  const cols = getColumns(rows, {
    includeColumns: [
      'name',
      'type',
      'folderId',
      'sizeBytes',
      'tags',
      'updatedAt',
    ],
    columnTitles: {
      name: t('name', 1),
      type: t('type'),
      folderId: t('folder', 1),
      sizeBytes: t('size'),
      tags: t('tag', 2),
      updatedAt: t('modified'),
    },
    columnTypes: { sizeBytes: 'filesize', tags: 'tags', updatedAt: 'date' },
  });

  const folderCol = cols.find((col) => col.id === 'folderId');
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

  const nameCol = cols.find((col) => col.id === 'name');
  if (nameCol) {
    nameCol.cell = ({ table, row }) =>
      h(
        'div',
        { class: getBasicCellStyle(table) },
        h(
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
        thumbUrl: row.original.thumbUrl,
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
          onOpen: () => openAsset(row.original),
          onDownload: () => download(row.original),
          onCopyUrl: () => copyUrl(row.original),
          onDelete: () => requestDelete(row.original),
        }),
      ),
    meta: { type: 'actions' },
  });

  const order = [
    'thumb',
    'name',
    'type',
    'folderId',
    'sizeBytes',
    'tags',
    'updatedAt',
    'actions',
  ];
  return order
    .map((id) => cols.find((col) => col.id === id))
    .filter((col): col is ColumnDef<Asset> => col !== undefined);
}

onMounted(() => {
  watch(
    [data, error],
    ([newData, newError]) => {
      if (newError) {
        fetchError.value = true;
        dataList.value = [];
        columns.value = buildColumns([]);
        return;
      }
      fetchError.value = false;
      dataList.value = Array.isArray(newData) ? newData : [];
      columns.value = buildColumns(dataList.value);
      // Clamp a deep-linked / stale page once the data (and page count) is known.
      if (page.value > pageCount.value) page.value = pageCount.value;
    },
    { immediate: true },
  );
  loading.value = false;
});

function openAsset(asset: Asset) {
  detailAsset.value = asset;
  detailOpen.value = true;
}

const { copyUrl, download, deleteAsset } = useAssetActions();
const deleteOpen = ref(false);
const deleting = ref(false);
const pendingDelete = ref<Asset | null>(null);

function requestDelete(asset: Asset) {
  pendingDelete.value = asset;
  deleteOpen.value = true;
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
</script>

<template>
  <AssetUploadDialog
    v-model:open="uploadOpen"
    :default-folder-id="selectedFolder"
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
    @confirm="confirmDelete"
    @cancel="deleteOpen = false"
  />

  <ContentHeader :title="$t(entityKey, 2)">
    <ContentActionBar>
      <ButtonIcon icon="upload" @click="uploadOpen = true">
        {{ $t('upload_assets') }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>

  <!-- Toolbar: folder toggle + search (left), view toggle (right) -->
  <div class="flex flex-wrap items-center gap-2">
    <Button
      :variant="showFolders ? 'default' : 'outline'"
      size="icon"
      :aria-label="$t('folder', 2)"
      @click="showFolders = !showFolders"
    >
      <LucideFolder class="size-4" />
    </Button>
    <Input
      v-model="search"
      :placeholder="$t('search')"
      class="w-full sm:w-64"
    />
    <ButtonGroup class="ml-auto">
      <Button
        :variant="view === 'grid' ? 'default' : 'outline'"
        size="icon"
        :aria-label="$t('grid_view')"
        @click="view = 'grid'"
      >
        <LucideLayoutGrid class="size-4" />
      </Button>
      <Button
        :variant="view === 'list' ? 'default' : 'outline'"
        size="icon"
        :aria-label="$t('list_view')"
        @click="view = 'list'"
      >
        <LucideList class="size-4" />
      </Button>
    </ButtonGroup>
  </div>

  <SidebarProvider
    class="mt-4 -mb-12 min-h-0! flex-1 items-stretch gap-4 @2xl:-mb-14"
  >
    <Transition name="folder-panel">
      <Sidebar
        v-if="showFolders"
        collapsible="none"
        class="w-(--sidebar-width) shrink-0 self-stretch overflow-y-auto bg-transparent!"
      >
        <AssetFolderTree v-model:selected="selectedFolder" />
      </Sidebar>
    </Transition>

    <!-- LIST VIEW: bound the height so TableView's container scrolls internally -->
    <div
      v-if="view === 'list'"
      class="min-h-0 min-w-0 flex-1 overflow-hidden [&_.table-view]:h-full"
    >
      <NuxtErrorBoundary>
        <TableView
          :loading="loading"
          :entity-key="entityKey"
          :columns="columns"
          :data="filtered"
          :error="fetchError"
          :on-retry="refresh"
          :mode="listMode"
          :show-search="false"
        />
      </NuxtErrorBoundary>
    </div>

    <!-- GRID VIEW: only the grid body scrolls; pagination is a fixed footer -->
    <div v-else class="flex min-h-0 min-w-0 flex-1 flex-col">
      <div class="min-h-0 flex-1 overflow-y-auto pb-4">
        <div
          v-if="loading"
          class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4"
        >
          <Skeleton
            v-for="n in 8"
            :key="n"
            class="aspect-[4/5] w-full rounded-xl"
          />
        </div>

        <Card v-else-if="fetchError">
          <CardContent class="p-0">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="destructive">
                  <LucideTriangleAlert />
                </EmptyMedia>
                <EmptyTitle>{{ $t('error_loading_data') }}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <ButtonIcon icon="retry" variant="secondary" @click="refresh">
                  {{ $t('retry') }}
                </ButtonIcon>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>

        <Card v-else-if="!filtered.length">
          <CardContent class="p-0">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LucideFolderOpen />
                </EmptyMedia>
                <EmptyTitle>
                  {{
                    selectedFolder
                      ? $t('no_assets_in_folder')
                      : $t('no_entity', { entityKey }, 2)
                  }}
                </EmptyTitle>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>

        <div
          v-else
          class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4"
        >
          <AssetCard
            v-for="asset in pagedAssets"
            :key="asset._id"
            :asset="asset"
            :folder-name="folderName(asset.folderId)"
            @open="openAsset(asset)"
            @download="download(asset)"
            @copy-url="copyUrl(asset)"
            @delete="requestDelete(asset)"
          />
        </div>
      </div>

      <PaginationBar
        v-if="!loading && !fetchError && filtered.length"
        :page="page"
        :page-size="pageSize"
        :total="filtered.length"
        :entity-key="entityKey"
        :page-sizes="GRID_PAGE_SIZES"
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
