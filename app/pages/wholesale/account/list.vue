<script setup lang="ts">
import type {
  ColumnOptions,
  StringKeyOf,
  WholesaleAccountList,
} from '#shared/types';
type Entity = WholesaleAccount;
type EntityList = WholesaleAccountList;

const { t } = useI18n();
const { geinsLogError } = useGeinsLog('pages/wholesale/account/list.vue');
const { getEntityName, getEntityNewUrl, getEntityUrl } = useEntityUrl();

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const { wholesaleApi } = useGeinsRepository();
const { deleteAccount, extractAccountGroupsfromTags } = useWholesale();
const dataList = ref<EntityList[]>([]);
const entityName = getEntityName();
const newEntityUrl = getEntityNewUrl();
const entityIdentifier = '{id}';
const entityUrl = getEntityUrl(entityIdentifier);
const loading = ref(true);

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
    return {
      ...account,
      accountGroups,
      salesReps,
      buyers,
    };
  });
};

// FETCH DATA FOR ENTITY
const { data, error, refresh } = await useAsyncData<Entity[]>(
  'wholesale-accounts',
  () => wholesaleApi.account.list({ fields: ['salesreps', 'buyers'] }),
);

if (!data.value || error.value) {
  geinsLogError(t('failed_to_fetch_entity', { entityName }, 2), error.value);
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
  columnTypes: {
    name: 'link',
    buyers: 'tooltip',
    salesReps: 'tooltip',
    accountGroups: 'tooltip',
  },
  linkColumns: {
    name: { url: entityUrl, idField: '_id' },
  },
  columnTitles: { active: t('status') },
  excludeColumns: ['meta', 'addresses', 'tags'],
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
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = [
  'externalId',
  'exVat',
  'limitedProductAccess',
];
const visibilityState = getVisibilityState(hiddenColumns);

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
    />
    <template #error="{ error: errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
