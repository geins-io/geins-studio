<script setup lang="ts">
import type { Asset, AssetListFilters } from '#shared/types';
import type { ColumnDef } from '@tanstack/vue-table';

/**
 * Harness for `<TableView data-source="server">`. Not linked from the nav —
 * reach it at /dev/server-table. Drives the table from `useListQuery` +
 * `assetApi.query` against the real media API: paging, sorting, search, the
 * filter kit (pinned popovers + "All filters" sheet), the empty / filtered
 * states and a forced fetch error. Copy is hardcoded on purpose and must not
 * pollute the locale files.
 *
 * Everything under `app/pages/dev/` is dropped from the build unless
 * `INCLUDE_DEV_PAGES=true` — see `includeDevPages()` in
 * shared/utils/deployment.ts.
 */
const { assetApi } = useGeinsRepository();
const { getColumns } = useColumns<Asset>();
const { definitions, toQueryFilters } = useAssetListFilters();

const PAGE_SIZES = [10, 30, 60];
const forceError = ref(false);

const {
  items,
  total,
  pending,
  error,
  filters,
  resetFilters,
  hasActiveQuery,
  searchInput,
  pagination,
  sorting,
  refresh,
} = useListQuery<Asset, AssetListFilters>({
  key: 'dev-server-table',
  fetcher: ({ filters, ...state }, options) => {
    if (forceError.value) throw new Error('Forced harness error');
    return assetApi.query(
      { ...state, filters: toQueryFilters(filters) },
      undefined,
      options,
    );
  },
  defaults: { filters: {}, pageSize: 10 },
  pageSizes: PAGE_SIZES,
  deps: () => forceError.value,
  route: {
    sortFields: ['name', 'type', 'sizeBytes', 'updatedAt'],
    filters: listFilterRouteParams(definitions),
  },
});

const listFilters = useListFilters<AssetListFilters>({
  definitions,
  filters,
  resetFilters,
  defaultPinned: ['assetTypes', 'modified'],
});
const filterSheetOpen = ref(false);

// `getColumns` derives the keys from a row, so keep the last set when a query
// comes back empty — the empty state spans `columns.length`.
const columns = ref<ColumnDef<Asset>[]>([]);
watch(
  items,
  (rows) => {
    if (!rows.length) return;
    columns.value = getColumns(rows, {
      selectable: true,
      includeColumns: ['name', 'type', 'folderId', 'sizeBytes', 'updatedAt'],
      columnTypes: { sizeBytes: 'filesize', updatedAt: 'date' },
      // Not a `sortBy` the asset query accepts.
      sortableColumns: { folderId: false },
    });
  },
  { immediate: true },
);

// Survives paging, sorting, search and filters; only Clear selection drops it.
const selectedIds = ref<string[]>([]);
const selectedNames = ref<string[]>([]);
const tableView = ref<{ clearSelection: () => void }>();
</script>

<template>
  <ContentHeader
    title="Server table — dev harness"
    description="Not in the nav. TableView in server mode, bound to useListQuery + assetApi.query."
  />

  <div class="mb-4 flex flex-wrap items-center gap-2">
    <Button
      :variant="forceError ? 'destructive' : 'secondary'"
      @click="forceError = !forceError"
    >
      Force error
    </Button>
    <Button variant="secondary" @click="refresh()">Refresh</Button>
    <Button variant="secondary" @click="tableView?.clearSelection()">
      Clear selection
    </Button>
    <span class="text-muted-foreground text-xs">
      total {{ total }} · page {{ pagination.pageIndex + 1 }} · size
      {{ pagination.pageSize }} · sort {{ JSON.stringify(sorting) }} ·
      {{ pending ? 'pending' : 'idle' }}
    </span>
  </div>
  <p class="text-muted-foreground mb-2 text-xs">
    filters {{ JSON.stringify(filters) }} · pinned
    {{ JSON.stringify(listFilters.pinned.value) }}
  </p>
  <p class="text-muted-foreground mb-4 text-xs">
    selected ids ({{ selectedIds.length }}):
    {{ selectedIds.join(', ') || '—' }} · loaded rows:
    {{ selectedNames.join(', ') || '—' }}
  </p>

  <TableView
    ref="tableView"
    v-model:selected-ids="selectedIds"
    v-model:pagination="pagination"
    v-model:sorting="sorting"
    v-model:search="searchInput"
    data-source="server"
    entity-key="asset"
    :columns="columns"
    :data="items"
    :row-count="total"
    :loading="pending"
    :filtered="hasActiveQuery"
    :page-sizes="PAGE_SIZES"
    :error="!!error"
    :on-retry="refresh"
    @clear-filters="listFilters.clearAll"
    @selection="(rows) => (selectedNames = rows.map((row) => row.name))"
  >
    <template #toolbar>
      <ListFilterBar
        :list-filters="listFilters"
        @open-all="filterSheetOpen = true"
      />
    </template>
  </TableView>
  <ListFilterSheet v-model:open="filterSheetOpen" :list-filters="listFilters" />
</template>
