<script setup lang="ts">
import type { ColumnOptions, Category } from '#shared/types';
type Entity = Category;

const { t } = useI18n();
const route = useRoute();
const { getEntityName, getNewEntityUrl, getEntityUrl } = useEntityUrl(
  route.fullPath,
);

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const apiEndpoint = '/categories';
const dataList = ref<Entity[]>([]);
const entityIdentifier = '{_id}';
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const entityUrl = getEntityUrl(entityIdentifier);
const loading = ref(true);

// SET UP COLUMNS FOR ENTITY
const columnOptions: ColumnOptions<Entity> = {
  entityLinkUrl: entityUrl,
  columnTypes: { name: 'entity-link' },
};

// FETCH DATA FOR ENTITY
const { useGeinsFetch } = useGeinsApi();
const { data, error } = await useGeinsFetch<Entity[]>(apiEndpoint);

if (!data.value || error.value) {
  throw createError({
    ...error.value,
    statusMessage: t('failed_to_fetch_entity', { entityName }, 2),
  });
} else {
  dataList.value = data.value as Entity[];
}
loading.value = false;

// GET AND SET COLUMNS
const { getColumns } = useColumns<Entity>();
const columns = getColumns(dataList.value, columnOptions);
</script>

<template>
  <ContentHeader :title="$t(entityName, 2)">
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
