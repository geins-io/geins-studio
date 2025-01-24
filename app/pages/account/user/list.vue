<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table';
import type { ColumnOptions, User } from '#shared/types';
type Entity = User;

const route = useRoute();
const { getEntityName, getNewEntityUrl, getEditEntityUrl } = useEntity(
  route.fullPath,
);

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
// const apiEndpoint = '/users';
const dataList = ref<Entity[]>([]);
const entityIdentifier = '{username}';
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const editEntityUrl = getEditEntityUrl(entityIdentifier);
const loading = ref(true);
const columns: Ref<ColumnDef<Entity>[]> = ref([]);

// SET UP COLUMNS FOR ENTITY
const columnOptions: ColumnOptions<Entity> = {
  editUrl: editEntityUrl,
  columnTypes: { username: 'link' },
};

// FETCH DATA FOR ENTITY
const { user } = useUserStore();

if (user) {
  dataList.value = [user];
} else {
  dataList.value = [];
}

loading.value = false;

// GET AND SET COLUMNS
const { getColumns } = useColumns<Entity>();
columns.value = getColumns(dataList.value, columnOptions);
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
      searchable-field="firstName"
    />
    <template #error="{ errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
