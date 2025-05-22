<script setup lang="ts">
import type {
  ColumnOptions,
  StringKeyOf,
  WholesaleAccountList,
} from '#shared/types';
type Entity = WholesaleAccount;
type EntityList = WholesaleAccountList;

const { t } = useI18n();
const route = useRoute();
const { geinsLogError } = useGeinsLog();
const { getEntityName, getNewEntityUrl, getEntityUrl } = useEntity(
  route.fullPath,
);

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const { wholesaleApi, deleteAccount, extractAccountGroupsfromTags } =
  useWholesale();
const dataList = ref<EntityList[]>([]);
const entityIdentifier = '{_id}';
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const entityUrl = getEntityUrl(entityIdentifier);
const loading = ref(true);

// Add the mapping function
const mapToListData = (accounts: Entity[]): EntityList[] => {
  return accounts.map((account) => {
    const accountGroups: string[] = extractAccountGroupsfromTags(account.tags);
    const salesReps: string[] = [];

    account.salesReps?.forEach((salesRep) => {
      const firstName = salesRep?.firstName;
      const lastName = salesRep?.lastName;
      const fullName = `${firstName} ${lastName}`;
      salesReps.push(fullName);
    });

    return {
      ...account,
      accountGroups,
      salesReps,
    };
  });
};

// FETCH DATA FOR ENTITY
const { data, error, refresh } = await useAsyncData<Entity[]>(() =>
  wholesaleApi.account.list(),
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
  entityLinkUrl: entityUrl,
  columnTypes: { name: 'entity-link' },
  columnTitles: { active: t('status') },
  excludeColumns: [
    'meta',
    'addresses',
    'buyers',
    'tags',
    'exVat',
    'limitedProductAccess',
  ],
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
const hiddenColumns: StringKeyOf<EntityList>[] = ['externalId'];
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
</script>

<template>
  <DialogDelete
    v-model:open="deleteDialogOpen"
    :entity-name="entityName"
    :loading="deleting"
    @confirm="confirmDelete"
  />
  <ContentHeader :title="$t('entity_caps', { entityName }, 2)">
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
    />
    <template #error="{ error: errorCatched }">
      <h2 class="text-xl font-bold">
        {{ $t('error_loading_entity', { entityName: $t(entityName, 2) }) }}
      </h2>
      <p>{{ errorCatched }}</p>
    </template>
  </NuxtErrorBoundary>
</template>
