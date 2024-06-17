<script setup lang="ts" generic="TData">
import { productListColumns } from '@/model/product/Columns';
import type { Product } from '@/model/product/Product';
import type { Row } from '@tanstack/vue-table';
import { mockProducts } from '@/data/products';

const columns = ref(productListColumns);

const totalProducts = ref(50);
const products = ref<Product[]>(mockProducts);

if (import.meta.dev) {
  const { data } = await useFetch<Product[]>('/api/products', {
    query: { total: totalProducts.value },
  });
  products.value = data.value || mockProducts;
}

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
  <TableView :columns="columns" :data="products" @clicked="handleClick" />
</template>
