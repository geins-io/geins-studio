<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { useToast } from '@/components/ui/toast/use-toast';
import { toTypedSchema } from '@vee-validate/zod';
import { useCustomerCompanies } from '@/composables/useCustomerCompanies';
import { useCompanyOrders } from '@/composables/useCompanyOrders';
import {
  DataItemDisplayType,
  TableMode,
  SelectorCondition,
  type CustomerCompanyApiOptions,
  type CustomerBuyerList,
} from '#shared/types';
import * as z from 'zod';
import { LucidePackage, LucideUser } from 'lucide-vue-next';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const scope = 'pages/customers/company/[id].vue';
const { customerApi } = useGeinsRepository();
const {
  hasValidatedVat,
  vatValid,
  vatValidating,
  vatNumberValidated,
  vatValidationSummary,
  extractCompanyGroupsFromTags,
  convertCompanyGroupsToTags,
  validateVatNumber,
  getAddresses,
} = useCustomerCompanies();
const { t } = useI18n();
const { geinsLogError } = useGeinsLog(scope);
const accountStore = useAccountStore();
const { toast } = useToast();
const viewport = useViewport();
const breadcrumbsStore = useBreadcrumbsStore();

// =====================================================================================
// FORM VALIDATION SCHEMA
// =====================================================================================
const addressSchema = z.object({
  email: z.string().min(1, { message: t('form.field_required') }),
  phone: z.string().optional(),
  company: z.string().min(1, { message: t('form.field_required') }),
  firstName: z.string().min(1, { message: t('form.field_required') }),
  lastName: z.string().min(1, { message: t('form.field_required') }),
  addressLine1: z.string().min(1, { message: t('form.field_required') }),
  addressLine2: z.string().optional(),
  zip: z.string().min(1, { message: t('form.field_required') }),
  city: z.string().min(1, { message: t('form.field_required') }),
  region: z.string().optional(),
  country: z.string().min(1, { message: t('form.field_required') }),
});

