<script setup lang="ts" generic="TData">
import type { Product } from '@/types/product/Product';
import type { ColumnDef } from '@tanstack/vue-table';
import { TableCellActions } from '#components';

// Globals
const entityName = 'product';
const totalProducts = ref(500);
const products = ref<Product[]>([]);
const loading = ref(true);
const editUrl = '/pim/product/{id}';

// Fetch data
const { data, error } = await useFetch<Product[]>('/api/products', {
  query: { total: totalProducts.value },
});
if (!data.value || error.value) {
  throw createError({
    ...error.value,
    statusMessage: 'Failed to fetch products',
  });
} else {
  products.value = data.value;
}
loading.value = false;

// Fix columns
const { getColumns, extendColumns, setOrderForColumn } = useColumns<Product>();
const columns = getColumns(products.value, {
  selectable: true,
  columnTypes: { price: 'currency', image: 'image', name: 'link' },
  editUrl,
});

const actionsColumn: ColumnDef<Product> = {
  id: 'actions',
  enableHiding: false,
  enableSorting: false,
  size: 90,
  cell: ({ row }) => {
    const product = row.original;

    return h(
      'div',
      { class: 'relative' },
      h(TableCellActions, {
        onEdit: () => navigateTo(`/pim/product/${product.id}`),
        onMore: () => console.log('More options', product.id),
      }),
    );
  },
};

extendColumns(columns, actionsColumn);
setOrderForColumn(columns, 'image', 1);

// const handleClick = async (row: Row<Product>) => {
//   await navigateTo(`/pim/product/${row.original.id}`);
// };
</script>

<template>
  <ContentHeader title="Products">
    <ContentActionBar>
      <ButtonExport />
      <ButtonNew>{{ $t('new_entity', { entityName }) }}</ButtonNew>
    </ContentActionBar>
  </ContentHeader>
  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-name="entityName"
      :rows-selectable="true"
      :columns="columns"
      :data="products"
    />
    <template #error="{ errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: 'products' }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
