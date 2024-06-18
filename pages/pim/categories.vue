<script setup lang="ts" generic="TData">
import type { Category } from '@/model/product/Category';

const { getColumns } = useColumns();

const { data } = await useFetch<Category[]>('/api/categories');

if (!data.value) {
  throw new Error('Failed to fetch categories');
}
const categories = ref<Category[]>(data.value);
const columns = getColumns(categories.value);
</script>

<template>
  <ContentTitleBlock title="Categories" />
  <ContentActionBar>
    <Button>New category</Button>
    <Button variant="outline">Export all</Button>
    <Button variant="outline">Export selected</Button>
  </ContentActionBar>
  <TableView entity-name="category" :columns="columns" :data="categories" />
</template>