const formSchema = toTypedSchema(
  z.object({
    details: z
      .object({
        name: z.string().min(1, { message: t('form.field_required') }),
        vatNumber: z.string().min(1, { message: t('form.field_required') }),
        externalId: z.string().optional(),
        channels: z.array(z.string()).min(1, {
          message: t('form.field_required'),
        }),
        salesReps: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
      })
      .required(),
    addresses: z.object({
      billing: addressSchema,
      shipping: addressSchema.optional(),
    }),
  }),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
const entityBase: CustomerCompanyCreate = {
  name: '',
  active: true,
  vatNumber: '',
  externalId: '',
  channels: [],
  tags: [],
  salesReps: [],
  addresses: [],
  buyers: [],
  exVat: false,
  limitedProductAccess: false,
  priceLists: [],
};

const addressBase: AddressBase = {
  email: '',
  phone: '',
  company: '',
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  zip: '',
  city: '',
  region: '',
  country: '',
};

// =====================================================================================
// UI STATE MANAGEMENT
// =====================================================================================
// Tabs & Steps
const tabs = [
  t('general'),
  t('buyer', 2),
  t('price_list', 2),
  t('order', 2),
  t('settings'),
];

const totalCreateSteps = 2;
const { currentStep, nextStep, previousStep } =
  useStepManagement(totalCreateSteps);

// Address management
const billingAddress = ref<AddressUpdate>({
  ...addressBase,
  addressType: 'billing',
});
const shippingAddress = ref<AddressUpdate>({
  ...addressBase,
  addressType: 'shipping',
});
const addShippingAddress = ref(false);

const stepValidationMap: Record<number, string> = {
  1: 'details',
  2: addShippingAddress.value ? 'addresses' : 'billing',
};

// Company data
const companyGroups = ref<string[]>([]);
const companyTags = ref<EntityBaseWithName[]>([]);

// Form validation
const createDisabled = ref(true);

// =====================================================================================
// ENTITY EDIT COMPOSABLE
// =====================================================================================
const {
  entityName,
  entityId,
  createMode,
  loading,
  newEntityUrl,
  entityListUrl,
  showSidebar,
  currentTab,
  entityDataCreate,
  entityDataUpdate,
  entityData,
  entityPageTitle,
  entityLiveStatus,
  refreshEntityData,
  entityFetchKey,
  form,
  formValid,
  formTouched,
  validateOnChange,
  hasUnsavedChanges,
  unsavedChangesDialogOpen,
  confirmLeave,
  createEntity,
  updateEntity,
  deleteEntity,
  parseAndSaveData,
  validateSteps,
} = useEntityEdit<
  CustomerCompanyBase,
  CustomerCompany,
  CustomerCompanyCreate,
  CustomerCompanyUpdate,
  CustomerCompanyApiOptions
>({
  repository: customerApi.company,
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  stepValidationMap,
  getInitialFormValues: (entityData) => ({
    details: {
      name: entityData.name || '',
      vatNumber: entityData.vatNumber || '',
      externalId: entityData.externalId || '',
      channels: entityData.channels || [],
      salesReps: entityData.salesReps || [],
      tags: companyGroups.value,
    },
    addresses: {
      billing: billingAddress.value,
      shipping: shippingAddress.value,
    },
  }),
  parseEntityData: async (company: CustomerCompany) => {
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
    buyers.value = company.buyers || [];
    buyersList.value = company.buyers.map((buyer) => {
      return {
        ...buyer,
        priceLists: createTooltip({
          items: buyer.priceLists || [],
          entityName: 'price_list',
          formatter: (priceList) => `${priceList?.name}`,
          t,
        }),
      };
    });
    entityLiveStatus.value = company.active || false;
    companyGroups.value = extractCompanyGroupsFromTags(company.tags || []);
    addedPriceLists.value = company.priceLists || [];

    billingAddress.value = {
      ...company.addresses?.find(
        (address) =>
          address.addressType === 'billing' ||
          address.addressType === 'billingandshipping',
      ),
    };
    const shipping = company.addresses?.find(
      (address) => address.addressType === 'shipping',
    );
    if (shipping) {
      shippingAddress.value = { ...shipping };
      addShippingAddress.value = true;
    }

    await validateVatNumber(company.vatNumber);

    form.setValues({
      details: {
        name: company.name || '',
        vatNumber: company.vatNumber || '',
        externalId: company.externalId || '',
        channels: company.channels || [],
        salesReps: company.salesReps?.map((rep) => rep._id || rep) || [],
        tags: companyGroups.value,
      },
      addresses: {
        billing: billingAddress.value,
        shipping: shippingAddress.value,
      },
    });
  },
  prepareCreateData: (formData) => {
    const addresses = getAddresses(
      { ...billingAddress.value, ...formData.addresses?.billing },
      addShippingAddress.value
        ? { ...shippingAddress.value, ...formData.addresses?.shipping }
        : undefined,
    );
    const tags = convertCompanyGroupsToTags(companyGroups.value);

    return {
      ...entityBase,
      ...formData.details,
      addresses,
      tags,
    };
  },
  prepareUpdateData: (formData, entity) => {
    const tags = convertCompanyGroupsToTags(companyGroups.value);

    return {
      ...entity,
      ...formData.details,
      tags,
    };
  },
  reshapeEntityData: (entityData) => {
    return {
      ...entityData,
      salesReps: entityData.salesReps?.map((salesRep) => salesRep._id),
      priceLists: entityData.priceLists?.map((priceList) => priceList._id),
      buyers: undefined,
    };
  },
  onFormValuesChange: async (values) => {
    const addresses = getAddresses(
      {
        ...billingAddress.value,
        ...values.addresses?.billing,
      },
      addShippingAddress.value
        ? {
            ...shippingAddress.value,
            ...values.addresses?.shipping,
          }
        : undefined,
    );
    companyGroups.value = values.details.tags || [];
    const tags = convertCompanyGroupsToTags(companyGroups.value);
    const newValues = {
      ...entityData.value,
      ...values.details,
      addresses,
      tags,
    };

    if (createMode.value) {
      entityDataCreate.value = newValues;
    } else {
      entityDataUpdate.value = newValues;
    }
    if (entityData.value?.vatNumber) {
      await validateVatNumber(entityData.value.vatNumber);
    }
  },
});

// =====================================================================================
// ERROR HANDLING SETUP
// =====================================================================================

const { handleFetchResult } = usePageError({
  entityName,
  entityId: entityId.value,
  scope,
});

// =====================================================================================
// SALES REPS MANAGEMENT
// =====================================================================================
const users = ref<User[]>([]);
const { useGeinsFetch } = useGeinsApi();

const fetchUsers = async () => {
  const usersResult = await useGeinsFetch<User[]>('/user/list');
  if (!usersResult.error.value) {
    users.value = usersResult.data.value as User[];
    users.value = users.value.map((user) => ({
      ...user,
      name: user.firstName + ' ' + user.lastName,
    }));
  }
};

fetchUsers();

// =====================================================================================
// BUYERS MANAGEMENT
// =====================================================================================
const buyers = ref<CustomerBuyer[]>([]);
const buyersList = ref<CustomerBuyerList[]>([]);
const buyerPanelOpen = ref(false);
const buyerToEdit = ref<CustomerBuyerUpdate | undefined>();
const buyerPanelMode = ref<'edit' | 'add'>('add');
const columnOptions: ColumnOptions<CustomerBuyerList> = {
  columnTypes: {
    restrictToDedicatedPriceLists: 'default',
    priceLists: 'tooltip',
  },
  columnTitles: {
    _id: t('person.email'),
    active: t('status'),
    restrictToDedicatedPriceLists: t(
      'customers.product_access_restricted_label',
    ),
  },
  excludeColumns: ['accountId'],
  sortable: false,
};
const { getColumns, addActionsColumn, orderAndFilterColumns } =
  useColumns<CustomerBuyerList>();

// Use computed for reactive columns
const buyerColumns = computed(() => {
  if (buyersList.value.length === 0) return [];

  let columns = getColumns(buyersList.value, columnOptions);

  columns = orderAndFilterColumns(columns, [
    'firstName',
    'lastName',
    '_id',
    'phone',
    'priceLists',
    'restrictToDedicatedPriceLists',
    'active',
  ]);

  addActionsColumn(
    columns,
    {
      onEdit: (entity: CustomerBuyerList) => {
        buyerToEdit.value = buyers.value
          .map((buyer) => ({
            ...buyer,
            priceLists: buyer.priceLists?.map((pl) => pl._id) || [],
          }))
          .find((buyer) => buyer._id === entity._id);
        buyerPanelOpen.value = true;
        buyerPanelMode.value = 'edit';
      },
    },
    'edit',
  );
  return columns;
});

watch(buyerPanelOpen, async (open) => {
  if (!open) {
    buyerToEdit.value = undefined;
    buyerPanelMode.value = 'add';
    await refreshEntityData.value();
  }
});

// =====================================================================================
// PRICELISTS MANAGEMENT
// =====================================================================================

const { productApi } = useGeinsRepository();
const addedPriceLists = ref<CustomerPriceList[]>([]);
const addedPriceListsIds = computed(() => {
  return addedPriceLists.value.map((pl) => pl._id);
});
const allPriceLists = ref<CustomerPriceList[]>([]);

const {
  getColumns: getPriceListColumns,
  addActionsColumn: addPriceListActionsColumn,
} = useColumns<CustomerPriceList>();

const columnOptionsPriceLists: ColumnOptions<CustomerPriceList> = {
  columnTypes: {
    name: 'link',
  },
  linkColumns: {
    name: {
      url: '/pricing/price-list/{id}',
      idField: '_id',
    },
  },
  columnTitles: {
    productCount: t('product', 2),
  },
  includeColumns: ['_id', 'name', 'currency', 'productCount', 'active'],
  sortable: false,
};

// Use computed for reactive columns
const priceListColumns = computed(() => {
  if (addedPriceLists.value.length === 0) return [];

  const columns = getPriceListColumns(
    addedPriceLists.value,
    columnOptionsPriceLists,
  );

  addPriceListActionsColumn(
    columns,
    {
      onDelete: (entity: CustomerPriceList) => {
        removePriceList(entity._id);
      },
    },
    'delete',
  );
  return columns;
});

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<CustomerPriceList>();
const hiddenColumns: StringKeyOf<CustomerPriceList>[] = ['_id'];
const visibilityState = getVisibilityState(hiddenColumns);

const addPriceList = async (id: string) => {
  const priceList = allPriceLists.value.find((pl) => pl._id === id);
  if (priceList && !addedPriceListsIds.value.includes(priceList._id)) {
    addedPriceLists.value = [
      ...addedPriceLists.value,
      {
        ...priceList,
      },
    ];
  }
};

const removePriceList = (id: string) => {
  const index = addedPriceListsIds.value.indexOf(id);
  if (index !== -1) {
    addedPriceLists.value = addedPriceLists.value.filter((pl) => pl._id !== id);
  }
};

watch(addedPriceLists, (newPriceLists) => {
  if (newPriceLists.length > 0) {
    entityDataUpdate.value.priceLists = newPriceLists.map((pl) => pl._id);
  } else {
    entityDataUpdate.value.priceLists = [];
  }
});

if (!createMode.value) {
  const { data, error } = await useAsyncData<ProductPriceList[]>(() =>
    productApi.priceList.list({ fields: ['products'] }),
  );

  if (!data.value || error.value) {
    geinsLogError(
      `${t('failed_to_fetch_entity', { entityName: 'price_list' }, 2)}`,
      error.value,
    );
  } else {
    allPriceLists.value = data.value.map((priceList) => ({
      ...priceList,
      productCount: priceList.products?.totalItemCount || 0,
    }));
  }
}

// =====================================================================================
// ORDERS MANAGEMENT
// =====================================================================================

const { ordersList, orderColumns, fetchOrders } = useCompanyOrders();

// =====================================================================================
// ADDRESS MANAGEMENT
// =====================================================================================
const deleteAddressDialogOpen = ref(false);
const deletingAddressId = ref<string>('');

const openAddressDeleteDialog = async (addressId: string) => {
  deletingAddressId.value = addressId;
  await nextTick();
  deleteAddressDialogOpen.value = true;
};

const confirmAddressDelete = async () => {
  deleting.value = true;
  if (deletingAddressId.value === 'new') {
    entityDataUpdate.value.addresses = entityDataUpdate.value.addresses?.filter(
      (address) => address.addressType !== 'shipping',
    );
  } else {
    entityDataUpdate.value.addresses = entityDataUpdate.value.addresses?.filter(
      (address) => address._id !== deletingAddressId.value,
    );
  }
  shippingAddress.value = {
    ...addressBase,
    addressType: 'shipping',
  };
  addShippingAddress.value = false;

  toast({
    title: t('entity_deleted', { entityName: 'shipping_address' }),
    variant: 'positive',
  });

  deleting.value = false;
  deleteAddressDialogOpen.value = false;
};

const hasShippingAddress = computed(() => {
  return entityData.value.addresses?.some(
    (address: AddressUpdate) => address.addressType === 'shipping',
  );
});

const saveAddress = async (address: AddressUpdate) => {
  const isNewShipping = !address._id && address.addressType === 'shipping';

  if (isNewShipping) {
    shippingAddress.value = address;
    addShippingAddress.value = true;
    entityDataUpdate.value.addresses = getAddresses(
      billingAddress.value,
      shippingAddress.value,
    );
  } else {
    const updatedAddresses: AddressUpdate[] | undefined =
      entityDataUpdate.value?.addresses?.map((addr) => {
        if (addr._id === address._id) {
          return { ...addr, ...address };
        }
        return addr;
      });
    entityDataUpdate.value.addresses = updatedAddresses;

    if (address.addressType?.includes('billing')) {
      billingAddress.value = address;
    } else {
      shippingAddress.value = address;
      addShippingAddress.value = true;
    }
  }
};

// =====================================================================================
// STEP ACTIONS & CUSTOM HANDLERS
// =====================================================================================
const saveCompanyDetails = async () => {
  const stepValid = await validateSteps([1]);

  if (stepValid) {
    validateOnChange.value = false;
    form?.resetForm();
    form?.setValues({
      details: {
        ...entityDataCreate.value,
        tags: companyGroups.value,
      },
      addresses: {
        billing: {
          company: entityDataCreate.value.name,
        },
      },
    });

    nextStep();
    createDisabled.value = false;
  } else {
    validateOnChange.value = true;
  }
};

const handleCreateCompany = async () => {
  await createEntity(
    async () => {
      const stepsValid = await validateSteps([1, 2]);
      if (!stepsValid) {
        validateOnChange.value = true;
        return false;
      }
      validateOnChange.value = false;
      return true;
    },
    { fields: ['all'] },
  );
};

const handleUpdateCompany = async () => {
  await updateEntity(
    async () => {
      const stepsValid = await validateSteps([1]);
      if (!stepsValid) {
        validateOnChange.value = true;
        return false;
      }
      validateOnChange.value = false;
      return true;
    },
    { fields: ['all'] },
  );
};

// =====================================================================================
// DELETE FUNCTIONALITY
// =====================================================================================
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, entityListUrl);

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
const summary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  if (!createMode.value) {
    dataList.push({
      label: t('entity_id', { entityName }),
      value: String(entityDataUpdate.value?._id),
      displayType: DataItemDisplayType.Copy,
    });
  }
  if (entityData.value?.name) {
    dataList.push({
      label: t('entity_name', { entityName }),
      value: entityData.value.name,
    });
  }
  if (entityData.value?.salesReps?.length) {
    const displayValue = entityData.value.salesReps
      .map((id: string) => getEntityNameById(id, users.value))
      .join(', ');
    dataList.push({
      label: t('sales_rep', 2),
      value: entityData.value.salesReps,
      displayValue,
      displayType: DataItemDisplayType.Array,
      entityName: 'sales_rep',
    });
  }
  if (entityData.value?.channels?.length) {
    const displayValue = entityData.value.channels
      .map((id: string) => accountStore.getChannelNameById(id))
      .join(', ');
    dataList.push({
      label: t('channel', 2),
      value: entityData.value.channels,
      displayValue,
      displayType: DataItemDisplayType.Array,
      entityName: 'channel',
    });
  }
  if (companyGroups.value.length) {
    const displayValue = companyGroups.value.join(', ');
    dataList.push({
      label: t('customers.company_groups'),
      value: companyGroups.value,
      displayValue,
      displayType: DataItemDisplayType.Array,
      entityName: 'company_group',
    });
  }
  return dataList;
});

