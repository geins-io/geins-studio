<script setup lang="ts" generic="TData">
import { productListColumns } from '@/model/product/Columns';
import type { Product } from '@/model/product/Product';
import type { Row } from '@tanstack/vue-table';
import { mockProducts } from '@/data/products';

// const { getColumns } = useColumns();

const columns = ref(productListColumns);

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

// TODO: Implement extend useColumns
// const columns = getColumns(products.value);
// console.log('🚀 ~ columns:', columns);

const handleClick = async (row: Row<Product>) => {
  await navigateTo(`/pim/product/${row.original.id}`);
};
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
    @clicked="handleClick"
  />
</template>
