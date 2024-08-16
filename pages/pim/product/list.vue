<script setup lang="ts" generic="TData">
import type { Product } from '@/types/product/Product';
import type { ColumnDef } from '@tanstack/vue-table';
import { mockProducts } from '@/data/products';
import { TableCellActions } from '#components';

const entityName = 'product';
const totalProducts = ref(500);
const products = ref<Product[]>(mockProducts);
const loading = ref(true);

if (import.meta.dev) {
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
}
loading.value = false;

const { getColumns, extendColumns } = useColumns<Product>();
const columns = getColumns(products.value, {
  selectable: true,
  columnTypes: { price: 'currency', image: 'image' },
});

const actionsColumn: ColumnDef<Product> = {
  id: 'actions',
  enableHiding: false,
  enableSorting: false,
  cell: ({ row }) => {
    const product = row.original;

    return h(
      'div',
      { class: 'relative' },
      h(TableCellActions, {
        onEdit: () => navigateTo(`/pim/product/${product.id}`),
        onDelete: () => console.log('Delete product', product.id),
      }),
    );
  },
};

extendColumns(columns, actionsColumn);

// const handleClick = async (row: Row<Product>) => {
//   await navigateTo(`/pim/product/${row.original.id}`);
// };
</script>

<template>
  <ContentTitleBlock title="Products" />
  <ContentActionBar>
    <Button>{{ $t('new_entity', { entityName }) }}</Button>
    <Button variant="outline">Export all</Button>
    <Button variant="outline">Export selected</Button>
  </ContentActionBar>
  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-name="entityName"
      :rows-selectable="true"
      :columns="columns"
      :data="products"
    />
    <template #error="{ error }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: 'products' }) }}
      </h2>
      <p>{{ error }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