const settingsSummary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  dataList.push({
    label: t('customers.vat'),
    value: entityData.value?.exVat
      ? t('customers.vat_true')
      : t('customers.vat_false'),
  });
  dataList.push({
    label: t('customers.product_access'),
    value: entityData.value?.limitedProductAccess
      ? t('customers.product_access_restricted')
      : t('customers.product_access_all'),
  });

  return dataList;
});

const otherSummary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  if (entityData.value?.buyers?.length) {
    const displayValue = entityData.value.buyers
      .map((buyer: CustomerBuyer) => `${buyer.firstName} ${buyer.lastName}`)
      .join(', ');
    dataList.push({
      label: t('buyer', 2),
      value: entityData.value.buyers,
      displayValue,
      entityName: 'buyer',
      displayType: DataItemDisplayType.Array,
    });
  }
  if (entityData.value?.priceLists?.length) {
    const displayValue = entityData.value.priceLists
      .map((pl: string) => getEntityNameById(pl, allPriceLists.value))
      .join(', ');
    dataList.push({
      label: t('price_list', 2),
      value: entityData.value.priceLists,
      displayValue,
      entityName: 'price_list',
      displayType: DataItemDisplayType.Array,
    });
  }
  if (ordersList.value.length) {
    dataList.push({
      label: t('order', 2),
      value: t('nr_of_entity', {
        count: ordersList.value.length,
        entityName: 'order',
      }),
    });
  }
  return dataList;
});

