<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { useToast } from '@/components/ui/toast/use-toast';
import { toTypedSchema } from '@vee-validate/zod';
import { useWholesale } from '@/composables/useWholesale';
import { DataItemDisplayType, TableMode } from '#shared/types';
import * as z from 'zod';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const {
  wholesaleApi,
  hasValidatedVat,
  vatValid,
  vatValidating,
  vatNumberValidated,
  vatValidationSummary,
  extractAccountGroupsfromTags,
  convertAccountGroupsToTags,
  validateVatNumber,
  getAddresses,
} = useWholesale();
const { t } = useI18n();
const route = useRoute();
const { geinsLogError } = useGeinsLog('pages/wholesale/account/[id].vue');
const accountStore = useAccountStore();
const { getEntityNameById } = useEntity();
const { toast } = useToast();

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
const entityBase: WholesaleAccountCreate = {
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
const currentTab = ref(0);
const tabs = [
  t('general'),
  t('wholesale.buyers'),
  t('wholesale.pricelists'),
  t('settings'),
];
const showSidebar = computed(() => {
  return currentTab.value === 0;
});

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

// Account data
const accountGroups = ref<string[]>([]);
const accountTags = ref<EntityBaseWithName[]>([]);

// Form validation
const createDisabled = ref(true);

// =====================================================================================
// ENTITY EDIT COMPOSABLE
// =====================================================================================
const {
  entityName,
  createMode,
  loading,
  newEntityUrl,
  entityListUrl,
  entityDataCreate,
  entityDataUpdate,
  entityData,
  entityPageTitle,
  entityLiveStatus,
  refreshEntityData,
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
  WholesaleAccountBase,
  WholesaleAccount,
  WholesaleAccountCreate,
  WholesaleAccountUpdate
>({
  repository: wholesaleApi.account,
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
      tags: accountGroups.value,
    },
    addresses: {
      billing: billingAddress.value,
      shipping: shippingAddress.value,
    },
  }),
  parseEntityData: async (account: WholesaleAccount) => {
    buyersList.value = account.buyers || [];
    entityLiveStatus.value = entityDataUpdate.value?.active || false;
    accountGroups.value = extractAccountGroupsfromTags(account.tags || []);

    billingAddress.value = {
      ...account.addresses?.find(
        (address) =>
          address.addressType === 'billing' ||
          address.addressType === 'billingandshipping',
      ),
    };
    const shipping = account.addresses?.find(
      (address) => address.addressType === 'shipping',
    );
    if (shipping) {
      shippingAddress.value = { ...shipping };
      addShippingAddress.value = true;
    }

    await validateVatNumber(account.vatNumber);

    form.setValues({
      details: {
        name: account.name || '',
        vatNumber: account.vatNumber || '',
        externalId: account.externalId || '',
        channels: account.channels || [],
        salesReps: account.salesReps?.map((rep) => rep._id || rep) || [],
        tags: accountGroups.value,
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
    const tags = convertAccountGroupsToTags(accountGroups.value);

    return {
      ...entityBase,
      ...formData.details,
      addresses,
      tags,
    };
  },
  prepareUpdateData: (formData, entity) => {
    const tags = convertAccountGroupsToTags(accountGroups.value);

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
    accountGroups.value = values.details.tags || [];
    const tags = convertAccountGroupsToTags(accountGroups.value);
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
const buyersList = ref<WholesaleBuyer[]>([]);
const buyerPanelOpen = ref(false);
const buyerToEdit = ref<WholesaleBuyer | undefined>();
const buyerPanelMode = ref<'edit' | 'add'>('add');
const columnOptions: ColumnOptions<WholesaleBuyer> = {
  columnTitles: { _id: t('person.email'), active: t('status') },
  excludeColumns: ['accountId'],
  sortable: false,
};
const { getColumns, addActionsColumn } = useColumns<WholesaleBuyer>();

// Use computed for reactive columns
const buyerColumns = computed(() => {
  if (buyersList.value.length === 0) return [];

  const columns = getColumns(buyersList.value, columnOptions);
  addActionsColumn(
    columns,
    {
      onEdit: (entity: WholesaleBuyer) => {
        buyerToEdit.value = entity;
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

const productApi = repo.product(useNuxtApp().$geinsApi);
const addedPricelists = ref<WholesalePricelist[]>([]);
const addedPricelistsIds = computed(() => {
  return addedPricelists.value.map((pl) => pl._id);
});
const allPricelists = ref<WholesalePricelist[]>([]);

const {
  getColumns: getPricelistColumns,
  addActionsColumn: addPricelistActionsColumn,
} = useColumns<WholesalePricelist>();

const columnOptionsPricelists: ColumnOptions<WholesalePricelist> = {
  entityLinkUrl: '/wholesale/pricelist/{_id}',
  columnTypes: {
    name: 'entity-link',
  },
  includeColumns: ['_id', 'name', 'currency', 'products', 'exVat', 'active'],
  sortable: false,
};

// Use computed for reactive columns
const pricelistColumns = computed(() => {
  if (addedPricelists.value.length === 0) return [];

  const columns = getPricelistColumns(
    addedPricelists.value,
    columnOptionsPricelists,
  );

  addPricelistActionsColumn(
    columns,
    {
      onDelete: (entity: WholesalePricelist) => {
        removePricelist(entity._id);
      },
    },
    'delete',
  );
  return columns;
});

// SET COLUMN VISIBILITY STATE
const { getVisibilityState } = useTable<WholesalePricelist>();
const hiddenColumns: StringKeyOf<WholesalePricelist>[] = ['_id'];
const visibilityState = getVisibilityState(hiddenColumns);

const addPricelist = async (id: string) => {
  const pricelist = allPricelists.value.find((pl) => pl._id === id);
  if (pricelist && !addedPricelistsIds.value.includes(pricelist._id)) {
    addedPricelists.value = [
      ...addedPricelists.value,
      {
        ...pricelist,
      },
    ];
  }
};

const removePricelist = (id: string) => {
  const index = addedPricelistsIds.value.indexOf(id);
  if (index !== -1) {
    addedPricelists.value = addedPricelists.value.filter((pl) => pl._id !== id);
  }
};

if (!createMode.value) {
  const { data, error } = await useAsyncData<ProductPricelist[]>(() =>
    productApi.pricelist.list({ fields: 'products' }),
  );

  if (!data.value || error.value) {
    geinsLogError(
      `${t('failed_to_fetch_entity', { entityName: 'pricelist' }, 2)}`,
      error.value,
    );
  } else {
    allPricelists.value = data.value.map((pricelist) => ({
      ...pricelist,
      products: pricelist.products.length,
    }));
  }
}

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
const saveAccountDetails = async () => {
  const stepValid = await validateSteps([1]);

  if (stepValid) {
    validateOnChange.value = false;
    form?.resetForm();
    form?.setValues({
      details: {
        ...entityDataCreate.value,
        tags: accountGroups.value,
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

const handleCreateAccount = async () => {
  await createEntity(async () => {
    const stepsValid = await validateSteps([1, 2]);
    if (!stepsValid) {
      validateOnChange.value = true;
      return false;
    }
    validateOnChange.value = false;
    return true;
  });
};

const handleUpdateAccount = async () => {
  await updateEntity(async () => {
    const stepsValid = await validateSteps([1]);
    if (!stepsValid) {
      validateOnChange.value = true;
      return false;
    }
    validateOnChange.value = false;
    return true;
  });
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
      label: t('wholesale.sales_reps'),
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
      label: t('wholesale.channels'),
      value: entityData.value.channels,
      displayValue,
      displayType: DataItemDisplayType.Array,
      entityName: 'channel',
    });
  }
  if (accountGroups.value.length) {
    const displayValue = accountGroups.value.join(', ');
    dataList.push({
      label: t('wholesale.account_groups'),
      value: accountGroups.value,
      displayValue,
      displayType: DataItemDisplayType.Array,
      entityName: 'account_group',
    });
  }
  return dataList;
});

const settingsSummary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  dataList.push({
    label: t('wholesale.vat'),
    value: entityData.value?.exVat
      ? t('wholesale.vat_true')
      : t('wholesale.vat_false'),
  });

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
  const { data, error, refresh } = await useAsyncData<WholesaleAccount>(() =>
    wholesaleApi.account.get(String(route.params.id)),
  );
  if (error.value) {
    toast({
      title: t(`error_fetching_entity`, { entityName }),
      description: t('feedback_error_description'),
      variant: 'negative',
    });
  }

  refreshEntityData.value = refresh;

  watch(
    data,
    async (newData) => {
      if (newData) {
        await parseAndSaveData(newData);
        await nextTick();
        // Columns are now computed and will update automatically
      }
    },
    { immediate: true },
  );

  const { data: tagsData, error: tagsError } = await useAsyncData<string[]>(
    () => wholesaleApi.account.tags.get(),
  );
  if (tagsError.value) {
    geinsLogError('error fetching tags:', tagsError.value);
  }

  if (tagsData.value) {
    const extractedTags = extractAccountGroupsfromTags(tagsData.value);
    accountTags.value = extractedTags.map((tag) => ({
      _id: tag,
      name: tag,
    }));
  }
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
            @click="handleUpdateAccount"
            >{{ $t('save_entity', { entityName }) }}</ButtonIcon
          >
          <DropdownMenu v-if="!createMode">
            <DropdownMenuTrigger as-child>
              <Button class="size-9 p-1" size="sm" variant="secondary">
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
              :title="$t('wholesale.account_details')"
              @next="saveAccountDetails"
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
                      <FormLabel>{{ $t('wholesale.vat_number') }}</FormLabel>
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
                                    class="size-5 text-positive"
                                  />
                                  <LucideInfo
                                    v-else
                                    class="size-5 text-warning"
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <i18n-t
                                    class="block max-w-[300px]"
                                    :keypath="
                                      vatValid
                                        ? 'wholesale.vat_veis_valid'
                                        : 'wholesale.vat_veis_invalid'
                                    "
                                    tag="span"
                                    scope="global"
                                  >
                                    <template #veis>
                                      <a
                                        class="underline underline-offset-2"
                                        href="https://ec.europa.eu/taxation_customs/vies/#/vat-validation"
                                        target="_blank"
                                        >{{ $t('wholesale.veis') }}</a
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
                        $t('wholesale.external_id')
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
                        $t('wholesale.sales_reps')
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
                      <FormLabel>{{ $t('wholesale.channels') }}</FormLabel>
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
                        $t('wholesale.account_groups')
                      }}</FormLabel>
                      <FormControl>
                        <FormInputTagsSearch
                          :model-value="componentField.modelValue"
                          entity-name="account_group"
                          :data-set="accountTags"
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
              :title="$t('wholesale.billing_shipping_addresses')"
              @previous="previousStep"
            >
              <Tabs default-value="billing">
                <TabsList>
                  <TabsTrigger value="billing">
                    {{ $t('entity_caps', { entityName: 'billing_address' }) }}
                  </TabsTrigger>
                  <TabsTrigger value="shipping">
                    {{ $t('entity_caps', { entityName: 'shipping_address' }) }}
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
                      :label="$t('wholesale.same_as_billing')"
                      :description="$t('wholesale.use_billing_as_shipping')"
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
                    :title="
                      $t('entity_caps', {
                        entityName: 'shipping_address',
                      })
                    "
                  />
                  <ContentSwitch
                    v-model:checked="addShippingAddress"
                    :label="$t('wholesale.add_different_shipping')"
                    :description="$t('wholesale.activate_different_shipping')"
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
                @click="handleCreateAccount"
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
              :title="t('wholesale.buyers')"
              :description="$t('wholesale.buyers_description')"
            >
              <template #header-action>
                <WholesaleBuyerPanel
                  v-model:open="buyerPanelOpen"
                  :mode="buyerPanelMode"
                  :buyer="buyerToEdit"
                  :account-id="entityDataUpdate?._id || ''"
                  :account-name="entityDataUpdate.name || ''"
                >
                  <ButtonIcon
                    v-if="!createMode"
                    icon="new"
                    variant="outline"
                    size="sm"
                  >
                    {{ $t('add_entity', { entityName: 'buyer' }) }}
                  </ButtonIcon>
                </WholesaleBuyerPanel>
              </template>
              <div>
                <div
                  v-if="buyersList.length === 0"
                  class="flex flex-col items-center justify-center gap-2 rounded-lg border p-8 text-center"
                >
                  <p class="text-xl font-bold">
                    {{ $t('no_entity', { entityName: 'buyer' }, 2) }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ $t('wholesale.no_buyers_connected') }}
                  </p>
                </div>
                <TableView
                  v-else
                  :mode="TableMode.Simple"
                  entity-name="buyer"
                  :columns="buyerColumns"
                  :data="buyersList"
                  :pinned-state="null"
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
              :title="t('wholesale.pricelists')"
              description="Pricelists connected to this account"
            >
              <template #header-action>
                <SelectorQuickAdd
                  :entities="allPricelists"
                  :selection="addedPricelistsIds"
                  entity-name="pricelist"
                  :show-image="false"
                  class="w-2/5!"
                  @add="addPricelist($event)"
                  @remove="removePricelist($event)"
                />
              </template>
              <div>
                <div
                  v-if="addedPricelists.length === 0"
                  class="flex flex-col items-center justify-center gap-2 rounded-lg border p-8 text-center"
                >
                  <p class="text-xl font-bold">
                    {{ $t('no_entity', { entityName: 'pricelist' }, 2) }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ $t('wholesale.no_pricelists_connected') }}
                  </p>
                </div>
                <TableView
                  v-else
                  :mode="TableMode.Simple"
                  entity-name="pricelist"
                  :columns="pricelistColumns"
                  :data="addedPricelists"
                  :init-visibility-state="visibilityState"
                  :pinned-state="null"
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
            <ContentEditCard :create-mode="false" :title="t('settings')">
              <div class="space-y-4">
                <ContentCardHeader
                  title="VAT settings"
                  description="Set whether this account should be charged VAT on orders"
                  size="md"
                />
                <ContentSwitch
                  v-model:checked="entityDataUpdate.exVat"
                  label="VAT included"
                  description="Orders from this account will include VAT"
                />
                <ContentCardHeader title="Product access" size="md" />
                <ContentSwitch
                  v-model:checked="entityDataUpdate.limitedProductAccess"
                  label="Only access products included in the assigned pricelists"
                  description="Controls which products this account can view and purchase"
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
                  class="flex items-center justify-between gap-2 text-right text-muted-foreground"
                >
                  <span class="text-left font-bold text-foreground">
                    {{ t('wholesale.vat_number') }}:
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
                              ? 'wholesale.vat_veis_valid'
                              : 'wholesale.vat_veis_invalid'
                          "
                          tag="span"
                          scope="global"
                        >
                          <template #veis>
                            <a
                              class="underline underline-offset-2"
                              href="https://ec.europa.eu/taxation_customs/vies/#/vat-validation"
                              target="_blank"
                              >{{ $t('wholesale.veis') }}</a
                            >
                          </template>
                        </i18n-t>
                      </p>
                      <ContentDataList
                        v-if="vatValid"
                        class="block max-w-[300px] pb-2"
                        :label="t('wholesale.vat_validation_summary_label')"
                        :data-list="vatValidationSummary"
                      />
                    </template>
                  </ContentTextTooltip>
                </li>
              </ul>
            </template>
          </ContentEditSummary>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
