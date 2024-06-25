<script setup lang="ts" generic="TData">
import type { Product } from '@/types/product/Product';
import type { ColumnDef } from '@tanstack/vue-table';
import { mockProducts } from '@/data/products';
import TableCellActions from '@/components/table/cell/TableCellActions.vue';

const totalProducts = ref(500);
const products = ref<Product[]>(mockProducts);

if (import.meta.dev) {
  const { data } = await useFetch<Product[]>('/api/products', {
    query: { total: totalProducts.value },
  });
  if (!data.value) {
    throw new Error('Failed to fetch categories');
  }
  products.value = data.value || mockProducts;
}

const { getColumns, extendColumns } = useColumns<Product>({
  selectable: true,
  columnTypes: { price: 'currency' },
});
const columns = getColumns(products.value);

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
    <Button>New product</Button>
    <Button variant="outline">Export all</Button>
    <Button variant="outline">Export selected</Button>
  </ContentActionBar>
  <TableView
    entity-name="product"
    :rows-selectable="true"
    :columns="columns"
    :data="products"
  />
</template>
