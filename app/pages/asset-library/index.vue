<script setup lang="ts">
import type { Asset } from '#shared/types';
import { TableMode } from '#shared/types';
import { ENTITIES } from '#shared/utils/entities';
import { formatFileSize } from '#shared/utils/file';
import type { ColumnDef } from '@tanstack/vue-table';

definePageMeta({ pageType: 'list' });

const { t } = useI18n();
const { assetApi } = useGeinsRepository();
const { formatDate } = useDate();
const entityKey = ENTITIES.asset.key;

const loading = ref(true);
const fetchError = ref(false);
const dataList = ref<Asset[]>([]);

const view = ref<'grid' | 'list'>('grid');
const search = ref('');

// const enum is erased at runtime — resolve to a value in script (not template).
const listMode = TableMode.Simple;

const { data, error, refresh } = await useAsyncData<Asset[]>(
  'asset-library-list',
  () => assetApi.list(),
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
const pagedAssets = computed(() =>
  filtered.value.slice(
    (page.value - 1) * GRID_PAGE_SIZE,
    page.value * GRID_PAGE_SIZE,
  ),
);

// List columns — custom cells for thumbnail + type badge (resolveComponent so
// the auto-imported components can be used inside render functions).
const AssetThumbnail = resolveComponent('AssetThumbnail');
const AssetTypeBadge = resolveComponent('AssetTypeBadge');

const columns: ColumnDef<Asset>[] = [
  {
    id: 'thumb',
    header: '',
    enableSorting: false,
    cell: ({ row }) =>
      h(AssetThumbnail, {
        type: row.original.type,
        thumbUrl: row.original.thumbUrl,
        alt: row.original.name,
        size: 'row',
      }),
  },
  {
    accessorKey: 'name',
    header: t('name', 1),
    cell: ({ row }) =>
      h(
        'button',
        {
          type: 'button',
          class: 'text-left font-medium hover:underline',
          onClick: () => openAsset(row.original),
        },
        row.original.name,
      ),
  },
  {
    accessorKey: 'type',
    header: t('type'),
    cell: ({ row }) => h(AssetTypeBadge, { type: row.original.type }),
  },
  {
    accessorKey: 'sizeBytes',
    header: t('size'),
    cell: ({ row }) => formatFileSize(row.original.sizeBytes),
  },
  {
    accessorKey: 'updatedAt',
    header: t('modified'),
    cell: ({ row }) =>
      formatDate(row.original.updatedAt, { dateStyle: 'medium' }),
  },
];

onMounted(() => {
  watch(
    [data, error],
    ([newData, newError]) => {
      if (newError) {
        fetchError.value = true;
        dataList.value = [];
        return;
      }
      fetchError.value = false;
      dataList.value = Array.isArray(newData) ? newData : [];
    },
    { immediate: true },
  );
  loading.value = false;
});

// Asset detail panel lands in Phase 6; open is a no-op for now.
function openAsset(_asset: Asset) {}
</script>

<template>
  <ContentHeader :title="$t(entityKey, 2)">
    <ContentActionBar>
      <Input
        v-model="search"
        :placeholder="$t('search')"
        class="w-full sm:w-56"
      />
      <div class="flex gap-1">
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
      </div>
    </ContentActionBar>
  </ContentHeader>

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
            <EmptyTitle>{{ $t('no_entity', { entityKey }, 2) }}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>

    <template v-else>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        <AssetCard
          v-for="asset in pagedAssets"
          :key="asset._id"
          :asset="asset"
          @open="openAsset(asset)"
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
</template>
