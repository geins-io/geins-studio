<script setup lang="ts">
import type {
  ColumnOptions,
  StringKeyOf,
  CustomerAccountList,
} from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';
type Entity = CustomerAccount;
type EntityList = CustomerAccountList;

const scope = 'pages/customers/account/list.vue';
const { t } = useI18n();
const { getEntityName, getEntityNewUrl, getEntityUrl } = useEntityUrl();

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const { customersApi } = useGeinsRepository();
const { deleteAccount, extractAccountGroupsfromTags } = useCustomers();
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
const mapToListData = (accounts: Entity[]): EntityList[] => {
  return accounts.map((account) => {
    const groups = extractAccountGroupsfromTags(account.tags);

    const accountGroups = createTooltip({
      items: groups,
      entityName: 'account_group',
      formatter: (group) => `${group}`,
      t,
    });

    const buyers = createTooltip({
      items: account.buyers,
      entityName: 'buyer',
      formatter: (buyer) =>
        `${buyer.firstName} ${buyer.lastName} (${buyer._id})`,
      t,
    });

    const salesReps = createTooltip({
      items: account.salesReps,
      entityName: 'sales_rep',
      formatter: (salesRep) => `${salesRep?.firstName} ${salesRep?.lastName}`,
      t,
    });

    const priceLists = createTooltip({
      items: account.priceLists,
      entityName: 'price_list',
      formatter: (priceList) => `${priceList?.name}`,
      t,
    });

    return {
      ...account,
      accountGroups,
      salesReps,
      buyers,
      priceLists,
    };
  });
};

// FETCH DATA FOR ENTITY
const { data, error, refresh } = await useAsyncData<Entity[]>(
  'customer-accounts-list',
  () =>
    customersApi.account.list({
      fields: ['salesreps', 'buyers', 'pricelists'],
    }),
);

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
      buyers: 'tooltip',
      salesReps: 'tooltip',
      accountGroups: 'tooltip',
      priceLists: 'tooltip',
    },
    linkColumns: {
      name: { url: entityUrl, idField: '_id' },
    },
    columnTitles: {
      active: t('status'),
      limitedProductAccess: t('customers.product_access_restricted_label'),
    },
    excludeColumns: ['meta', 'addresses', 'tags'],
  };
  // GET AND SET COLUMNS
  const { getColumns, addActionsColumn } = useColumns<EntityList>();
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

  // SET COLUMN VISIBILITY STATE
  const { getVisibilityState } = useTable<EntityList>();
  const hiddenColumns: StringKeyOf<EntityList>[] = [
    'externalId',
    'exVat',
    'limitedProductAccess',
  ];
  visibilityState.value = getVisibilityState(hiddenColumns);

  loading.value = false;
});

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
  const success = await deleteAccount(deleteId.value, entityName);
  if (success) {
    refresh();
  }
  deleting.value = false;
  deleteDialogOpen.value = false;
};
// SET UP SEARCHABLE FIELDS
const searchableFields: Array<keyof EntityList> = ['_id', 'name', 'vatNumber'];
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
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
