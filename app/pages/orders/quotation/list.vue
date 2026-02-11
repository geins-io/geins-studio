<script setup lang="ts">
import type { Quotation, ColumnOptions, StringKeyOf } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';

type Entity = Quotation;
type EntityList = Quotation;

const scope = 'pages/orders/quotations/list.vue';
const { t } = useI18n();
const { geinsLogError } = useGeinsLog(scope);
const { getEntityName, getEntityNewUrl, getEntityUrl } = useEntityUrl();

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const { orderApi } = useGeinsRepository();
const dataList = ref<EntityList[]>([]);
const entityName = getEntityName();
const newEntityUrl = getEntityNewUrl();
const entityIdentifier = '{id}';
const entityUrl = getEntityUrl(entityIdentifier);
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

const { handleFetchResult, showErrorToast } = usePageError({
  entityName,
  entityList: true,
  scope,
});

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
  'orders-quotations-list',
  () => orderApi.quotation.list(),
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
      name: 'link',
      status: 'status',
      dateModified: 'date',
      sum: 'currency',
      expirationDate: 'date',
      itemCount: 'number',
    },
    linkColumns: {
      name: { url: entityUrl, idField: '_id' },
    },
    columnTitles: {
      _id: 'ID',
      name: t('name'),
      status: t('status'),
      accountName: t('company'),
      dateCreated: t('created'),
      dateModified: t('modified'),
      sum: t('sum'),
      expirationDate: t('expiration_date'),
      itemCount: t('item', 2),
      createdBy: t('created_by'),
    },
    excludeColumns: [
      '_type',
      'accountId',
      'channel',
      'currency',
      'notes',
      'items',
    ],
  };
  // GET AND SET COLUMNS
  columns.value = getColumns(dataList.value, columnOptions);

  addActionsColumn(
    columns.value,
    {
      onEdit: (item: Entity) =>
        navigateTo(`${entityUrl.replace(entityIdentifier, String(item._id))}`),
      onDelete: async (item: Entity) => await openDeleteDialog(item._id),
    },
    'actions',
    ['edit', 'delete'],
  );
  loading.value = false;
});

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = [];
visibilityState.value = getVisibilityState(hiddenColumns);

const { toast } = useToast();
const deleteQuotation = async (
  id?: string,
  entityName?: string,
): Promise<boolean> => {
  try {
    if (!id) {
      throw new Error('ID is required for deletion');
    }
    // TODO: Implement actual delete when API is available
    // await orderApi.quotation.delete(id);
    toast({
      title: t('entity_deleted', { entityName }),
      variant: 'positive',
    });
    return true;
  } catch (error) {
    geinsLogError('deleteQuotation :::', getErrorMessage(error));
    showErrorToast(t('entity_delete_failed', { entityName }));
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
  const success = await deleteQuotation(deleteId.value, entityName);
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
      :init-visibility-state="visibilityState"
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
