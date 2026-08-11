<script setup lang="ts">
import type { Asset } from '#shared/types';
import { TableMode } from '#shared/types';
import { ENTITIES } from '#shared/utils/entities';
import { cn } from '@/utils/index';
import type { ColumnDef } from '@tanstack/vue-table';

const { t } = useI18n();
const { assetApi } = useGeinsRepository();
const { getColumns, getBasicCellStyle, getBasicHeaderStyle } =
  useColumns<Asset>();
const { folderName } = useFolders();
const entityKey = ENTITIES.asset.key;

const loading = ref(true);
const fetchError = ref(false);
const dataList = ref<Asset[]>([]);

const view = ref<'grid' | 'list'>('grid');
const search = ref('');
const showFolders = ref(false);
// Selected folder id (null = All assets); drives the server-side filter.
const selectedFolder = ref<string | null>(null);
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

// Grid client-side pagination (list view paginates via TableView).
const GRID_PAGE_SIZE = 30;
const page = ref(1);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / GRID_PAGE_SIZE)),
);
watch([filtered, view], () => {
  if (page.value > pageCount.value) page.value = 1;
});
watch(selectedFolder, () => {
  page.value = 1;
});
const pagedAssets = computed(() =>
  filtered.value.slice(
    (page.value - 1) * GRID_PAGE_SIZE,
    page.value * GRID_PAGE_SIZE,
  ),
);

// List columns — useColumns generates tags + modified; the type-badge,
// thumbnail, name-opens-panel, and byte-formatted size need custom cells, so
// they are defined explicitly and prepended.
const TableCellAssetThumbnail = resolveComponent('TableCellAssetThumbnail');
const AssetTypeBadge = resolveComponent('AssetTypeBadge');

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

  const order = [
    'thumb',
    'name',
    'type',
    'folderId',
    'sizeBytes',
    'tags',
    'updatedAt',
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

  <SidebarProvider class="mt-4 min-h-0! items-start gap-4">
    <Transition name="folder-panel">
      <Sidebar
        v-if="showFolders"
        collapsible="none"
        class="w-(--sidebar-width) shrink-0 self-stretch bg-transparent!"
      >
        <AssetFolderTree v-model:selected="selectedFolder" />
      </Sidebar>
    </Transition>

    <div class="min-w-0 flex-1 pb-8">
      <!-- LIST VIEW -->
      <NuxtErrorBoundary v-if="view === 'list'">
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

      <!-- GRID VIEW -->
      <template v-else>
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

        <template v-else>
          <div
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
          <div
            v-if="pageCount > 1"
            class="mt-6 flex items-center justify-end gap-3"
          >
            <span class="text-muted-foreground text-sm">
              {{ $t('page_of', { page, total: pageCount }) }}
            </span>
            <Button
              variant="outline"
              size="icon"
              :disabled="page <= 1"
              :aria-label="$t('previous')"
              @click="page--"
            >
              <LucideChevronLeft class="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              :disabled="page >= pageCount"
              :aria-label="$t('next')"
              @click="page++"
            >
              <LucideChevronRight class="size-4" />
            </Button>
          </div>
        </template>
      </template>
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
