<script setup lang="ts">
import type {
  Quotation,
  QuotationList,
  QuotationBatchQueryResult,
  ColumnOptions,
  StringKeyOf,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';

type Entity = Quotation;
type EntityList = QuotationList;

const scope = 'pages/orders/quotation/list.vue';
const { t } = useI18n();
const { geinsLogError } = useGeinsLog(scope);
const { getEntityName, getEntityNewUrl, getEntityUrl } = useEntityUrl();
const { getMarketNameById, getChannelNameById } = useAccountStore();

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

// Transform raw API quotation data to list view format
const mapToListData = (list: Entity[]): EntityList[] => {
  return list.map((item) => {
    const { items, ...rest } = item;
    return {
      ...rest,
      buyer: item.customer?.name || '',
      company: item.company?.name || '',
      itemCount: items?.length || 0,
      sum: {
        price: item.total.subtotal.toString(),
        currency: item.currency,
      },
      dateCreated: item.createdAt || '',
      dateModified: item.modifiedAt || '',
      expirationDate: item.validTo || '',
      dateSent: item.validFrom || '',
      owner: item.owner?.name || '',
      market: getMarketNameById(item.marketId) || '',
      channel: getChannelNameById(item.channelId) || '',
    };
  });
};

// FETCH DATA FOR ENTITY
const { data, error, refresh } = await useAsyncData<QuotationBatchQueryResult>(
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
        dataList.value = mapToListData(validData.items ?? []);
      }
    },
    { immediate: true },
  );

  // SET UP COLUMN OPTIONS FOR ENTITY
  const columnOptions: ColumnOptions<EntityList> = {
    columnTypes: {
      name: 'link',
      status: 'status',
      sum: 'currency',
    },
    linkColumns: {
      name: { url: entityUrl, idField: '_id' },
    },
    excludeColumns: [
      'suggestedShippingFee',
      'billingAddress',
      'shippingAddress',
      'validFrom',
      'validTo',
      'customer',
      'total',
      'marketId',
      'channelId',
      'createdAt',
      'modifiedAt',
    ],
  };
  // GET AND SET COLUMNS
  columns.value = getColumns(dataList.value, columnOptions);

  addActionsColumn(
    columns.value,
    {
      onEdit: (item: EntityList) =>
        navigateTo(`${entityUrl.replace(entityIdentifier, String(item._id))}`),
      onDelete: async (item: EntityList) => await openDeleteDialog(item._id),
    },
    'actions',
    ['edit', 'delete'],
  );
  loading.value = false;
});

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = [
  '_id',
  'quotationNumber',
  'currency',
  'market',
  'channel',
  'orderId',
];
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
    await orderApi.quotation.delete(id);
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

// SET UP SEARCHABLE FIELDS
const searchableFields: Array<keyof EntityList> = [
  '_id',
  'name',
  'company',
  'status',
  'owner',
];
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
      :searchable-fields="searchableFields"
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
      <h2 class="mb-3 text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
