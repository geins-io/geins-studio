<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table';
import { useToast } from '@/components/ui/toast/use-toast';
import { useRoute } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useDebounceFn } from '@vueuse/core';
import { useWholesale } from '@/composables/useWholesale';
import {
  DataItemDisplayType,
  TableMode,
  type VatValidationResponse,
} from '#shared/types';
import * as z from 'zod';

// GLOBALS
const {
  wholesaleApi,
  deleteAccount,
  extractAccountGroupsfromTags,
  convertAccountGroupsToTags,
} = useWholesale();
const { t } = useI18n();
const route = useRoute();
const { newEntityUrlAlias, getEntityName, getNewEntityUrl, getEntityListUrl } =
  useEntity(route.fullPath);
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const entityListUrl = getEntityListUrl();
const { geinsLogError } = useGeinsLog('pages/wholesale/account/[id].vue');

const currentTab = ref(0);
const loading = ref(false);
const accountStore = useAccountStore();
const addShippingAddress = ref(false);
const originalAccountData = ref<string>('');
const liveStatus = ref(true);
const formValidation = ref();
const createDisabled = ref(true);

// EDIT PAGE OPTIONS
const tabs = [
  t('wholesale.account_details'),
  t('wholesale.buyers'),
  t('settings'),
];

// COMPUTED GLOBALS
const createMode = ref(route.params.id === newEntityUrlAlias);
const title = computed(() =>
  createMode.value
    ? t('new_entity', { entityName }) +
      (entityData.value?.name ? ': ' + entityData.value.name : '')
    : entityData.value?.name || t('edit_entity', { entityName }),
);

// STEPS SETUP
const currentStep = ref(1);
const totalSteps = ref(2);

// WHOLESALE ACCOUNT
const entityId = ref<string>(String(route.params.id));
const entityBase = {
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
};
const entityDataCreate = ref<WholesaleAccountCreate>({ ...entityBase });
const entityDataUpdate = ref<WholesaleAccountUpdate>({ ...entityBase });
const entityData = computed(() =>
  createMode.value ? entityDataCreate.value : entityDataUpdate.value,
);

/* Addresses */
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

const billingAddress = ref<AddressUpdate>({
  ...addressBase,
  addressType: 'billing',
});
const shippingAddress = ref<AddressUpdate>({
  ...addressBase,
  addressType: 'shipping',
});
const accountGroups = ref<string[]>([]);
const accountTags = ref<EntityBaseWithName[]>([]);

const getAddresses = (billing: AddressUpdate, shipping?: AddressUpdate) => {
  const addresses = [];
  const billingType = shipping ? 'billing' : 'billingandshipping';

  addresses.push({
    ...billing,
    addressType: billingType,
  });

  if (shipping) {
    addresses.push({
      ...shipping,
      addressType: 'shipping',
    });
  }
  return addresses;
};

const parseAndSaveData = async (account: WholesaleAccount): Promise<void> => {
  entityDataUpdate.value = {
    ...entityDataUpdate.value,
    ...account,
    salesReps: account.salesReps?.map((salesRep) => salesRep._id),
  };
  buyersList.value = account.buyers || [];
  liveStatus.value = entityDataUpdate.value.active || false;
  accountGroups.value = extractAccountGroupsfromTags(
    entityDataUpdate.value.tags || [],
  );
  originalAccountData.value = JSON.stringify(entityDataUpdate.value);

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
    shippingAddress.value = {
      ...shipping,
    };
  }
  addShippingAddress.value = !!shipping;
  await validateVatNumber(account.vatNumber);
};

const hasUnsavedChanges = computed(() => {
  if (createMode.value) return false;

  // Deep compare the current account data with the original data
  const currentData = JSON.stringify(entityDataUpdate.value);

  return currentData !== originalAccountData.value;
});

/* Sales reps data source */
const users = ref<User[]>([]);
const { useGeinsFetch } = useGeinsApi();

// Fetch users data asynchronously without blocking page render
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

// Start the fetch but don't await it directly in the setup
fetchUsers();

// FORMS SETTINGS
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

/* Account details */
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

const validateOnChange = ref(false);
const stepValidationMap: Record<number, string> = {
  1: 'details',
  2: addShippingAddress.value ? 'addresses' : 'billing',
};