const { summaryProps } = useEntityEditSummary({
  createMode,
  formTouched,
  summary,
  settingsSummary,
  entityName,
  entityLiveStatus,
});

// =====================================================================================
// DATA LOADING FOR EDIT MODE
// =====================================================================================
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<CustomerCompany>(
    entityFetchKey.value,
    () => customerApi.company.get(entityId.value, { fields: ['all'] }),
  );

  refreshEntityData.value = refresh;

  onMounted(async () => {
    const company = handleFetchResult<CustomerCompany>(error.value, data.value);

    // Parse and save initial data
    await parseAndSaveData(company);
    await nextTick();

    // Watch for data updates
    watch(data, async (newData) => {
      if (newData) {
        await parseAndSaveData(newData);
        await nextTick();
      }
    });

    const tagsData = ref<string[] | null>(null);

    try {
      tagsData.value = await customerApi.company.tags.get();
    } catch (e) {
      geinsLogError('error fetching tags:', e);
    }

    if (tagsData.value) {
      const extractedTags = extractCompanyGroupsFromTags(tagsData.value);
      companyTags.value = extractedTags.map((tag) => ({
        _id: tag,
        name: tag,
      }));
    }

    const orderSelectionQuery: OrderBatchQuery = {
      include: [
        {
          selections: [
            {
              condition: SelectorCondition.And,
              wholesaleAccountIds: [entityId.value],
            },
          ],
        },
      ],
    };

    await fetchOrders(
      orderSelectionQuery,
      { fields: ['pricelists', 'itemcount'] },
      allPriceLists.value,
      undefined,
      buyers.value,
    );
  });
}
</script>

