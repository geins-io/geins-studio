<script setup lang="ts">
import type {
  DashboardWidgetInstance,
  EntityBase,
  Price,
  QuotationStatus,
} from '#shared/types';
import { TableMode } from '#shared/types';
import { entityEditUrl, entityListUrl } from '#shared/utils/entities';
import { DASHBOARD_BOARD_CONTEXT } from '@/lib/dashboard';
import { changedAt, recentQuotations } from '@/lib/dashboard-data';
import type { Row } from '@tanstack/vue-table';
import { LucideFileText, NuxtLink } from '#components';

defineProps<{
  instance: DashboardWidgetInstance;
}>();

interface RecentQuotationRow extends Omit<EntityBase, '_type'> {
  company: string;
  sum: Price;
  status: QuotationStatus;
  meta: string;
}

const { t } = useI18n();
const { quotations, loading, error, refresh } = useDashboardQuotations();
const { formatRelativeDate } = useDate();
const { convertToPrice } = usePrice();
const { getColumns } = useColumns<RecentQuotationRow>();
const board = inject(DASHBOARD_BOARD_CONTEXT, null);

const rows = computed(() =>
  recentQuotations(quotations.value).map(
    (quotation): RecentQuotationRow => ({
      _id: quotation._id,
      company: quotation.company?.name || quotation.name,
      sum: convertToPrice(quotation.total?.grandTotalExVat, quotation.currency),
      status: quotation.status,
      meta: `${quotation.quotationNumber} · ${formatRelativeDate(changedAt(quotation))}`,
    }),
  ),
);

// Company over the quotation number and age, as in the prototype's table. No
// link while the board is edited: a click would leave the page and drop the edit.
const companyCell = ({ row }: { row: Row<RecentQuotationRow> }) =>
  h('div', { class: 'flex h-[52px] min-w-0 flex-col justify-center px-3' }, [
    board?.editing.value
      ? h('span', { class: 'truncate text-sm' }, row.original.company)
      : h(
          NuxtLink,
          {
            to: entityEditUrl('quotation', row.original._id),
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
      sum: `${t('orders.total')} (${t('ex_vat')})`,
      status: t('status'),
    },
    columnTypes: { sum: 'currency', status: 'status' },
  }).map((column) =>
    column.id === 'company' ? { ...column, cell: companyCell } : column,
  ),
);
</script>

<template>
  <DashboardWidget :instance="instance" :view-all="entityListUrl('quotation')">
    <TableView
      :columns="columns"
      :data="rows"
      entity-key="quotation"
      :mode="TableMode.Compact"
      :loading="loading"
      :error="error"
      :on-retry="refresh"
      :empty-icon="LucideFileText"
    />
  </DashboardWidget>
</template>
