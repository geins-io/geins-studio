<script setup lang="ts">
import type { ColumnOptions } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

type Entity = ProductPriceList;
type EntityList = ProductPriceList;

const { t } = useI18n();
const { geinsLogError } = useGeinsLog('pages/wholesale/price-list/list.vue');
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

// Add the mapping function
const mapToListData = (list: Entity[]): EntityList[] => {
  return list.map((item) => {
    return {
      ...item,
    };
  });
};

// FETCH DATA FOR ENTITY
const { data, error, refresh } = await useAsyncData<Entity[]>(() =>
  productApi.priceList.list(),
);

if (!data.value || error.value) {
  geinsLogError(
    `${t('failed_to_fetch_entity', { entityName }, 2)}`,
    error.value,
  );
}

watch(
  data,
  (newData) => {
    if (newData) {
      dataList.value = mapToListData(newData);
    }
  },
  { immediate: true },
);

// SET UP COLUMN OPTIONS FOR ENTITY
const columnOptions: ColumnOptions<EntityList> = {
  columnTypes: { name: 'link', channel: 'channels' },
  linkColumns: {
    name: { url: entityUrl, idField: '_id' },
  },
  columnTitles: { active: t('status') },
  excludeColumns: ['autoAddProducts', 'forced', 'identifier'],
};
// GET AND SET COLUMNS
const { getColumns, addActionsColumn } = useColumns<EntityList>();
const columns = getColumns(dataList.value, columnOptions);

addActionsColumn(
  columns,
  {
    onEdit: (item: Entity) =>
      navigateTo(`${entityUrl.replace(entityIdentifier, String(item._id))}`),
    onDelete: async (item: Entity) => await openDeleteDialog(item._id),
  },
  'actions',
  ['edit', 'delete'],
);

// SET COLUMN VISIBILITY STATE
// const { getVisibilityState } = useTable<EntityList>();
// const hiddenColumns: StringKeyOf<EntityList>[] = [];
// const visibilityState = getVisibilityState(hiddenColumns);
const { toast } = useToast();
const deletePriceList = async (
  id?: string,
  entityName?: string,
): Promise<boolean> => {
  try {
    if (!id) {
      throw new Error('ID is required for deletion');
    }
    await productApi.priceList.delete(id);
    toast({
      title: t('entity_deleted', { entityName }),
      variant: 'positive',
    });
    return true;
  } catch (error) {
    geinsLogError('deletePriceList :::', getErrorMessage(error));
    toast({
      title: t('entity_delete_failed', { entityName }),
      variant: 'negative',
    });
    return false;
  }
};

loading.value = false;

const deleteDialogOpen = ref(false);
const deleting = ref(false);
const deleteId = ref<string | undefined>();
const openDeleteDialog = async (id?: string) => {
  await nextTick();
  deleteId.value = id;
  deleteDialogOpen.value = true;
};
const confirmDelete = async () => {
  deleting.value = true;
  const success = await deletePriceList(deleteId.value, entityName);
  if (success) {
    refresh();
  }
  deleting.value = false;
  deleteDialogOpen.value = false;
};
</script>

<template>
  <DialogDelete
    v-model:open="deleteDialogOpen"
    :entity-name="entityName"
    :loading="deleting"
    @confirm="confirmDelete"
  />
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
    />
    <template #error="{ error: errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
