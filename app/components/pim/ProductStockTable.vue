<script setup lang="ts">
import { h } from 'vue';
import type { Sku } from '#shared/types';
import { TableMode } from '#shared/types';
import type { ColumnDef, Table, Row } from '@tanstack/vue-table';
import { LucidePackage, Badge } from '#components';

// =====================================================================================
// PROPS & EMITS
// =====================================================================================
interface Props {
  skus: Sku[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

// =====================================================================================
// I18N
// =====================================================================================
const { t } = useI18n();

// =====================================================================================
// LOW STOCK HELPER
// =====================================================================================
const isLowStock = (stock: number) => stock < 10;

// =====================================================================================
// COLUMNS CONFIGURATION WITH CUSTOM RENDERERS
// =====================================================================================
const { getColumns } = useColumns<Sku>();

const columns = computed<ColumnDef<Sku>[]>(() => {
  if (props.skus.length === 0) return [];

  // First, get base columns from useColumns
  const baseColumns = getColumns(props.skus, {
    includeColumns: ['articleNumber', 'stock', 'stockSellable', 'stockOversellable'] as (keyof Sku)[],
    columnTitles: {
      articleNumber: 'Article Number',
      stock: 'Stock',
      stockSellable: 'Sellable Stock',
      stockOversellable: 'Oversellable Stock',
    },
  });

  // Now customize the stock columns to use Badge components
  return baseColumns.map((col) => {
    const columnId = col.id as keyof Sku;
    
    // For stock and stockSellable columns, add custom cell renderer with Badge
    if (columnId === 'stock' || columnId === 'stockSellable') {
      return {
        ...col,
        cell: ({ row, table: _table }: { row: Row<Sku>; table: Table<Sku> }) => {
          const value = row.getValue(columnId) as number;
          const lowStock = isLowStock(value);
          
          // Get base cell style from useColumns
          const baseCellStyle = 'align-middle sm:text-grid leading-6 text-xs sm:leading-8 w-full h-8 sm:h-10 flex items-center truncate px-3.5';
          
          if (lowStock) {
            // Render stock value with low stock badge
            return h('div', { class: baseCellStyle }, [
              h('span', { class: 'mr-2' }, String(value)),
              h(Badge, { variant: 'negative' }, () => t('low_stock')),
            ]);
          } else {
            // Just render the stock value
            return h('div', { class: baseCellStyle }, String(value));
          }
        },
      };
    }
    
    return col;
  });
});
</script>

<template>
  <div>
    <TableView
      :mode="TableMode.Simple"
      entity-name="stock"
      :columns="columns"
      :data="skus"
      :loading="loading"
      :empty-text="$t('product_no_stock')"
      :empty-icon="LucidePackage"
    />
  </div>
</template>
