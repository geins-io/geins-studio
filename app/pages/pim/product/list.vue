<script setup lang="ts">
type Entity = Product;

const route = useRoute();
const { getEntityName, getNewEntityUrl, getEditEntityUrl } = useEntity(
  route.fullPath,
);

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const apiEndpoint = '/products';
const totalListItems = ref(3000);
const dataList = ref<Entity[]>([]);
const entityIdentifier = '{id}';
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const editEntityUrl = getEditEntityUrl(entityIdentifier);
const loading = ref(true);

// SET UP COLUMNS FOR ENTITY
const columnOptions: ColumnOptions<Entity> = {
  selectable: true,
  editUrl: editEntityUrl,
  columnTitles: { price: 'Default price' },
  columnTypes: { name: 'link' },
};

// FETCH DATA FOR ENTITY
const { data, error } = await useAPI<Entity[]>(apiEndpoint, {
  query: { total: totalListItems.value },
});
if (!data?.value || error.value) {
  throw createError({
    ...error.value,
    statusMessage: 'Failed to fetch products',
  });
} else {
  dataList.value = data.value as Entity[];
}
loading.value = false;

// GET AND SET COLUMNS
const { getColumns, addActionsColumn } = useColumns<Entity>();
const columns = getColumns(dataList.value, columnOptions);

// ADD AND ORDER COLUMNS
addActionsColumn(columns, {
  onEdit: (product: Entity) =>
    navigateTo(
      `${editEntityUrl.replace(entityIdentifier, String(product.id))}`,
    ),
  onCopy: (product: Entity) => console.log('Copy', product.id),
  onDelete: (product: Entity) => console.log('Delete', product.id),
  onUnpublish: (product: Entity) => console.log('Unpublish', product.id),
});
</script>

<template>
  <ContentHeader :title="$t('entity_caps', { entityName }, 2)">
    <ContentActionBar>
      <ButtonExport />
      <ButtonIcon icon="new" :href="newEntityUrl">
        {{ $t('new_entity', { entityName }) }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>
  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-name="entityName"
      :columns="columns"
      :data="dataList"
    />
    <template #error="{ errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
