<script setup lang="ts">
import { productListColumns } from '@/model/product/Columns';
import type { Product } from '@/model/product/Product';
import { mockProducts } from '@/data/products';

const columns = ref(productListColumns);

const totalProducts = ref(50);
let products = ref<Product[]>(mockProducts);

if (import.meta.dev) {
  const { data } = await useFetch<Product[]>('/api/products', {
    query: { total: totalProducts.value },
  });
  products.value = data.value || mockProducts;
}

const handleClick = async (row: any) => {
  await navigateTo(`/pim/product/${row.original.id}`);
};
</script>

<template>
  <ContentTitleBlock title="Products" />
  <ContentActionBar>
    <Button>New product</Button>
    <Button variant="outline">Export all</Button>
    <Button variant="outline">Export this</Button>
  </ContentActionBar>
  <ContentTable :columns="columns" :data="products" @clicked="handleClick" />
</template>
