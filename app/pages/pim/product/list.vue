<script setup lang="ts">
import type { Product } from '@/types/product/Product';

// List page globals
const entityName = 'product';
const totalProducts = ref(3000);
const products = ref<Product[]>([]);
const loading = ref(true);
const editUrl = '/pim/product/{id}';
const createUrl = '/pim/product/new';
const rowsSelectable = true;

// Fetch data
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
loading.value = false;

// Fix columns
const { getColumns, addActionsColumn, setOrderForColumn } =
  useColumns<Product>();
const columns = getColumns(products.value, {
  selectable: rowsSelectable,
  editUrl,
  columnTitles: { price: 'Default price' },
  columnTypes: { price: 'currency', image: 'image', name: 'link' },
});

addActionsColumn(columns, {
  onEdit: (product: Product) =>
    navigateTo(`${editUrl.replace('{id}', String(product.id))}`),
  onCopy: (product: Product) => console.log('Copy', product.id),
  onDelete: (product: Product) => console.log('Delete', product.id),
  onUnpublish: (product: Product) => console.log('Unpublish', product.id),
});
setOrderForColumn(columns, 'image', 1);
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
      :data="products"
    />
    <template #error="{ errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
