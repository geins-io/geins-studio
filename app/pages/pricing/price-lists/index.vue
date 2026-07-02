<script setup lang="ts">
import type { ColumnOptions, StringKeyOf } from '#shared/types';
import { ENTITIES, entityNewUrl, entityEditUrl } from '#shared/utils/entities';
import { useToast } from '@/components/ui/toast/use-toast';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';

type Entity = ProductPriceList;
type EntityList = ProductPriceList;

const scope = 'pages/pricing/price-lists/index.vue';
const { t } = useI18n();
const { geinsLogError } = useGeinsLog(scope);

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const { productApi } = useGeinsRepository();
const dataList = ref<EntityList[]>([]);
const entityKey = ENTITIES.price_list.key;
const newEntityUrl = entityNewUrl(entityKey);
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

const fetchError = ref(false);

// Add the mapping function
const mapToListData = (list: Entity[]): EntityList[] => {
  return list.map((item) => {
    return {
      ...item,
    };
  });
};

// FETCH DATA FOR ENTITY
const { data, error, refresh } = await useAsyncData<Entity[]>(
  'pricing-price-lists-list',
  () => productApi.priceList.list(),
);

const { getColumns, addActionsColumn } = useColumns<EntityList>();

onMounted(() => {
  watch(
    [data, error],
    ([newData, newError]) => {
      if (newError) {
        fetchError.value = true;
        dataList.value = [];
        return;
      }
      fetchError.value = false;
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
      name: { entityKey: entityKey, idField: '_id' },
    },
    columnTitles: { active: t('status') },
    excludeColumns: ['autoAddProducts', 'forced', 'identifier'],
  };
  // GET AND SET COLUMNS
  columns.value = getColumns(dataList.value, columnOptions);

  addActionsColumn(
    columns.value,
    {
      onEdit: (item: Entity) =>
        navigateTo(entityEditUrl(entityKey, String(item._id))),
      onCopy: async (item: Entity) => {
        try {
          const newPriceList = await productApi.priceList.id(item._id).copy();
          toast({
            title: t('entity_copied', { entityKey }),
            variant: 'positive',
          });
          await navigateTo(entityEditUrl(entityKey, String(newPriceList._id)));
        } catch (err) {
          geinsLogError('copyPriceList :::', getErrorMessage(err));
        }
      },
      onDelete: async (item: Entity) => await openDeleteDialog(item._id),
    },
    'actions',
    ['edit', 'copy', 'delete'],
  );
  loading.value = false;
});

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = [];
visibilityState.value = getVisibilityState(hiddenColumns);

const { toast } = useToast();
const deletePriceList = async (
  id?: string,
  entityKey?: string,
): Promise<boolean> => {
  try {
    if (!id) {
      throw new Error('ID is required for deletion');
    }
    await productApi.priceList.delete(id);
    toast({
      title: t('entity_deleted', { entityKey }),
      variant: 'positive',
    });
    return true;
  } catch (error) {
    geinsLogError('deletePriceList :::', getErrorMessage(error));
    return false;
  }
};

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
  const success = await deletePriceList(deleteId.value, entityKey);
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
    :entity-key="entityKey"
    :loading="deleting"
    @confirm="confirmDelete"
  />
  <ContentHeader :title="$t(entityKey, 2)">
    <ContentActionBar>
      <ButtonIcon icon="new" :href="newEntityUrl">
        {{ $t('new_entity', { entityKey }) }}
      </ButtonIcon>
    </ContentActionBar>
  </ContentHeader>
  <NuxtErrorBoundary>
    <TableView
      :loading="loading"
      :entity-key="entityKey"
      :columns="columns"
      :data="dataList"
      :init-visibility-state="visibilityState"
      :error="fetchError"
      :on-retry="refresh"
    >
      <template #empty-actions>
        <ButtonIcon
          icon="new"
          variant="secondary"
          @click="navigateTo(newEntityUrl)"
        >
          {{ $t('create_new_entity', { entityKey }) }}
        </ButtonIcon>
      </template>
    </TableView>
  </NuxtErrorBoundary>
</template>
