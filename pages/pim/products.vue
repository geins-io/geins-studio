<script setup lang="ts">
import { productListColumns } from '@/model/product/Columns';
import type { Product } from '@/model/product/Product';

const data = ref<Product[]>([]);
const columns = ref(productListColumns);

async function getData(): Promise<Product[]> {
  // Fetch data from API here.
  return [
    {
      id: 1,
      name: 'Product 1',
      price: 100,
    },
    {
      id: 2,
      name: 'Product 2',
      price: 200,
    },
    {
      id: 3,
      name: 'Product 3',
      price: 300,
    },
  ];
}

const handleClick = async (row: string) => {
  await navigateTo('/pim/product/' + (parseInt(row) + 1));
};

onMounted(async () => {
  data.value = await getData();
});
</script>

<template>
  <ContentTitleBlock title="Products" />
  <ContentActionBar>
    <Button>New product</Button>
    <Button variant="outline">Export all</Button>
    <Button variant="outline">Export this</Button>
  </ContentActionBar>
  <ContentTable :columns="columns" :data="data" @clicked="handleClick" />
</template>
