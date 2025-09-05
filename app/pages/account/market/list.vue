<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table';
import type { ColumnOptions, Market } from '#shared/types';
interface Entity extends Market {
  name?: string;
}

const route = useRoute();
const { getEntityName, getNewEntityUrl, getEntityUrl } = useEntityUrl(
  route.fullPath,
);

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const apiEndpoint = '/account/market/list';
const dataList = ref<Entity[]>([]);
const entityIdentifier = '{_id}';
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const entityUrl = getEntityUrl(entityIdentifier);
const loading = ref(true);
const columns: Ref<ColumnDef<Entity>[]> = ref([]);

// SET UP COLUMNS FOR ENTITY
const columnOptions: ColumnOptions<Entity> = {
  entityLinkUrl: entityUrl,
};

const { useGeinsFetch } = useGeinsApi();
const { data, error } = await useGeinsFetch<Entity[]>(apiEndpoint);

if (!data?.value || error.value) {
  // Couldn't fetch data... do nothing for now
} else {
  const reshapedData: Entity[] = data.value.map((item) => {
    const countryName =
      typeof item.country === 'object' ? item.country?.name : item.country;
    const currencyName =
      typeof item.currency === 'object' ? item.currency?.name : item.currency;

    return {
      ...item,
      name: countryName,
      currency: currencyName,
      country: countryName,
    };
  });

  dataList.value = reshapedData;
}
loading.value = false;

// GET AND SET COLUMNS
const { getColumns } = useColumns<Entity>();
columns.value = getColumns(dataList.value, columnOptions);
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
