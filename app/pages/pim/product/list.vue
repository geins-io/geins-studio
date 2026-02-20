<script setup lang="ts">
import type { ColumnOptions, StringKeyOf, Product } from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';

type Entity = Product;
type EntityList = Product;

const scope = 'pages/pim/product/list.vue';
const { t } = useI18n();
const { geinsLogError: _geinsLogError } = useGeinsLog(scope);
const { getEntityName, getEntityNewUrl, getEntityUrl } = useEntityUrl();

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const { productApi } = useGeinsRepository();
const dataList = ref<EntityList[]>([]);
const entityName = getEntityName();
const newEntityUrl = getEntityNewUrl();
const entityIdentifier = '{id}';
const entityUrl = getEntityUrl(entityIdentifier);
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

const { handleFetchResult } = usePageError({
  entityName,
  entityList: true,
  scope,
});

// Add the mapping function
const mapToListData = (items: Entity[]): EntityList[] => {
  return items.map((item) => {
    return {
      ...item,
    };
  });
};

// FETCH DATA FOR ENTITY
const { data, error } = await useAsyncData<Entity[]>(
  'pim-products-list',
  async () => {
    const result = await productApi.list();
    return result.items;
  },
);

const { getColumns, addActionsColumn } = useColumns<EntityList>();

onMounted(() => {
  watch(
    data,
    (newData) => {
      if (newData) {
        const validData = handleFetchResult(error.value, newData);
        dataList.value = mapToListData(validData);
      }
    },
    { immediate: true },
  );

  // SET UP COLUMN OPTIONS FOR ENTITY
  const columnOptions: ColumnOptions<EntityList> = {
    columnTypes: {
      thumbnail: 'image',
      name: 'link',
      active: 'status',
    },
    linkColumns: {
      name: { url: entityUrl, idField: '_id' },
    },
    columnTitles: {
      thumbnail: t('image'),
      articleNumber: t('article_number'),
      active: t('status'),
    },
    includeColumns: ['thumbnail', 'name', 'articleNumber', 'active'],
  };
  // GET AND SET COLUMNS
  columns.value = getColumns(dataList.value, columnOptions);

  addActionsColumn(
    columns.value,
    {
      onEdit: (item: Entity) =>
        navigateTo(`${entityUrl.replace(entityIdentifier, String(item._id))}`),
    },
    'actions',
    ['edit'],
  );
  loading.value = false;
});

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = [];
visibilityState.value = getVisibilityState(hiddenColumns);
</script>

<template>
  <ContentHeader :title="$t(entityName, 2)">
    <ContentActionBar>
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
      :init-visibility-state="visibilityState"
      :searchable-fields="['name', 'articleNumber']"
      :page-size="30"
      :show-search="true"
      @clicked="
        (row) =>
          navigateTo(entityUrl.replace(entityIdentifier, String(row._id)))
      "
    >
      <template #empty-actions>
        <ButtonIcon
          icon="new"
          variant="secondary"
          @click="navigateTo(newEntityUrl)"
        >
          {{ $t('create_new_entity', { entityName }) }}
        </ButtonIcon>
      </template>
    </TableView>
    <template #error="{ error: errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
