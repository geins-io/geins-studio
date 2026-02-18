<script setup lang="ts">
import type { Sku } from '#shared/types';
import { TableMode } from '#shared/types';
import { LucidePackage } from '#components';
import { h } from 'vue';

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
// ENRICHED DATA WITH DISPLAY FORMATTING
// =====================================================================================
interface EnrichedSkuData extends Sku {
  stockDisplay: string;
  stockSellableDisplay: string;
}

const enrichedData = computed(() => {
  return props.skus.map((sku) => ({
    ...sku,
    stockDisplay: isLowStock(sku.stock) 
      ? `${sku.stock} ⚠️ ${t('low_stock')}`
      : String(sku.stock),
    stockSellableDisplay: isLowStock(sku.stockSellable)
      ? `${sku.stockSellable} ⚠️ ${t('low_stock')}`
      : String(sku.stockSellable),
  }));
});

// =====================================================================================
// COLUMNS CONFIGURATION
// =====================================================================================
const { getColumns } = useColumns<EnrichedSkuData>();

const enrichedColumns = computed(() => {
  if (props.skus.length === 0) return [];

  const columnOptions = {
    includeColumns: ['articleNumber', 'stockDisplay', 'stockSellableDisplay', 'stockOversellable'] as (keyof EnrichedSkuData)[],
    columnTitles: {
      articleNumber: 'Article Number',
      stockDisplay: 'Stock',
      stockSellableDisplay: 'Sellable Stock',
      stockOversellable: 'Oversellable Stock',
    },
  };

  return getColumns(enrichedData.value, columnOptions);
});
</script>

<template>
  <div>
    <TableView
      :mode="TableMode.Simple"
      entity-name="stock"
      :columns="enrichedColumns"
      :data="enrichedData"
      :loading="loading"
      :empty-text="$t('product_no_stock')"
      :empty-icon="LucidePackage"
    />
  </div>
</template>
