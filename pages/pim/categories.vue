<script setup lang="ts" generic="TData">
import type { Category } from '@/types/product/Category';
import { mockCategories } from '@/data/categories';

const entityName = 'category';
const categories = ref<Category[]>(mockCategories);

if (import.meta.dev) {
  const { data } = await useFetch<Category[]>('/api/categories');
  if (!data.value) {
    throw new Error('Failed to fetch categories');
  }
  categories.value = data.value || mockCategories;
}

const { getColumns } = useColumns();
const columns = getColumns(categories.value);
</script>

<template>
  <ContentTitleBlock title="Categories" />
  <ContentActionBar>
    <Button>{{ $t('new_entity', { entityName }) }}</Button>
    <Button variant="outline">Export all</Button>
    <Button variant="outline">Export selected</Button>
  </ContentActionBar>
  <TableView :entity-name="entityName" :columns="columns" :data="categories" />
</template>