<template>
  <DialogUnsavedChanges
    v-model:open="unsavedChangesDialogOpen"
    :entity-name="entityName"
    :loading="loading"
    @confirm="confirmLeave"
  />
  <DialogDelete
    v-model:open="deleteDialogOpen"
    :entity-name="entityName"
    :loading="deleting"
    @confirm="confirmDelete"
  />
  <DialogDelete
    v-model:open="deleteAddressDialogOpen"
    entity-name="shipping_address"
    :loading="deleting"
    @confirm="confirmAddressDelete"
  />

  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            :disabled="!hasUnsavedChanges || loading"
            @click="handleUpdateCompany"
            >{{ $t('save_entity', { entityName }) }}</ButtonIcon
          >
          <DropdownMenu v-if="!createMode">
            <DropdownMenuTrigger as-child>
              <Button size="icon" variant="secondary">
                <LucideMoreHorizontal class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem as-child>
                <NuxtLink :to="newEntityUrl">
                  <LucidePlus class="mr-2 size-4" />
                  <span>{{ $t('new_entity', { entityName }) }}</span>
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="openDeleteDialog">
                <LucideTrash class="mr-2 size-4" />
                <span>{{ $t('delete_entity', { entityName }) }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ContentActionBar>
        <template v-if="!createMode" #tabs>
          <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
        </template>
        <template v-if="!createMode" #changes>
          <ContentEditHasChanges :changes="hasUnsavedChanges" />
        </template>
      </ContentHeader>
    </template>
    <form @submit.prevent>
      <ContentEditMain :show-sidebar="showSidebar">
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 0"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard
              :create-mode="createMode"
              :step="1"
              :total-steps="totalCreateSteps"
              :current-step="currentStep"
              :step-valid="formValid"
              :title="$t('customers.company_details')"
              @next="saveCompanyDetails"
            >
              <FormGridWrap>
                <FormGrid design="1+1+1">
                  <FormField v-slot="{ componentField }" name="details.name">
                    <FormItem>
                      <FormLabel>{{
                        $t('entity_name', { entityName })
                      }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="details.vatNumber"
                  >
                    <FormItem>
                      <FormLabel>{{ $t('customers.vat_number') }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          :loading="vatValidating"
                        >
                          <template #icon>
                            <TooltipProvider
                              v-if="hasValidatedVat"
                              :delay-duration="100"
                            >
                              <Tooltip>
                                <TooltipTrigger>
                                  <LucideCircleCheck
                                    v-if="vatValid"
                                    class="text-positive size-5"
                                  />
                                  <LucideInfo
                                    v-else
                                    class="text-warning size-5"
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <i18n-t
                                    class="block max-w-[300px]"
                                    :keypath="
                                      vatValid
                                        ? 'customers.vat_veis_valid'
                                        : 'customers.vat_veis_invalid'
                                    "
                                    tag="span"
                                    scope="global"
                                  >
                                    <template #veis>
                                      <a
                                        class="underline underline-offset-2"
                                        href="https://ec.europa.eu/taxation_customs/vies/#/vat-validation"
                                        target="_blank"
                                        >{{ $t('customers.veis') }}</a
                                      >
                                    </template>
                                  </i18n-t>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </template>
                        </Input>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="details.externalId"
                  >
                    <FormItem>
                      <FormLabel :optional="true">{{
                        $t('customers.external_id')
                      }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1">
                  <FormField
                    v-slot="{ componentField }"
                    name="details.salesReps"
                  >
                    <FormItem>
                      <FormLabel :optional="true">{{
                        $t('sales_rep', 2)
                      }}</FormLabel>
                      <FormControl>
                        <FormInputTagsSearch
                          :model-value="componentField.modelValue"
                          entity-name="sales_rep"
                          :data-set="users"
                          @update:model-value="
                            componentField['onUpdate:modelValue']
                          "
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1">
                  <FormField
                    v-slot="{ componentField }"
                    name="details.channels"
                  >
                    <FormItem>
                      <FormLabel>{{ $t('channel', 2) }}</FormLabel>
                      <FormControl>
                        <FormInputChannels
                          :model-value="componentField.modelValue"
                          @update:model-value="
                            componentField['onUpdate:modelValue']
                          "
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid v-if="!createMode" design="1">
                  <FormField v-slot="{ componentField }" name="details.tags">
                    <FormItem>
                      <FormLabel :optional="true">{{
                        $t('customers.company_groups')
                      }}</FormLabel>
                      <FormControl>
                        <FormInputTagsSearch
                          :model-value="componentField.modelValue"
                          entity-name="company_group"
                          :data-set="companyTags"
                          :allow-custom-tags="true"
                          @update:model-value="
                            componentField['onUpdate:modelValue']
                          "
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
              </FormGridWrap>
            </ContentEditCard>
            <ContentEditCard
              :create-mode="createMode"
              :step="2"
              :total-steps="totalCreateSteps"
              :current-step="currentStep"
              :title="$t('customers.billing_shipping_addresses')"
              @previous="previousStep"
            >
              <Tabs default-value="billing">
                <TabsList>
                  <TabsTrigger value="billing">
                    {{ $t('billing_address') }}
                  </TabsTrigger>
                  <TabsTrigger value="shipping">
                    {{ $t('shipping_address') }}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="billing">
                  <div
                    class="mt-4 flex items-center justify-between border-t pt-4"
                  >
                    <ContentAddressDisplay :address="billingAddress" />
                    <ContentEditAddressPanel
                      :address="billingAddress"
                      @save="saveAddress"
                    >
                      <Button variant="outline" size="sm">{{
                        $t('edit')
                      }}</Button>
                    </ContentEditAddressPanel>
                  </div>
                </TabsContent>
                <TabsContent value="shipping">
                  <div
                    v-if="!hasShippingAddress"
                    v-auto-animate
                    class="mt-4 border-t pt-4"
                  >
                    <ContentSwitch
                      :checked="!addShippingAddress"
                      :label="$t('customers.same_as_billing')"
                      :description="$t('customers.use_billing_as_shipping')"
                      @update:checked="addShippingAddress = !$event"
                    />
                    <ContentEditAddressPanel
                      v-if="!hasShippingAddress && addShippingAddress"
                      :address="shippingAddress"
                      @save="saveAddress"
                      @delete="openAddressDeleteDialog"
                    >
                      <Button class="mt-4" variant="outline">
                        {{
                          $t('add_entity', { entityName: 'shipping_address' })
                        }}
                      </Button>
                    </ContentEditAddressPanel>
                  </div>
                  <div
                    v-else
                    class="mt-4 flex items-center justify-between border-t pt-4"
                  >
                    <ContentAddressDisplay :address="shippingAddress" />
                    <ContentEditAddressPanel
                      :address="shippingAddress"
                      @save="saveAddress"
                      @delete="openAddressDeleteDialog"
                    >
                      <Button variant="outline" size="sm">{{
                        $t('edit')
                      }}</Button>
                    </ContentEditAddressPanel>
                  </div>
                </TabsContent>
              </Tabs>

              <template #create>
                <ContentAddressForm
                  form-input-prefix="addresses"
                  address-type="billing"
                />
                <FormGridWrap>
                  <ContentCardHeader
                    size="md"
                    heading-level="h3"
                    :title="$t('shipping_address')"
                  />
                  <ContentSwitch
                    v-model:checked="addShippingAddress"
                    :label="$t('customers.add_different_shipping')"
                    :description="$t('customers.activate_different_shipping')"
                  >
                    <ContentAddressForm
                      form-input-prefix="addresses"
                      address-type="shipping"
                    />
                  </ContentSwitch>
                </FormGridWrap>
              </template>
            </ContentEditCard>
            <div v-if="createMode" class="flex flex-row justify-end gap-4">
              <Button variant="secondary" as-child>
                <NuxtLink :to="entityListUrl">
                  {{ $t('cancel') }}
                </NuxtLink>
              </Button>
              <Button
                :loading="loading"
                :disabled="createDisabled"
                @click="handleCreateCompany"
              >
                {{ $t('create_entity', { entityName }) }}
              </Button>
            </div>
          </ContentEditMainContent>
        </KeepAlive>
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard
              v-if="currentTab === 1"
              :create-mode="createMode"
              :title="$t('buyer', 2)"
              :description="$t('customers.buyers_description')"
            >
              <template #header-action>
                <CustomerBuyerPanel
                  v-model:open="buyerPanelOpen"
                  :mode="buyerPanelMode"
                  :buyer="buyerToEdit"
                  :company-id="entityDataUpdate?._id || ''"
                  :company-name="entityDataUpdate.name || ''"
                  :price-lists="allPriceLists"
                >
                  <ButtonIcon
                    v-if="!createMode"
                    icon="new"
                    variant="outline"
                    size="sm"
                  >
                    {{ $t('add_entity', { entityName: 'buyer' }) }}
                  </ButtonIcon>
                </CustomerBuyerPanel>
              </template>
              <div>
                <TableView
                  :mode="TableMode.Simple"
                  entity-name="buyer"
                  :columns="buyerColumns"
                  :data="buyersList"
                  :empty-icon="LucideUser"
                  :pinned-state="
                    viewport.isGreaterThan('xs') ? null : undefined
                  "
                />
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 2"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard
              :create-mode="createMode"
              :title="$t('price_list', 2)"
              :description="$t('customers.price_lists_description')"
            >
              <template #header-action>
                <SelectorQuickAdd
                  :entities="allPriceLists"
                  :selection="addedPriceListsIds"
                  entity-name="price_list"
                  :show-image="false"
                  class="sm:w-2/5!"
                  @add="addPriceList($event)"
                  @remove="removePriceList($event)"
                />
              </template>
              <div>
                <TableView
                  :mode="TableMode.Simple"
                  entity-name="price_list"
                  :columns="priceListColumns"
                  :data="addedPriceLists"
                  :init-visibility-state="visibilityState"
                  :pinned-state="
                    viewport.isGreaterThan('xs') ? null : undefined
                  "
                />
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 3"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard
              :create-mode="createMode"
              :title="$t('order', 2)"
              :description="$t('customers.orders_description')"
            >
              <div>
                <TableView
                  :mode="TableMode.Simple"
                  entity-name="order"
                  :columns="orderColumns"
                  :data="ordersList"
                  :page-size="20"
                  :pinned-state="null"
                  :empty-icon="LucidePackage"
                />
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 4"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard :create-mode="false" :title="$t('settings')">
              <div class="space-y-4">
                <ContentCardHeader
                  :title="$t('customers.product_access')"
                  :description="$t('customers.product_access_description')"
                  size="md"
                />
                <ContentSwitch
                  v-model:checked="entityDataUpdate.limitedProductAccess"
                  :label="$t('customers.product_access_restrict_label')"
                  :description="
                    $t('customers.product_access_restrict_description')
                  "
                />
                <ContentCardHeader
                  :title="$t('customers.vat_settings')"
                  :description="$t('customers.vat_settings_description')"
                  size="md"
                />
                <ContentSwitch
                  v-model:checked="entityDataUpdate.exVat"
                  :label="$t('customers.vat_included_label')"
                  :description="$t('customers.vat_included_description')"
                />
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>
        <template #sidebar>
          <ContentEditSummary
            v-model:active="entityDataUpdate.active"
            v-bind="summaryProps"
          >
            <template v-if="vatNumberValidated" #after-summary>
              <ul v-auto-animate class="-mt-1 space-y-3 text-sm">
                <li
                  class="text-muted-foreground flex items-center justify-between gap-2 text-right"
                >
                  <span class="text-foreground text-left font-bold">
                    {{ $t('customers.vat_number') }}:
                  </span>
                  <ContentTextTooltip
                    :trigger-class="
                      cn(
                        vatValid ? 'decoration-positive' : 'decoration-warning',
                        'decoration-2',
                      )
                    "
                  >
                    {{ entityData.vatNumber }}
                    <template #tooltip>
                      <p :class="cn('p-2', vatValid ? 'pb-0' : '')">
                        <i18n-t
                          class="block max-w-[300px]"
                          :keypath="
                            vatValid
                              ? 'customers.vat_veis_valid'
                              : 'customers.vat_veis_invalid'
                          "
                          tag="span"
                          scope="global"
                        >
                          <template #veis>
                            <a
                              class="underline underline-offset-2"
                              href="https://ec.europa.eu/taxation_customs/vies/#/vat-validation"
                              target="_blank"
                              >{{ $t('customers.veis') }}</a
                            >
                          </template>
                        </i18n-t>
                      </p>
                      <ContentDataList
                        v-if="vatValid"
                        class="block max-w-[300px] pb-2"
                        :label="$t('customers.vat_validation_summary_label')"
                        :data-list="vatValidationSummary"
                      />
                    </template>
                  </ContentTextTooltip>
                </li>
              </ul>
              <ContentDataList
                v-if="!createMode && otherSummary.length"
                :data-list="otherSummary"
              />
            </template>
          </ContentEditSummary>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