const validateSteps = async (steps: number[]) => {
  formValidation.value = await form.validate();
  const errors = Object.keys(formValidation.value.errors);
  const stepKeys = steps.map((step) => stepValidationMap[step]);
  const stepErrors = errors.filter((error) =>
    stepKeys.some((stepKey) => stepKey && error.includes(stepKey)),
  );
  if (stepErrors.length > 0) {
    return false;
  }
  return true;
};

const saveAccountDetails = async () => {
  const stepValid = await validateSteps([1]);

  if (stepValid) {
    validateOnChange.value = false;
    form.resetForm();
    form.setValues({
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

    currentStep.value++;
    createDisabled.value = false;
  } else {
    validateOnChange.value = true;
  }
};

const previousStep = () => {
  currentStep.value--;
};

const getEntityNameById = (
  id: string,
  dataList: { _id?: string; name?: string }[],
) => {
  const entity = dataList?.find((entity) => entity._id === id);
  return entity ? entity.name : '';
};

// SUMMMARY
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
      label: t('wholesale.account_name'),
      value: entityData.value.name,
    });
  }
  if (entityData.value?.vatNumber) {
    dataList.push({
      label: t('wholesale.vat_number'),
      value: entityData.value.vatNumber,
    });
  }
  if (entityData.value?.salesReps?.length) {
    const displayValue = entityData.value.salesReps
      .map((id) => getEntityNameById(id, users.value))
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
      .map((id) => accountStore.getChannelNameById(id))
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

// CREATE ACCOUNT
const { toast } = useToast();
const createAccount = async () => {
  loading.value = true;

  try {
    const stepsValid = await validateSteps([1, 2]);

    if (!stepsValid) {
      validateOnChange.value = true;
      loading.value = false;
      return;
    }
    validateOnChange.value = false;

    const result = await wholesaleApi.account.create(entityDataCreate.value);
    const id = result._id;

    const newUrl = newEntityUrl.replace(newEntityUrlAlias, id);
    await useRouter().replace(newUrl);

    toast({
      title: t('entity_created', { entityName }),
      variant: 'positive',
    });
  } catch (error) {
    const _errorMessage = getErrorMessage(error);
    toast({
      title: t('error_creating_entity', { entityName }),
      description: t('feedback_error_description'),
      variant: 'negative',
    });

    return;
  } finally {
    loading.value = false;
  }
};

const hasShippingAddress = computed(() => {
  return entityData.value.addresses?.some(
    (address) => address.addressType === 'shipping',
  );
});

const saveAddress = async (address: AddressUpdate) => {
  const isNewShipping = !address._id && address.addressType === 'shipping';
  if (isNewShipping) {
    entityDataUpdate.value.addresses?.push(address);

    entityDataUpdate.value.addresses?.map((addr) => {
      if (addr.addressType === 'billingandshipping') {
        addr.addressType = 'billing';
      }
      return addr;
    });
  } else {
    const updatedAddresses = entityDataUpdate.value?.addresses?.map((addr) => {
      if (addr._id === address._id) {
        return { ...addr, ...address };
      }
      return addr;
    });
    entityDataUpdate.value.addresses = updatedAddresses;
  }
  if (address.addressType?.includes('billing')) {
    billingAddress.value = address;
  } else {
    shippingAddress.value = address;
    addShippingAddress.value = true;
  }
};

const updateAccount = async () => {
  loading.value = true;

  try {
    const stepsValid = await validateSteps([1]);

    if (!stepsValid) {
      validateOnChange.value = true;
      loading.value = false;
      return;
    }
    validateOnChange.value = false;
    const id = entityDataUpdate.value?._id || entityId.value;

    // Ensure we're using the update type
    const accountData = entityDataUpdate.value;
    const result: WholesaleAccount = await wholesaleApi.account.update(
      id,
      accountData,
    );

    await parseAndSaveData(result);

    toast({
      title: t('entity_updated', { entityName }),
      variant: 'positive',
    });
  } catch (error) {
    const _errorMessage = getErrorMessage(error);
    toast({
      title: t('error_updating_entity', { entityName }),
      description: t('feedback_error_description'),
      variant: 'negative',
    });

    return;
  } finally {
    loading.value = false;
  }
};

const deleteDialogOpen = ref(false);
const deleting = ref(false);
const openDeleteDialog = async () => {
  await nextTick();
  deleteDialogOpen.value = true;
};
const confirmDelete = async () => {
  deleting.value = true;
  const success = await deleteAccount(entityId.value, entityName);
  if (success) {
    navigateTo('/wholesale/account/list');
  }
  deleting.value = false;
  deleteDialogOpen.value = false;
};

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

let refreshData = async () => {};
const buyersList = ref<WholesaleBuyer[]>([]);
const buyerPanelOpen = ref(false);
const buyerToEdit = ref<WholesaleBuyer | undefined>();
const buyerPanelMode = ref<'edit' | 'add'>('add');
const columnOptions: ColumnOptions<WholesaleBuyer> = {
  columnTitles: { _id: t('person.email'), active: t('status') },
  excludeColumns: ['accountId'],
};
const buyerColumns: Ref<ColumnDef<WholesaleBuyer>[]> = ref([]);
const { getColumns, addActionsColumn } = useColumns<WholesaleBuyer>();
const setupColumns = () => {
  buyerColumns.value = getColumns(buyersList.value, columnOptions);
  addActionsColumn(
    buyerColumns.value,
    {
      onEdit: (entity: WholesaleBuyer) => {
        buyerToEdit.value = entity;
        buyerPanelOpen.value = true;
        buyerPanelMode.value = 'edit';
      },
    },
    'edit',
  );
};

watch(buyerPanelOpen, async (open) => {
  if (!open) {
    buyerToEdit.value = undefined;
    buyerPanelMode.value = 'add';
    await refreshData();
  }
});

// VAT VALIDATION
const hasValidatedVat = ref(false);
const vatValid = ref(false);
const vatValidating = ref(false);
const vatNumberValidated = ref('');
const vatValidation = ref<VatValidationResponse>();
const vatValidationSummary = ref<DataItem[]>([]);

const validateVatNumber = async (vatNumber: string) => {
  if (vatNumber === vatNumberValidated.value) {
    return;
  }
  vatValidating.value = true;
  try {
    vatValidation.value = await wholesaleApi.validateVatNumber(vatNumber);
    if (vatValidation.value) {
      vatValidationSummary.value = Object.keys(vatValidation.value)
        .filter((key) => {
          return key === 'name' || key === 'address';
        })
        .map((key) => ({
          label: t('wholesale.' + key),
          value:
            vatValidation.value?.[key as keyof VatValidationResponse] ?? '',
        }));
    }
    vatValid.value = vatValidation.value.valid;
  } catch (error) {
    geinsLogError('error validating VAT number:', error);
  } finally {
    hasValidatedVat.value = true;
    vatValidating.value = false;
    vatNumberValidated.value = vatNumber;
  }
};

// GET DATA IF NOT CREATE MODE
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<WholesaleAccount>(() =>
    wholesaleApi.account.get(entityId.value),
  );
  if (error.value) {
    geinsLogError('error fetching wholesale account:', error.value);
  }

  refreshData = refresh;

  watch(
    data,
    async (newData) => {
      if (newData) {
        await parseAndSaveData(newData);
        await nextTick();
        setupColumns();
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

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    details: {
      ...entityData.value,
      tags: accountGroups.value,
    },
    addresses: {
      billing: billingAddress.value,
      shipping: shippingAddress.value,
    },
  },
});

const formValid = computed(() => form.meta.value.valid);
const formTouched = computed(() => form.meta.value.touched);

watch(
  form.values,
  useDebounceFn(async (values) => {
    if (validateOnChange.value) {
      formValidation.value = await form.validate();
    }
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
  }, 500),
  { deep: true },
);

const unsavedChangesDialogOpen = ref(false);
const leavingTo = ref<string | null>(null);
const confirmedLeave = ref(false);
onBeforeRouteLeave((to) => {
  if (!confirmedLeave.value && hasUnsavedChanges.value) {
    unsavedChangesDialogOpen.value = true;
    leavingTo.value = to.fullPath;
    return false;
  }
  return true;
});
const confirmLeave = () => {
  unsavedChangesDialogOpen.value = false;
  confirmedLeave.value = true;

  if (leavingTo.value) {
    navigateTo(leavingTo.value);
  }
};
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
      <ContentHeader :title="title" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            @click="updateAccount"
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
      <KeepAlive>
        <ContentEditMain v-if="currentTab === 0">
          <ContentEditCard
            :create-mode="createMode"
            :step="1"
            :total-steps="totalSteps"
            :current-step="currentStep"
            :step-valid="formValid"
            :title="$t('wholesale.account_details')"
            @next="saveAccountDetails"
          >
            <FormGridWrap>
              <FormGrid design="1+1+1">
                <FormField v-slot="{ componentField }" name="details.name">
                  <FormItem v-auto-animate>
                    <FormLabel>{{ $t('wholesale.account_name') }}</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="details.vatNumber">
                  <FormItem v-auto-animate>
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
                  <FormItem v-auto-animate>
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
                <FormField v-slot="{ componentField }" name="details.salesReps">
                  <FormItem v-auto-animate>
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
                <FormField v-slot="{ componentField }" name="details.channels">
                  <FormItem v-auto-animate>
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
                  <FormItem v-auto-animate>
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
            :total-steps="totalSteps"
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
                      {{ $t('add_entity', { entityName: 'shipping_address' }) }}
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
              <FormGridWrap>
                <FormGrid design="2+1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.company"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.company_name') }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          autocomplete="billing organization"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="2+1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.addressLine1"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.addressLine1') }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          autocomplete="billing address-line1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.zip"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.zip') }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          autocomplete="billing postal-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.city"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.city') }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          autocomplete="billing address-level2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.addressLine2"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel :optional="true">{{
                        $t('address.addressLine2')
                      }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          autocomplete="billing address-line2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.country"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.country') }}</FormLabel>
                      <FormControl>
                        <FormInputCountrySelect
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
                <FormGrid design="1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.region"
                  >
                    <FormItem>
                      <FormLabel :optional="true">{{
                        $t('address.region')
                      }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          autocomplete="billing address-level1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
              </FormGridWrap>
              <FormGridWrap>
                <ContentCardHeader
                  size="md"
                  heading-level="h3"
                  :title="$t('contact_person')"
                  :description="$t('contact_person_description')"
                />
                <FormGrid design="1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.firstName"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('person.first_name') }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          autocomplete="billing given-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.lastName"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('person.last_name') }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          autocomplete="billing family-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.email"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('person.email') }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="email"
                          autocomplete="billing email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.phone"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel :optional="true">{{
                        $t('person.phone')
                      }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          autocomplete="billing tel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
              </FormGridWrap>
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
                  <FormGridWrap>
                    <FormGrid design="2+1+1">
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.company"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel>{{
                            $t('address.company_name')
                          }}</FormLabel>
                          <FormControl>
                            <Input
                              v-bind="componentField"
                              type="text"
                              autocomplete="shipping organization"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </FormGrid>
                    <FormGrid design="2+1+1">
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.addressLine1"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel>{{
                            $t('address.addressLine1')
                          }}</FormLabel>
                          <FormControl>
                            <Input
                              v-bind="componentField"
                              type="text"
                              autocomplete="shipping address-line1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.zip"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel>{{ $t('address.zip') }}</FormLabel>
                          <FormControl>
                            <Input
                              v-bind="componentField"
                              type="text"
                              autocomplete="shipping postal-code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.city"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel>{{ $t('address.city') }}</FormLabel>
                          <FormControl>
                            <Input
                              v-bind="componentField"
                              type="text"
                              autocomplete="shipping address-level2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </FormGrid>
                    <FormGrid design="1+1">
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.addressLine2"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel :optional="true">{{
                            $t('address.addressLine2')
                          }}</FormLabel>
                          <FormControl>
                            <Input
                              v-bind="componentField"
                              type="text"
                              autocomplete="shipping address-line2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.country"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel>{{ $t('address.country') }}</FormLabel>
                          <FormControl>
                            <FormInputCountrySelect
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
                    <FormGrid design="1+1">
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.region"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel :optional="true">{{
                            $t('address.region')
                          }}</FormLabel>
                          <FormControl>
                            <Input
                              v-bind="componentField"
                              type="text"
                              autocomplete="shipping address-level1"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </FormGrid>
                  </FormGridWrap>
                  <FormGridWrap>
                    <ContentCardHeader
                      size="md"
                      heading-level="h3"
                      :title="$t('contact_person')"
                      :description="$t('contact_person_description')"
                    />
                    <FormGridWrap>
                      <FormGrid design="1+1">
                        <FormField
                          v-slot="{ componentField }"
                          name="addresses.shipping.firstName"
                        >
                          <FormItem v-auto-animate>
                            <FormLabel>{{ $t('person.first_name') }}</FormLabel>
                            <FormControl>
                              <Input
                                v-bind="componentField"
                                type="text"
                                autocomplete="shipping given-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </FormField>
                        <FormField
                          v-slot="{ componentField }"
                          name="addresses.shipping.lastName"
                        >
                          <FormItem v-auto-animate>
                            <FormLabel>{{ $t('person.last_name') }}</FormLabel>
                            <FormControl>
                              <Input
                                v-bind="componentField"
                                type="text"
                                autocomplete="shipping family-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </FormField>
                      </FormGrid>
                      <FormGrid design="1+1">
                        <FormField
                          v-slot="{ componentField }"
                          name="addresses.shipping.email"
                        >
                          <FormItem v-auto-animate>
                            <FormLabel>{{ $t('person.email') }}</FormLabel>
                            <FormControl>
                              <Input
                                v-bind="componentField"
                                type="email"
                                autocomplete="shipping email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </FormField>
                        <FormField
                          v-slot="{ componentField }"
                          name="addresses.shipping.phone"
                        >
                          <FormItem v-auto-animate>
                            <FormLabel :optional="true">
                              {{ $t('person.phone') }}
                            </FormLabel>
                            <FormControl>
                              <Input
                                v-bind="componentField"
                                type="text"
                                autocomplete="shipping tel"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        </FormField>
                      </FormGrid>
                    </FormGridWrap>
                  </FormGridWrap>
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
              @click="createAccount"
            >
              {{ $t('create_entity', { entityName }) }}
            </Button>
          </div>
          <template #sidebar>
            <ContentEditSummary
              v-model:active="entityDataUpdate.active"
              :entity-name="entityName"
              :create-mode="createMode"
              :form-touched="formTouched"
              :live-status="liveStatus"
              :summary="summary"
              :settings-summary="settingsSummary"
            >
              <template v-if="vatNumberValidated" #after-summary>
                <Separator class="my-5" :label="t('wholesale.vat_number')" />
                <div class="rounded-lg border p-4">
                  <ul v-auto-animate class="space-y-3 text-sm">
                    <li
                      class="flex items-center justify-between gap-2 text-right text-muted-foreground"
                    >
                      <span class="text-left font-bold text-foreground"
                        >{{ t('number') }}:</span
                      >
                      <ContentTextTooltip
                        :trigger-class="
                          cn(
                            vatValid
                              ? 'decoration-positive'
                              : 'decoration-warning',
                            'decoration-2',
                          )
                        "
                      >
                        {{ entityData.vatNumber }}
                        <template #tooltip>
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
                        </template>
                      </ContentTextTooltip>
                    </li>
                  </ul>
                  <ContentDataList
                    v-if="vatValid"
                    :data-list="vatValidationSummary"
                  />
                </div>
              </template>
            </ContentEditSummary>
          </template>
        </ContentEditMain>
      </KeepAlive>
      <KeepAlive>
        <ContentEditMain v-if="currentTab === 1">
          <ContentEditCard
            v-if="currentTab === 1"
            :create-mode="createMode"
            :title="t('wholesale.buyers')"
            description="Buyers connected to this account"
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
              />
            </div>
          </ContentEditCard>
        </ContentEditMain>
      </KeepAlive>

      <KeepAlive>
        <ContentEditMain v-if="currentTab === 2">
          <ContentEditCard
            :create-mode="false"
            :title="t('settings')"
            description="Settings for this account"
          >
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
            </div>
          </ContentEditCard>
          <template #sidebar>
            <ContentEditSummary
              v-model:active="entityDataUpdate.active"
              :entity-name="entityName"
              :create-mode="createMode"
              :form-touched="formTouched"
              :live-status="liveStatus"
              :summary="summary"
              :settings-summary="settingsSummary"
            >
              <template v-if="vatNumberValidated" #after-summary>
                <Separator class="my-5" :label="t('wholesale.vat_number')" />
                <div class="rounded-lg border p-4">
                  <ul v-auto-animate class="space-y-3 text-sm">
                    <li
                      class="flex items-center justify-between gap-2 text-right text-muted-foreground"
                    >
                      <span class="text-left font-bold text-foreground"
                        >{{ t('number') }}:</span
                      >
                      <ContentTextTooltip
                        :trigger-class="
                          cn(
                            vatValid
                              ? 'decoration-positive'
                              : 'decoration-warning',
                            'decoration-2',
                          )
                        "
                      >
                        {{ entityData.vatNumber }}
                        <template #tooltip>
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
                        </template>
                      </ContentTextTooltip>
                    </li>
                  </ul>
                  <ContentDataList
                    v-if="vatValid"
                    :data-list="vatValidationSummary"
                  />
                </div>
              </template>
            </ContentEditSummary>
          </template>
        </ContentEditMain>
      </KeepAlive>
    </form>
  </ContentEditWrap>
</template>
