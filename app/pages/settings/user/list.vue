<script setup lang="ts">
import type { User } from '@/types/auth/Auth';
import type { ColumnOptions } from '~/types/Columns';
const route = useRoute();
const { getEntityName, getNewEntityUrl, getEditEntityUrl } = useEntity(
  route.fullPath,
);

// GLOBAL SETUP
const apiEndpoint = '/users';
const dataList = ref<User[]>([]);
const entityIdentifier = '{id}';
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const editEntityUrl = getEditEntityUrl(entityIdentifier);
const loading = ref(true);

// SET UP COLUMNS FOR ENTITY
const columnOptions: ColumnOptions<User> = {
  editUrl: editEntityUrl,
};

// FETCH DATA FOR ENTITY
const { callAPI } = useAPI<User[]>();
const { data, error } = await callAPI(apiEndpoint);

if (!data.value || error.value) {
  // do nothing for now
} else {
  dataList.value = data.value;
}
loading.value = false;

// GET AND SET COLUMNS
const { getColumns } = useColumns<User>();
const columns = getColumns(dataList.value, columnOptions);
</script>

<template>
  <ContentHeader :title="$t('entity_caps', { entityName }, 2)">
    <ContentActionBar>
      <ButtonExport />
      <ButtonNew :href="newEntityUrl">
        {{ $t('new_entity', { entityName }) }}
      </ButtonNew>
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
