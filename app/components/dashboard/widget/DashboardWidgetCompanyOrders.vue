<script setup lang="ts">
import type {
  DashboardWidgetInstance,
  EntityBase,
  OrderBatchQuery,
  OrderStatus,
  Price,
} from '#shared/types';
import { SelectorCondition, TableMode } from '#shared/types';
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

const WHOLESALE_ORDERS: OrderBatchQuery = {
  include: [
    {
      selections: [
        { condition: SelectorCondition.And, orderTypes: ['wholesale'] },
      ],
    },
  ],
};

const { t } = useI18n();
const { customerApi, orderApi } = useGeinsRepository();
const { batchQueryNoPagination } = useBatchQuery();
const { formatDate } = useDate();
const { convertToPrice } = usePrice();
const { getColumns } = useColumns<CompanyOrderRow>();

// Its own fetch rather than `useCompanyOrders`: rows link to the company, and
// that composable's list rows drop the company id.
const { data, status, refresh } = useAsyncData(
  'dashboard-company-orders',
  async (): Promise<CompanyOrderRow[]> => {
    const [companies, result] = await Promise.all([
      customerApi.company.list(),
      orderApi.query(
        { ...WHOLESALE_ORDERS, ...batchQueryNoPagination.value },
        undefined,
        { suppressErrorToast: true },
      ),
    ]);
    const allCompanies = Array.isArray(companies) ? companies : [];
    const orders = Array.isArray(result?.items) ? result.items : [];
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
      )
      .slice(0, ROW_LIMIT)
      .map((order) => ({
        _id: order._id,
        company: getEntityNameById(order.wholesaleAccountId, allCompanies),
        sum: convertToPrice(order.sumIncVat, order.currency),
        status: order.status,
        companyId: order.wholesaleAccountId,
        meta: `#${order._id} · ${formatDate(order.dateCreated, { dateStyle: 'medium' })}`,
      }));
  },
);

const rows = computed(() => data.value ?? []);

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
  <DashboardWidget :type="instance.type">
    <TableView
      :columns="columns"
      :data="rows"
      entity-key="order"
      :mode="TableMode.Compact"
      :loading="status === 'pending'"
      :error="status === 'error'"
      :on-retry="refresh"
      :empty-icon="LucidePackage"
    />
  </DashboardWidget>
</template>
