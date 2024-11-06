<script setup lang="ts" generic="TData">
import type { Category } from '@/types/product/Category';

const entityName = 'category';
const categories = ref<Category[]>([]);
const loading = ref(true);

const { data, error } = await useFetch<Category[]>('/api/categories');
if (!data.value || error.value) {
  throw createError({
    ...error.value,
    statusMessage: 'Failed to fetch categories',
  });
} else {
  categories.value = data.value;
}

loading.value = false;

const { getColumns } = useColumns<Category>();
const columns = getColumns(categories.value);
</script>

<template>
  <ContentHeader>
    <template #title>
      <ContentTitleBlock title="Categories" />
    </template>
    <template #actions>
      <ContentActionBar>
        <ButtonExport />
        <ButtonNew>{{ $t('new_entity', { entityName }) }}</ButtonNew>
      </ContentActionBar>
    </template>
  </ContentHeader>

  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-name="entityName"
      :columns="columns"
      :data="categories"
    />
    <template #error="{ errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: 'categories' }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
