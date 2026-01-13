<script setup lang="ts">
import type {
  ColumnOptions,
  StringKeyOf,
  CustomerCompanyList,
} from '#shared/types';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';
type Entity = CustomerCompany;
type EntityList = CustomerCompanyList;

const scope = 'pages/customers/company/list.vue';
const { t } = useI18n();
const { getEntityName, getEntityNewUrl, getEntityUrl } = useEntityUrl();

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const { customerApi } = useGeinsRepository();
const { deleteCompany, extractCompanyGroupsFromTags } = useCustomerCompanies();
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
const mapToListData = (companies: Entity[]): EntityList[] => {
  return companies.map((company) => {
    const groups = extractCompanyGroupsFromTags(company.tags);

    const companyGroups = createTooltip({
      items: groups,
      entityName: 'company_group',
      formatter: (group) => `${group}`,
      t,
    });

    const buyers = createTooltip({
      items: company.buyers,
      entityName: 'buyer',
      formatter: (buyer) =>
        `${buyer.firstName} ${buyer.lastName} (${buyer._id})`,
      t,
    });

    const salesReps = createTooltip({
      items: company.salesReps,
      entityName: 'sales_rep',
      formatter: (salesRep) => `${salesRep?.firstName} ${salesRep?.lastName}`,
      t,
    });

    const priceLists = createTooltip({
      items: company.priceLists,
      entityName: 'price_list',
      formatter: (priceList) => `${priceList?.name}`,
      t,
    });

    return {
      ...company,
      companyGroups,
      salesReps,
      buyers,
      priceLists,
    };
  });
};

// FETCH DATA FOR ENTITY
const { data, error, refresh } = await useAsyncData<Entity[]>(
  'customer-companies-list',
  () =>
    customerApi.company.list({
      fields: ['salesreps', 'buyers', 'pricelists'],
    }),
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
      buyers: 'tooltip',
      salesReps: 'tooltip',
      companyGroups: 'tooltip',
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
  loading.value = false;
});

const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = [
  'externalId',
  'exVat',
  'limitedProductAccess',
];
visibilityState.value = getVisibilityState(hiddenColumns);

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
  const success = await deleteCompany(deleteId.value, entityName);
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
