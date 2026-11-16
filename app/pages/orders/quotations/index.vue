<script setup lang="ts">
import type {
  Quotation,
  QuotationList,
  QuotationBatchQueryResult,
  ColumnOptions,
  StringKeyOf,
} from '#shared/types';
import { ENTITIES, entityNewUrl, entityEditUrl } from '#shared/utils/entities';
import {
  isQuotationDeletable,
  openRevisionDraft,
  revisionSuffix,
  withoutLinkedRevisionDrafts,
} from '#shared/utils/quotation';
import { useToast } from '@/components/ui/toast/use-toast';
import type { ColumnDef, VisibilityState } from '@tanstack/vue-table';
import { NuxtLink } from '#components';

type Entity = Quotation;
type EntityList = QuotationList;

const scope = 'pages/orders/quotations/index.vue';
const { t } = useI18n();
const { geinsLogError } = useGeinsLog(scope);
const { getChannelNameById } = useAccountStore();

definePageMeta({
  pageType: 'list',
});

// GLOBAL SETUP
const { orderApi } = useGeinsRepository();
const dataList = ref<EntityList[]>([]);
const entityKey = ENTITIES.quotation.key;
const newEntityUrl = entityNewUrl(entityKey);
const loading = ref(true);
const columns = ref<ColumnDef<EntityList>[]>([]);
const visibilityState = ref<VisibilityState>({});

const fetchError = ref(false);

// The revision number as the quotation number's suffix: "v 00", "v 03"
const versionTag = (revision?: number) =>
  revision === undefined
    ? ''
    : t('orders.version_tag', { version: revisionSuffix(revision) });

// Transform raw API quotation data to list view format
const mapToListData = (list: Entity[]): EntityList[] => {
  return list.map((item) => {
    const { items, ...rest } = item;
    return {
      ...rest,
      version: versionTag(item.revision),
      revisionDraft: openRevisionDraft(item),
      buyer: fullName(item.customer),
      company: item.company?.name || '',
      products: t('nr_of_entity', {
        entityKey: 'product',
        count: items?.length ?? 0,
      }),
      owner: item.owner?.name || '',
      sum: {
        price: item.total.grandTotalExVat.toString(),
        currency: item.currency,
      },
      requireConfirmation: item.settings?.requireConfirmation
        ? t('yes')
        : t('no'),
      dateModified: item.modifiedAt || '',
      dateSent: item.validFrom || '',
      expirationDate: item.validTo || '',
      dateCreated: item.createdAt || '',
      channel: getChannelNameById(item.channelId) || '',
    };
  });
};

// FETCH DATA FOR ENTITY
// `revisions` for the open draft's link; the rest is the API's default set
const { data, error, refresh } = await useAsyncData<QuotationBatchQueryResult>(
  'orders-quotations-list',
  () =>
    orderApi.quotation.list(undefined, {
      fields: ['company', 'owner', 'customer', 'items', 'revisions'],
    }),
);

const { getColumns, addActionsColumn, setColumnOrder, getBasicCellStyle } =
  useColumns<EntityList>();

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
        dataList.value = mapToListData(
          withoutLinkedRevisionDrafts(newData.items ?? []),
        );
      }
    },
    { immediate: true },
  );

  // SET UP COLUMN OPTIONS FOR ENTITY
  const columnOptions: ColumnOptions<EntityList> = {
    columnTitles: {
      quotationNumber: t('ref_number'),
      sum: t('orders.total') + ` (${t('ex_vat')})`,
      version: t('version'),
    },
    columnTypes: {
      name: 'link',
      sum: 'currency',
    },
    linkColumns: {
      name: { entityKey: entityKey, idField: '_id' },
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
      'discount',
      'settings',
      'request',
      'orderDetails',
      'externalReference',
      'orderPublicId',
      'revision',
      'revisionOf',
      'revisedBy',
      'revisions',
      'revisionDraft',
    ],
  };
  // GET AND SET COLUMNS
  columns.value = getColumns(dataList.value, columnOptions);
  // getColumns puts Status last, so moving it to 10 pushes Version to 11
  columns.value = setColumnOrder(columns.value, 'version', 10);
  columns.value = setColumnOrder(columns.value, 'status', 10);

  const versionColumn = columns.value.find((col) => col.id === 'version');
  if (versionColumn) {
    versionColumn.cell = ({ table, row }) => {
      const draft = row.original.revisionDraft;
      return h('div', { class: cn(getBasicCellStyle(table), 'gap-2') }, [
        h('span', { class: 'tabular-nums' }, row.original.version),
        draft &&
          h(
            NuxtLink,
            {
              to: entityEditUrl(entityKey, draft.quotationId),
              class: 'link-text',
            },
            {
              default: () =>
                t('orders.revision_draft', {
                  version: versionTag(draft.revision),
                }),
            },
          ),
      ]);
    };
  }

  addActionsColumn(
    columns.value,
    {
      onEdit: (item: EntityList) =>
        navigateTo(entityEditUrl(entityKey, String(item._id))),
      onCopy: async (item: EntityList) => {
        try {
          const newDraft = await orderApi.quotation.copy(item._id);
          toast({
            title: t('entity_copied', { entityKey }),
            variant: 'positive',
          });
          await navigateTo(entityEditUrl(entityKey, String(newDraft._id)));
        } catch (err) {
          geinsLogError('copyQuotation :::', getErrorMessage(err));
        }
      },
      onDelete: async (item: EntityList) => await openDeleteDialog(item._id),
      disabledActions: (item: EntityList) =>
        !isQuotationDeletable(item) ? (['delete'] as TableRowAction[]) : [],
    },
    'actions',
    ['edit', 'copy', 'delete'],
  );
  loading.value = false;
});

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<EntityList>();
const hiddenColumns: StringKeyOf<EntityList>[] = [
  '_id',
  'quotationNumber',
  'currency',
  'channel',
  'orderId',
  'terms',
  'requireConfirmation',
];
visibilityState.value = getVisibilityState(hiddenColumns);

const { toast } = useToast();
const deleteQuotation = async (
  id?: string,
  entityKey?: string,
): Promise<boolean> => {
  try {
    if (!id) {
      throw new Error('ID is required for deletion');
    }
    await orderApi.quotation.delete(id);
    toast({
      title: t('entity_deleted', { entityKey }),
      variant: 'positive',
    });
    return true;
  } catch (error) {
    geinsLogError('deleteQuotation :::', getErrorMessage(error));
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
  const success = await deleteQuotation(deleteId.value, entityKey);
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
      :searchable-fields="searchableFields"
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
