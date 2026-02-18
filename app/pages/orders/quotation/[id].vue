<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { SelectorMode, SelectorEntityType, TableMode } from '#shared/types';
import type {
  QuotationBase,
  Quotation,
  QuotationCreate,
  QuotationUpdate,
  QuotationApiOptions,
  QuotationAddressRequest,
  SelectorEntity,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const scope = 'pages/orders/quotation/[id].vue';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog(scope);
const accountStore = useAccountStore();
const breadcrumbsStore = useBreadcrumbsStore();

// =====================================================================================
// API & REPOSITORY SETUP
// =====================================================================================
const { orderApi, customerApi, globalApi, productApi } = useGeinsRepository();
const { currentCurrencies, channels } = storeToRefs(accountStore);
const currentChannels = computed(() => channels.value);
const {
  convertToSimpleSelection,
  getFallbackSelection,
  transformProductsToSelectorEntities,
} = useSelector();

// =====================================================================================
// FORM VALIDATION SCHEMA
// =====================================================================================
const formSchema = toTypedSchema(
  z.object({
    details: z.object({
      name: z.string().min(1, t('entity_required', { entityName: 'name' })),
      accountId: z
        .string()
        .min(1, t('entity_required', { entityName: 'company' })),
      createdBy: z
        .string()
        .min(1, t('entity_required', { entityName: 'owner' })),
      buyerId: z.string().optional(),
      currency: z
        .string()
        .min(1, t('entity_required', { entityName: 'currency' })),
      expirationDate: z.string().optional(),
      notes: z.string().optional(),
      paymentTerms: z.string().optional(),
    }),
  }),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
const entityBase: QuotationCreate = {
  channelId: '',
  marketId: '',
  name: '',
};

// =====================================================================================
// UI STATE MANAGEMENT
// =====================================================================================
// Tabs & Steps
const tabs = [t('general'), t('product', 2)];

const totalCreateSteps = 1;
const { currentStep, nextStep, previousStep } =
  useStepManagement(totalCreateSteps);

const stepValidationMap: Record<number, string> = {
  1: 'details',
};

// Company & User selection
const companies = ref<CustomerCompany[]>([]);
const users = ref<User[]>([]);
const buyers = ref<CompanyBuyer[]>([]);
const selectedCompanyId = ref<string>('');
const selectedAccountName = ref<string>('');
const selectedCompany = ref<CustomerCompany | undefined>();

// Edit mode state
const hasExpirationDate = ref(false);
const selectedBillingAddress = ref<QuotationAddressRequest | undefined>();
const selectedShippingAddress = ref<QuotationAddressRequest | undefined>();
const paymentTermsOptions = [
  { id: 'net15', label: 'Net 15' },
  { id: 'net30', label: 'Net 30' },
  { id: 'net45', label: 'Net 45' },
  { id: 'net60', label: 'Net 60' },
  { id: 'due_on_receipt', label: 'Due on receipt' },
];

// SKU selector state (Products tab)
const productsWithSkus = ref<SelectorEntity[]>([]);
const loadingProducts = ref(false);
const skuSelection = ref<SelectorSelectionInternal>(getFallbackSelection());

const updateSkuSelection = (updatedSelection: SelectorSelectionInternal) => {
  skuSelection.value = updatedSelection;
};

const simpleSkuSelection = computed(() =>
  convertToSimpleSelection(skuSelection.value),
);

const selectedSkus = computed(() => {
  const skus: SelectorEntity[] = [];
  productsWithSkus.value.forEach((product) => {
    if (Number(product.skus?.length) > 1) {
      product.skus?.forEach((sku) => {
        if (simpleSkuSelection.value.includes(sku._id)) {
          skus.push({ ...sku, name: `${product.name} (${sku.name})` });
        }
      });
    } else {
      if (simpleSkuSelection.value.includes(product._id)) {
        skus.push(product);
      }
    }
  });
  return skus;
});

const { getColumns } = useColumns<SelectorEntity>();
const selectedSkuColumns = computed(() => getColumns(selectedSkus.value));

// Filtered sales reps based on selected company
const availableSalesReps = computed(() => {
  if (!selectedCompany.value?.salesReps) return [];
  return users.value.filter((user) =>
    selectedCompany.value?.salesReps?.some((rep) => {
      const repId = typeof rep === 'string' ? rep : rep._id;
      return repId === user._id;
    }),
  );
});

const availableBuyers = computed(() => {
  return selectedCompany.value?.buyers || [];
});

// Resolved display names for current owner and buyer
const currentOwnerName = computed(() => {
  const ownerId = form.values.details?.createdBy;
  if (!ownerId) return '';
  return availableSalesReps.value.find((u) => u._id === ownerId)?.name || '';
});

const currentBuyerName = computed(() => {
  const buyerId = form.values.details?.buyerId;
  if (!buyerId) return '';
  const buyer = availableBuyers.value.find((b) => b._id === buyerId);
  return buyer ? `${buyer.firstName} ${buyer.lastName}` : '';
});

// Available currencies based on company's channels
const availableCurrencies = computed(() => {
  if (!selectedCompany.value?.channels) return [];

  const companyChannels = selectedCompany.value.channels;
  const channelCurrencies = new Set<string>();

  // Get all currencies from the company's channel markets
  companyChannels.forEach((channelId) => {
    const channel = currentChannels.value.find((ch) => ch._id === channelId);
    if (channel?.markets) {
      channel.markets.forEach((market) => {
        if (market.currency?._id) {
          channelCurrencies.add(market.currency._id);
        }
      });
    }
  });

  // If no currencies found, return all available currencies
  if (channelCurrencies.size === 0) return currentCurrencies.value;

  return currentCurrencies.value.filter((curr) =>
    channelCurrencies.has(curr._id),
  );
});

// Resolve channelId + marketId from selected company and currency
const resolveChannelMarket = (currency: string | undefined) => {
  if (!selectedCompany.value?.channels || !currency) return null;

  for (const chId of selectedCompany.value.channels) {
    const channel = currentChannels.value.find((ch) => ch._id === chId);
    if (!channel?.markets) continue;
    const market = channel.markets.find((m) => m.currency?._id === currency);
    if (market) return { channelId: channel._id, marketId: market._id };
  }
  return null;
};

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
  entityFetchKey,
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
  QuotationBase,
  Quotation,
  QuotationCreate,
  QuotationUpdate,
  QuotationApiOptions
>({
  repository: orderApi.quotation,
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: {} as QuotationUpdate,
  stepValidationMap,
  reshapeEntityData: (entityData) => ({
    ...entityData,
    items: undefined,
  }),
  getInitialFormValues: () => ({
    details: {
      name: '',
      accountId: '',
      createdBy: '',
      buyerId: '',
      currency: '',
      expirationDate: '',
      notes: '',
      paymentTerms: '',
    },
  }),
  parseEntityData: (quotation: Quotation) => {
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
    entityLiveStatus.value =
      quotation.status === 'pending' || quotation.status === 'accepted';

    // Set company first so watchers populate filtered lists
    const companyId = quotation.company?.companyId?.toString() || '';
    selectedCompanyId.value = companyId;
    selectedAccountName.value = quotation.company?.name || '';
    selectedCompany.value = companies.value.find((c) => c._id === companyId);

    // Resolve owner ID from name/email match
    const ownerId =
      users.value.find(
        (u) =>
          u.name === quotation.owner?.name ||
          u.email === quotation.owner?.email,
      )?._id || '';

    // Resolve buyer ID from name/email match
    const buyerBuyers = selectedCompany.value?.buyers || [];
    const buyerId =
      buyerBuyers.find(
        (b) =>
          `${b.firstName} ${b.lastName}` === quotation.customer?.name ||
          b.email === quotation.customer?.email,
      )?._id || '';

    // Resolve payment terms from validPaymentMethods
    const paymentTerms = quotation.validPaymentMethods?.[0]?.name || '';

    // Set expiration date toggle
    hasExpirationDate.value = !!quotation.validTo;

    // Fetch products for SKU selector if not already loaded
    if (productsWithSkus.value.length === 0) {
      fetchProducts();
    }

    form.setValues({
      details: {
        name: quotation.name || '',
        accountId: companyId,
        createdBy: ownerId,
        buyerId,
        currency: quotation.currency || 'SEK',
        expirationDate: quotation.validTo || '',
        notes: quotation.terms?.text || '',
        quotationNumber: quotation.quotationNumber || '',
        paymentTerms,
      },
    });
  },
  prepareCreateData: (formData) => {
    const cm = resolveChannelMarket(formData.details.currency);
    return {
      channelId: cm?.channelId || '',
      marketId: cm?.marketId || '',
      name: formData.details.name,
      companyId: formData.details.accountId || undefined,
      ownerId: formData.details.createdBy || undefined,
      customerId: formData.details.buyerId || undefined,
    };
  },
  prepareUpdateData: (formData, entity) => ({
    ...entity,
    name: formData.details.name,
    validTo: formData.details.expirationDate || undefined,
    ownerId: formData.details.createdBy || undefined,
    customerId: formData.details.buyerId || undefined,
    billingAddress: selectedBillingAddress.value,
    shippingAddress: selectedShippingAddress.value,
  }),
  onFormValuesChange: (values) => {
    if (createMode.value) {
      const cm = resolveChannelMarket(values.details.currency);
      entityDataCreate.value = {
        channelId: cm?.channelId || '',
        marketId: cm?.marketId || '',
        name: values.details.name,
        companyId: values.details.accountId || undefined,
        ownerId: values.details.createdBy || undefined,
        customerId: values.details.buyerId || undefined,
      };
    } else {
      entityDataUpdate.value = {
        ...entityData.value,
        name: values.details.name,
        validTo: values.details.expirationDate || undefined,
        ownerId: values.details.createdBy || undefined,
        customerId: values.details.buyerId || undefined,
        billingAddress: selectedBillingAddress.value,
        shippingAddress: selectedShippingAddress.value,
      };
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
// DELETE FUNCTIONALITY
// =====================================================================================
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, entityListUrl);

// =====================================================================================
// DATA FETCHING
// =====================================================================================
const { geinsFetch } = useGeinsApi();

// Fetch companies
const fetchCompanies = async () => {
  companies.value = await customerApi.company.list({
    fields: ['buyers', 'salesreps'],
  });
};

// Fetch users (sales reps)
const fetchUsers = async () => {
  const usersResult = await geinsFetch<User[]>('/user/list');
  if (usersResult) {
    users.value = usersResult.map((user) => ({
      ...user,
      name: user.firstName + ' ' + user.lastName,
    }));
  }
};

// Fetch products with SKUs for product selector
const fetchProducts = async () => {
  loadingProducts.value = true;
  try {
    const response = await productApi.list({ fields: ['media', 'skus'] });
    productsWithSkus.value = transformProductsToSelectorEntities(
      response?.items || [],
    );
  } catch (error) {
    geinsLogError('Failed to fetch products:', error);
  } finally {
    loadingProducts.value = false;
  }
};

// Watch for company selection changes
watch(
  () => form.values.details?.accountId,
  async (newCompanyId) => {
    if (newCompanyId) {
      selectedCompanyId.value = newCompanyId;
      const company = companies.value.find((c) => c._id === newCompanyId);
      selectedCompany.value = company;
      selectedAccountName.value = company?.name || '';

      // Clear sales rep and buyer when company changes
      if (createMode.value) {
        form.setFieldValue('details.createdBy', '', false);
        form.setFieldValue('details.buyerId', '', false);

        // Set currency to first available from company's channels
        if (availableCurrencies.value.length > 0) {
          form.setFieldValue(
            'details.currency',
            availableCurrencies.value[0]?._id,
          );
        }
      }
    } else {
      selectedCompany.value = undefined;
      selectedAccountName.value = '';
      buyers.value = [];
    }
  },
);

// Quotation response data for edit mode display
const quotationData = computed(() => {
  if (createMode.value) return null;
  return entityDataUpdate.value as unknown as Quotation;
});

// Sync expiration date toggle with form value
watch(hasExpirationDate, (enabled) => {
  if (!enabled) {
    form.setFieldValue('details.expirationDate', '');
  }
});

// =====================================================================================
// CUSTOMER PANEL HANDLER
// =====================================================================================

// Convert a company Address to QuotationAddressRequest format
const toQuotationAddress = (
  addr: Address | undefined,
): QuotationAddressRequest | undefined => {
  if (!addr) return undefined;
  return {
    name: [addr.firstName, addr.lastName].filter(Boolean).join(' '),
    address1: addr.addressLine1,
    address2: addr.addressLine2,
    city: addr.city,
    zip: addr.zip,
    country: addr.country,
  };
};

const handleCustomerPanelSave = (data: {
  ownerId: string;
  buyerId: string;
  billingAddressId: string;
  shippingAddressId: string;
}) => {
  // Update form values for owner and buyer
  form.setFieldValue('details.createdBy', data.ownerId);
  form.setFieldValue('details.buyerId', data.buyerId);

  // Find and store selected addresses
  const addresses = selectedCompany.value?.addresses || [];
  const billingAddr = addresses.find((a) => a._id === data.billingAddressId);
  const shippingAddr = addresses.find((a) => a._id === data.shippingAddressId);

  // Store resolved addresses for update payload
  selectedBillingAddress.value = toQuotationAddress(billingAddr);
  selectedShippingAddress.value = toQuotationAddress(shippingAddr);
};

// =====================================================================================
// DATA LOADING FOR EDIT MODE
// =====================================================================================
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<Quotation>(
    entityFetchKey.value,
    () => orderApi.quotation.get(entityId.value, { fields: ['all'] }),
  );

  refreshEntityData.value = refresh;

  onMounted(async () => {
    // Fetch dependent data first (companies/users needed for parseEntityData)
    await Promise.all([fetchCompanies(), fetchUsers()]);

    // Validate and parse entity data
    const quotation = handleFetchResult<Quotation>(error.value, data.value);
    await parseAndSaveData(quotation);

    // Fetch products for SKU selector
    fetchProducts();
  });
} else {
  // Create mode: just fetch companies and users
  onMounted(async () => {
    await Promise.all([fetchCompanies(), fetchUsers()]);
  });
}

// =====================================================================================
// SUMMARY DATA
// =====================================================================================

// Computed properties for summary
const summary = computed(() => {
  if (!entityData.value) return [];

  const formValues = form.values.details;
  const ownerName =
    availableSalesReps.value.find((u) => u._id === formValues?.createdBy)
      ?.name || formValues?.createdBy;
  const buyerObj = availableBuyers.value.find(
    (b) => b._id === formValues?.buyerId,
  );
  const buyerName = buyerObj
    ? `${buyerObj.firstName} ${buyerObj.lastName}`
    : '';
  return [
    ...(formValues?.name ? [{ label: t('name'), value: formValues.name }] : []),
    ...(selectedAccountName.value
      ? [{ label: t('company'), value: selectedAccountName.value }]
      : []),
    ...(ownerName ? [{ label: t('owner'), value: ownerName }] : []),
    ...(buyerName ? [{ label: t('buyer'), value: buyerName }] : []),
    ...(formValues?.currency
      ? [{ label: t('currency'), value: formValues.currency }]
      : []),
  ];
});

const settingsSummary = ref<DataItem[]>([]);

const { summaryProps } = useEntityEditSummary({
  createMode,
  formTouched,
  summary,
  settingsSummary,
  entityName,
  entityLiveStatus,
  showActiveStatus: false,
  status: entityData.value?.status || 'draft',
});

definePageMeta({
  layout: 'default',
});
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
  <ContentEditWrap
    :entity-name="entityName"
    :entity-id="entityId"
    :create-mode="createMode"
    :show-sidebar="showSidebar"
  >
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            :disabled="!hasUnsavedChanges || loading"
            @click="updateEntity"
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
      <ContentEditMain
        v-model:current-tab="currentTab"
        v-model:show-sidebar="showSidebar"
        :entity-name="entityName"
        :entity-id="entityId"
        :entity-page-title="entityPageTitle"
        :new-entity-url="newEntityUrl"
        :entity-list-url="entityListUrl"
        :entity-live-status="entityLiveStatus"
        :create-mode="createMode"
        :has-unsaved-changes="hasUnsavedChanges"
        :tabs="tabs"
        @validate-on-change="validateOnChange"
      >
        <!-- TAB 0: GENERAL -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 0"
            :key="`tab-${currentTab}`"
          >
            <!-- ========== CREATE MODE ========== -->
            <template v-if="createMode">
              <ContentEditCard
                :create-mode="createMode"
                :title="$t('entity_details', { entityName })"
                :description="$t('orders.quotation_create_description')"
              >
                <FormGridWrap>
                  <FormGrid design="1+1">
                    <FormField v-slot="{ componentField }" name="details.name">
                      <FormItem>
                        <FormLabel>{{
                          $t('entity_name', { entityName })
                        }}</FormLabel>
                        <FormControl>
                          <Input
                            v-bind="componentField"
                            :placeholder="$t('entity_name', { entityName })"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                  <FormGrid design="1">
                    <FormField
                      v-slot="{ componentField }"
                      name="details.accountId"
                    >
                      <FormItem>
                        <FormLabel>{{ $t('customer') }}</FormLabel>
                        <FormControl>
                          <Select v-bind="componentField">
                            <SelectTrigger>
                              <SelectValue
                                :placeholder="
                                  $t('select_entity', { entityName: 'company' })
                                "
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                v-for="company in companies"
                                :key="company._id"
                                :value="company._id"
                              >
                                {{ company.name }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          {{ $t('form.cannot_be_changed') }}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                  <FormGrid design="1+1+1">
                    <FormField
                      v-slot="{ componentField }"
                      name="details.createdBy"
                    >
                      <FormItem>
                        <FormLabel>{{
                          $t('orders.quotation_owner')
                        }}</FormLabel>
                        <FormControl>
                          <Select
                            v-bind="componentField"
                            :disabled="!selectedCompanyId"
                          >
                            <SelectTrigger>
                              <SelectValue
                                :placeholder="
                                  $t('select_entity', { entityName: 'owner' })
                                "
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                v-for="user in availableSalesReps"
                                :key="user._id"
                                :value="user._id"
                              >
                                {{ user.name }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>

                    <FormField
                      v-slot="{ componentField }"
                      name="details.buyerId"
                    >
                      <FormItem>
                        <FormLabel>{{ $t('buyer') }}</FormLabel>
                        <FormControl>
                          <Select
                            v-bind="componentField"
                            :disabled="
                              !selectedCompanyId || availableBuyers.length === 0
                            "
                          >
                            <SelectTrigger>
                              <SelectValue
                                :placeholder="
                                  $t('select_entity', { entityName: 'buyer' })
                                "
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                v-for="buyer in availableBuyers"
                                :key="buyer._id"
                                :value="buyer._id"
                              >
                                {{ buyer.firstName }} {{ buyer.lastName }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>

                    <FormField
                      v-slot="{ componentField }"
                      name="details.currency"
                    >
                      <FormItem>
                        <FormLabel>{{ $t('currency') }}</FormLabel>
                        <FormControl>
                          <Select
                            v-bind="componentField"
                            :disabled="!selectedCompanyId"
                          >
                            <SelectTrigger>
                              <SelectValue
                                :placeholder="
                                  $t('select_entity', {
                                    entityName: 'currency',
                                  })
                                "
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                v-for="currency in availableCurrencies"
                                :key="currency._id"
                                :value="currency._id"
                              >
                                {{ currency._id }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          {{ $t('form.cannot_be_changed') }}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                </FormGridWrap>
              </ContentEditCard>

              <div class="flex flex-row justify-end gap-4">
                <Button variant="secondary" as-child>
                  <NuxtLink :to="entityListUrl">
                    {{ $t('cancel') }}
                  </NuxtLink>
                </Button>
                <Button
                  :loading="loading"
                  :disabled="!formValid || loading"
                  @click="createEntity"
                >
                  {{ $t('create_entity', { entityName }) }}
                </Button>
              </div>
            </template>

            <!-- ========== EDIT MODE ========== -->
            <template v-else>
              <!-- Card 1: Quotation Details -->
              <ContentEditCard
                :create-mode="false"
                :title="$t('entity_details', { entityName })"
                :description="$t('orders.quotation_edit_description')"
              >
                <FormGridWrap>
                  <FormGrid design="1+1">
                    <FormField v-slot="{ componentField }" name="details.name">
                      <FormItem>
                        <FormLabel>{{
                          $t('entity_name', { entityName })
                        }}</FormLabel>
                        <FormControl>
                          <Input
                            v-bind="componentField"
                            :placeholder="$t('entity_name', { entityName })"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField
                      v-slot="{ componentField }"
                      name="details.expirationDate"
                    >
                      <FormItem>
                        <FormLabel>{{ $t('expiration_date') }}</FormLabel>
                        <FormControl>
                          <FormInputDate
                            v-bind="componentField"
                            :placeholder="$t('expiration_date')"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                  <FormGrid design="1">
                    <FormField
                      v-slot="{ componentField }"
                      name="details.quotationNumber"
                    >
                      <FormItem>
                        <FormLabel>{{ $t('ref_number') }}</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" />
                        </FormControl>
                      </FormItem>
                    </FormField>
                  </FormGrid>
                </FormGridWrap>
              </ContentEditCard>

              <!-- Card 2: Customer -->
              <ContentEditCard :create-mode="false" :title="$t('customer')">
                <template #header-action>
                  <ContentEditCustomerPanel
                    :company="selectedCompany"
                    :available-sales-reps="availableSalesReps"
                    :available-buyers="availableBuyers"
                    :current-owner-id="form.values.details?.createdBy || ''"
                    :current-buyer-id="form.values.details?.buyerId || ''"
                    :current-billing-address="
                      quotationData?.billingAddress || null
                    "
                    :current-shipping-address="
                      quotationData?.shippingAddress || null
                    "
                    @save="handleCustomerPanelSave"
                  >
                    <Button variant="outline" size="sm">
                      {{ $t('change') }}
                    </Button>
                  </ContentEditCustomerPanel>
                </template>

                <div class="space-y-4">
                  <!-- Company info -->
                  <div>
                    <ContentCardHeader
                      :title="$t('company')"
                      size="sm"
                      heading-level="h4"
                    />
                    <div class="text-muted-foreground mt-1 text-sm">
                      <p class="font-medium">
                        {{ quotationData?.company?.name || '-' }}
                      </p>
                      <p v-if="quotationData?.company?.orgNr">
                        {{ $t('org_nr') }}:
                        {{ quotationData.company.orgNr }}
                      </p>
                    </div>
                  </div>

                  <!-- Owner & Buyer -->
                  <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('orders.quotation_owner') }}
                      </p>
                      <p class="text-sm">
                        {{ currentOwnerName || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('buyer') }}
                      </p>
                      <p class="text-sm">
                        {{ currentBuyerName || '-' }}
                      </p>
                    </div>
                  </div>

                  <!-- Currency -->
                  <div class="border-t pt-4">
                    <p class="text-muted-foreground mb-1 text-xs font-medium">
                      {{ $t('currency') }}
                    </p>
                    <p class="text-sm">
                      {{ form.values.details?.currency || '-' }}
                    </p>
                  </div>

                  <!-- Addresses -->
                  <div
                    v-if="
                      quotationData?.billingAddress ||
                      quotationData?.shippingAddress
                    "
                    class="grid grid-cols-2 gap-4 border-t pt-4"
                  >
                    <div v-if="quotationData?.billingAddress">
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('billing_address') }}
                      </p>
                      <div class="text-xs">
                        <p v-if="quotationData.billingAddress.name">
                          {{ quotationData.billingAddress.name }}
                        </p>
                        <p v-if="quotationData.billingAddress.address1">
                          {{ quotationData.billingAddress.address1 }}
                        </p>
                        <p v-if="quotationData.billingAddress.address2">
                          {{ quotationData.billingAddress.address2 }}
                        </p>
                        <p
                          v-if="
                            quotationData.billingAddress.zip ||
                            quotationData.billingAddress.city
                          "
                        >
                          {{ quotationData.billingAddress.zip }}
                          {{ quotationData.billingAddress.city }}
                        </p>
                        <p v-if="quotationData.billingAddress.country">
                          {{ quotationData.billingAddress.country }}
                        </p>
                      </div>
                    </div>

                    <div v-if="quotationData?.shippingAddress">
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('shipping_address') }}
                      </p>
                      <div class="text-xs">
                        <p v-if="quotationData.shippingAddress.name">
                          {{ quotationData.shippingAddress.name }}
                        </p>
                        <p v-if="quotationData.shippingAddress.address1">
                          {{ quotationData.shippingAddress.address1 }}
                        </p>
                        <p v-if="quotationData.shippingAddress.address2">
                          {{ quotationData.shippingAddress.address2 }}
                        </p>
                        <p
                          v-if="
                            quotationData.shippingAddress.zip ||
                            quotationData.shippingAddress.city
                          "
                        >
                          {{ quotationData.shippingAddress.zip }}
                          {{ quotationData.shippingAddress.city }}
                        </p>
                        <p v-if="quotationData.shippingAddress.country">
                          {{ quotationData.shippingAddress.country }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </ContentEditCard>

              <!-- Card 3: Payment Settings -->
              <ContentEditCard
                :create-mode="false"
                :title="$t('orders.payment_settings')"
              >
                <FormGridWrap>
                  <FormGrid design="1+1">
                    <FormField
                      v-slot="{ componentField }"
                      name="details.paymentTerms"
                    >
                      <FormItem>
                        <FormLabel>{{ $t('orders.payment_terms') }}</FormLabel>
                        <FormControl>
                          <Select v-bind="componentField">
                            <SelectTrigger>
                              <SelectValue
                                :placeholder="
                                  $t('select_entity', {
                                    entityName: $t('orders.payment_terms'),
                                  })
                                "
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                v-for="term in paymentTermsOptions"
                                :key="term.id"
                                :value="term.id"
                              >
                                {{ term.label }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                </FormGridWrap>
              </ContentEditCard>
            </template>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- TAB 1: PRODUCTS -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1 && !createMode"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard :create-mode="false" :title="$t('item', 2)">
              <template v-if="!loadingProducts">
                <div class="bg-card mb-4 rounded-lg border p-4">
                  <p class="text-muted-foreground text-sm">
                    <strong>{{ $t('selected') }}:</strong>
                    {{
                      simpleSkuSelection.length > 0
                        ? `${simpleSkuSelection.length} SKU(s)`
                        : $t('none')
                    }}
                  </p>
                </div>

                <SelectorPanel
                  :selection="skuSelection"
                  :mode="SelectorMode.Simple"
                  entity-name="sku"
                  :entities="productsWithSkus"
                  :entity-type="SelectorEntityType.Sku"
                  :options="[
                    {
                      id: 'product',
                      group: 'ids',
                      label: $t('sku', 2),
                    },
                  ]"
                  @save="updateSkuSelection"
                >
                  <ButtonIcon icon="new" size="sm" class="mb-6">
                    {{ $t('add_entity', { entityName: 'sku' }) }}
                  </ButtonIcon>
                </SelectorPanel>

                <TableView
                  :columns="selectedSkuColumns"
                  :data="selectedSkus"
                  entity-name="sku"
                  :mode="TableMode.Simple"
                  :page-size="10"
                  :show-search="true"
                />
              </template>
              <template v-else>
                <div class="flex items-center justify-center py-8">
                  <LucideLoader2
                    class="text-muted-foreground size-6 animate-spin"
                  />
                </div>
              </template>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>

        <template #sidebar>
          <ContentEditSummary v-bind="summaryProps" />
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
