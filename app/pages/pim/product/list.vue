<script setup lang="ts">
type Entity = Product;

const { t } = useI18n();
const route = useRoute();
const { getEntityName, getNewEntityUrl, getEntityUrl } = useEntity(
  route.fullPath,
);

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const apiEndpoint = '/products';
const totalListItems = ref(3000);
const dataList = ref<Entity[]>([]);
const entityIdentifier = '{_id}';
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const entityUrl = getEntityUrl(entityIdentifier);
const loading = ref(true);

// SET UP COLUMNS FOR ENTITY
const columnOptions: ColumnOptions<Entity> = {
  selectable: true,
  entityLinkUrl: entityUrl,
  columnTitles: { price: 'Default price' },
  columnTypes: { name: 'entity-link' },
};

// FETCH DATA FOR ENTITY
const { data, error } = await useAPI<Entity[]>(apiEndpoint, {
  query: { total: totalListItems.value },
});
if (!data?.value || error.value) {
  throw createError({
    ...error.value,
    statusMessage: t('failed_to_fetch_entity', { entityName }, 2),
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
    navigateTo(`${entityUrl.replace(entityIdentifier, String(product._id))}`),
  onCopy: (product: Entity) => console.log('Copy', product._id),
  onDelete: (product: Entity) => console.log('Delete', product._id),
  onUnpublish: (product: Entity) => console.log('Unpublish', product._id),
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
