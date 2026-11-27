<script setup lang="ts">
import type {
  DashboardWidgetInstance,
  EntityBase,
  OrderStatus,
  Price,
} from '#shared/types';
import { TableMode } from '#shared/types';
import { entityEditUrl } from '#shared/utils/entities';
import type { Row } from '@tanstack/vue-table';
import { LucidePackage, NuxtLink } from '#components';

defineProps<{
  instance: DashboardWidgetInstance;
}>();

interface CompanyOrderRow extends Omit<EntityBase, '_type'> {
  company: string;
  sum: Price;
  status: OrderStatus;
  companyId: string;
  meta: string;
}

const ROW_LIMIT = 10;

const { t } = useI18n();
const { customerApi } = useGeinsRepository();
const { formatDate } = useDate();
const { convertToPrice } = usePrice();
const { getColumns } = useColumns<CompanyOrderRow>();

const { channelIds } = useDashboardFilters();

// Orders come from the dashboard's shared fetch (Company sales reads it too).
// Not `useCompanyOrders`: rows link to the company, and that composable's
// list rows drop the company id. The channel filter narrows the list without
// a new fetch.
const ordersFetch = useDashboardCompanyOrders();
const companiesFetch = useAsyncData(
  'dashboard-companies',
  async () => {
    const companies = await customerApi.company.list();
    return Array.isArray(companies) ? companies : [];
  },
  { dedupe: 'defer' },
);

const loading = computed(
  () => ordersFetch.loading.value || companiesFetch.status.value === 'pending',
);
const error = computed(
  () => ordersFetch.error.value || companiesFetch.status.value === 'error',
);
const retry = () =>
  Promise.all([ordersFetch.refresh(), companiesFetch.refresh()]);

const rows = computed<CompanyOrderRow[]>(() => {
  const companies = companiesFetch.data.value ?? [];
  const picked = channelIds.value;
  return ordersFetch.orders.value
    .filter((order) => !picked.length || picked.includes(String(order.channel)))
    .slice(0, ROW_LIMIT)
    .map((order) => ({
      _id: order._id,
      company: getEntityNameById(order.wholesaleAccountId, companies),
      sum: convertToPrice(order.sumIncVat, order.currency),
      status: order.status,
      companyId: order.wholesaleAccountId,
      meta: `#${order._id} · ${formatDate(order.dateCreated, { dateStyle: 'medium' })}`,
    }));
});

// Company over its order number and date, as in the prototype's list rows
const companyCell = ({ row }: { row: Row<CompanyOrderRow> }) =>
  h('div', { class: 'flex h-[52px] min-w-0 flex-col justify-center px-3' }, [
    h(
      NuxtLink,
      {
        to: entityEditUrl('company', row.original.companyId),
        class: 'truncate text-sm hover:underline',
      },
      () => row.original.company,
    ),
    h(
      'p',
      { class: 'text-muted-foreground truncate text-xs' },
      row.original.meta,
    ),
  ]);

const columns = computed(() =>
  getColumns(rows.value, {
    includeColumns: ['company', 'sum', 'status'],
    columnTitles: {
      company: t('company'),
      sum: t('sum'),
      status: t('status'),
    },
    columnTypes: { sum: 'currency', status: 'status' },
  }).map((column) =>
    column.id === 'company' ? { ...column, cell: companyCell } : column,
  ),
);
</script>

<template>
  <DashboardWidget :instance="instance">
    <TableView
      :columns="columns"
      :data="rows"
      entity-key="order"
      :mode="TableMode.Compact"
      :loading="loading"
      :error="error"
      :on-retry="retry"
      :empty-icon="LucidePackage"
    />
  </DashboardWidget>
</template>
