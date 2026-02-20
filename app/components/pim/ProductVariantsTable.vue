<script setup lang="ts">
import type { Sku } from '#shared/types';
import { TableMode } from '#shared/types';
import { LucidePackage } from '#components';

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
// COLUMNS CONFIGURATION
// =====================================================================================
const { getColumns } = useColumns<Sku>();

const columns = computed(() => {
  if (props.skus.length === 0) return [];

  const columnOptions = {
    includeColumns: ['articleNumber', 'name', 'gtin', 'active'] as (keyof Sku)[],
    columnTypes: {
      active: 'status' as const,
    },
    columnTitles: {
      articleNumber: 'Article Number',
      name: 'Name',
      gtin: 'GTIN',
      active: 'Status',
    },
  };

  return getColumns(props.skus, columnOptions);
});
</script>

<template>
  <div>
    <TableView
      :mode="TableMode.Simple"
      entity-name="variant"
      :columns="columns"
      :data="skus"
      :loading="loading"
      :empty-text="$t('product_no_variants')"
      :empty-icon="LucidePackage"
    />
  </div>
</template>
