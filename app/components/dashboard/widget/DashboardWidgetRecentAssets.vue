<script setup lang="ts">
import type { Asset, DashboardWidgetInstance, User } from '#shared/types';
import { TableMode } from '#shared/types';
import { entityListUrl } from '#shared/utils/entities';
import { DASHBOARD_BOARD_CONTEXT, findUserByRef } from '@/lib/dashboard';
import { DASHBOARD_LIST_LIMIT } from '@/lib/dashboard-data';
import type { ColumnDef } from '@tanstack/vue-table';
import { LucideImage, TableCellAssetThumbnail } from '#components';

defineProps<{
  instance: DashboardWidgetInstance;
}>();

const { t } = useI18n();
const { assetApi, userApi } = useGeinsRepository();
const { formatRelativeDate } = useDate();
const { user: me } = storeToRefs(useUserStore());
const { getBasicCellStyle, getBasicHeaderStyle } = useColumns<Asset>();
const board = inject(DASHBOARD_BOARD_CONTEXT, null);

// `all: true` is every live asset (trash is its own query)
const { data, status, refresh } = useAsyncData(
  'dashboard-recent-assets',
  async (): Promise<Asset[]> => {
    const result = await assetApi.find({
      all: true,
      sortBy: 'createdAt',
      sortDirection: 'desc',
      page: 1,
      pageSize: DASHBOARD_LIST_LIMIT,
    });
    return Array.isArray(result?.items) ? result.items : [];
  },
);

// Users turn `createdBy` into a name; without them the raw value shows.
// Fetched apart so refreshing the assets doesn't reload them.
const { data: users } = useAsyncData(
  'dashboard-users',
  () => userApi.list().catch((): User[] => []),
  { default: (): User[] => [] },
);

const rows = computed(() => data.value ?? []);

// `fullName` falls back to the user id, which says less than `createdBy`
function uploader(createdBy: string | null): string {
  if (!createdBy) return '';
  if (me.value && findUserByRef(createdBy, [me.value])) return t('you');
  const user = findUserByRef(
    createdBy,
    Array.isArray(users.value) ? users.value : [],
  );
  return (
    (user &&
      fullName({ firstName: user.firstName, lastName: user.lastName })) ||
    createdBy
  );
}

const detailOpen = ref(false);
const detailAsset = ref<Asset | null>(null);

// The panel mounts on the first click (it fetches tags on setup) and opens a
// tick later: it seeds its form when `open` changes, not on mount.
async function openAsset(asset: Asset) {
  detailAsset.value = asset;
  await nextTick();
  detailOpen.value = true;
}

// A trash or an edit that saves at once changes what the list shows
watch(detailOpen, (open) => {
  if (!open) void refresh();
});

// A rename or move that answered `202` lands later, as a background job
const { movingAssetIds } = useBackgroundJobs();
watch(movingAssetIds, (moving, before) => {
  const landed = [...(before ?? [])].filter((id) => !moving.has(id));
  if (landed.some((id) => rows.value.some((asset) => asset._id === id))) {
    void refresh();
  }
});

// Two fixed columns rather than `getColumns`, which derives them from the
// first row: the empty state keeps its header.
const columns = computed((): ColumnDef<Asset>[] => [
  {
    id: 'name',
    header: ({ table }) =>
      h('div', { class: getBasicHeaderStyle(table) }, t('file', 1)),
    // Thumbnail beside the name (opens the asset) over who uploaded it. Plain
    // text while the board is edited, like the other lists' links.
    cell: ({ row }) =>
      h('div', { class: 'flex h-[52px] min-w-0 items-center gap-2 px-3' }, [
        h(TableCellAssetThumbnail, {
          type: row.original.type,
          url: row.original.url,
          alt: row.original.name,
          className: 'shrink-0',
        }),
        h('div', { class: 'flex min-w-0 flex-col' }, [
          board?.editing.value
            ? h('span', { class: 'truncate text-sm' }, row.original.name)
            : h(
                'button',
                {
                  type: 'button',
                  class: 'truncate text-left text-sm hover:underline',
                  onClick: () => openAsset(row.original),
                },
                row.original.name,
              ),
          h(
            'p',
            { class: 'text-muted-foreground truncate text-xs' },
            uploader(row.original.createdBy),
          ),
        ]),
      ]),
  },
  {
    id: 'createdAt',
    header: ({ table }) =>
      h(
        'div',
        { class: cn(getBasicHeaderStyle(table), 'justify-end') },
        t('dashboards.widgets.recent_assets.added'),
      ),
    cell: ({ table, row }) =>
      h(
        'div',
        {
          class: cn(
            getBasicCellStyle(table),
            'text-muted-foreground justify-end text-xs whitespace-nowrap',
          ),
        },
        formatRelativeDate(row.original.createdAt),
      ),
  },
]);
</script>

<template>
  <DashboardWidget :instance="instance" :view-all="entityListUrl('asset')">
    <TableView
      :columns="columns"
      :data="rows"
      entity-key="asset"
      :mode="TableMode.Compact"
      :loading="status === 'pending' && !data"
      :error="status === 'error'"
      :on-retry="refresh"
      :empty-icon="LucideImage"
    />
    <AssetDetailPanel
      v-if="detailAsset"
      v-model:open="detailOpen"
      :asset="detailAsset"
      @replaced="detailAsset = $event"
    />
  </DashboardWidget>
</template>
