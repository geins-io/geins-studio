<script setup lang="ts">
import type { Category } from '@/types/product/Category';

const entityName = 'pricelist';
const categories = ref<Category[]>([]);
const loading = ref(true);
const editUrl = '/wholesale/pricelist/{id}';
const createUrl = '/wholesale/pricelist/new';
const rowsSelectable = true;

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
const columns = getColumns(categories.value, {
  selectable: rowsSelectable,
  editUrl,
  columnTypes: { name: 'link' },
});
</script>

<template>
  <ContentHeader :title="$t('entity_caps', { entityName }, 2)">
    <ContentActionBar>
      <ButtonExport />
      <ButtonNew :href="createUrl">
        {{ $t('new_entity', { entityName }) }}
      </ButtonNew>
    </ContentActionBar>
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
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
