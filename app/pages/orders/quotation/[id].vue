<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import {
  DataItemDisplayType,
  SelectorMode,
  SelectorEntityType,
  TableMode,
} from '#shared/types';
import type {
  QuotationBase,
  Quotation,
  QuotationCreate,
  QuotationUpdate,
  QuotationAddress,
  QuotationApiOptions,
  QuotationItemCreate,
  QuotationProductRow,
  QuotationTotal,
  SelectorEntity,
  Address,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';
import type { ColumnDef, Row } from '@tanstack/vue-table';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const scope = 'pages/orders/quotation/[id].vue';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { toast } = useToast();
const { getEntityUrlFor } = useEntityUrl();
const { formatDate } = useDate();
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
const quotationTotal = ref<QuotationTotal | null>(null);
const hasExpirationDate = ref(false);
const selectedBillingAddressId = ref<string>('');
const selectedShippingAddressId = ref<string>('');
const billingAddress = ref<QuotationAddress | null>(null);
const shippingAddress = ref<QuotationAddress | null>(null);
const paymentTermsOptions = [
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Due on receipt',
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

// Quotation items data (quantity, custom price & response prices per SKU)
interface SkuItemData {
  quantity: number;
  customPrice: number | undefined;
  ordPrice: number;
  listPrice: number;
}

const skuItemData = ref<Map<string, SkuItemData>>(new Map());

const ensureSkuItemData = (skuId: string) => {
  if (!skuItemData.value.has(skuId)) {
    skuItemData.value.set(skuId, {
      quantity: 1,
      customPrice: undefined,
      ordPrice: 0,
      listPrice: 0,
    });
  }
  return skuItemData.value.get(skuId)!;
};

// Derived table rows merging selected SKUs with item data
const quotationProductRows = computed<QuotationProductRow[]>(() => {
  const currency = form.values.details?.currency || 'SEK';
  return selectedSkus.value.map((sku) => {
    const data = ensureSkuItemData(sku._id);
    return {
      _id: sku._id,
      product: sku.name,
      skuId: sku._id,
      quantity: data.quantity,
      price: {
        price: data.ordPrice ? String(data.ordPrice) : '',
        currency,
      },
      priceListPrice: {
        price: data.listPrice ? String(data.listPrice) : '',
        currency,
      },
      quotationPrice: {
        price:
          data.customPrice !== undefined
            ? String(data.customPrice)
            : data.listPrice
              ? String(data.listPrice)
              : '',
        currency,
      },
      image: sku.image || sku.thumbnail || '',
      articleNumber: sku.articleNumber || '',
    };
  });
});

// Build quotation items payload from skuItemData
const quotationItems = computed<QuotationItemCreate[]>(() =>
  selectedSkus.value.map((sku) => {
    const data = ensureSkuItemData(sku._id);
    return {
      skuId: sku._id,
      quantity: data.quantity,
      ...(data.customPrice !== undefined && data.customPrice !== data.listPrice
        ? { customPrice: data.customPrice }
        : {}),
    };
  }),
);

const handleQuantityChange = (
  value: string | number,
  row: Row<QuotationProductRow>,
) => {
  const id = row.original._id;
  const data = ensureSkuItemData(id);
  data.quantity = Math.max(1, Number(value) || 1);
  skuItemData.value = new Map(skuItemData.value);
};

const handleQuotationPriceChange = (
  value: string | number,
  row: Row<QuotationProductRow>,
) => {
  const id = row.original._id;
  const data = ensureSkuItemData(id);
  const num = Number(value);
  // Reset to undefined if value is empty, invalid, or matches the list price
  data.customPrice =
    value === '' || isNaN(num) || num === data.listPrice ? undefined : num;
  skuItemData.value = new Map(skuItemData.value);
};

const removeSkuFromSelection = (rowData: QuotationProductRow) => {
  const id = rowData._id;
  const updated = { ...skuSelection.value };
  if (updated.ids) {
    updated.ids = updated.ids.filter((skuId) => skuId !== id);
  }
  skuSelection.value = updated;
  skuItemData.value.delete(id);
  skuItemData.value = new Map(skuItemData.value);
};

// Columns for quotation products table
const { getColumns, addActionsColumn, orderAndFilterColumns } =
  useColumns<QuotationProductRow>();

const selectedSkuColumns = computed<ColumnDef<QuotationProductRow>[]>(() => {
  if (quotationProductRows.value.length === 0) return [];

  const columns = getColumns(quotationProductRows.value, {
    sortable: false,
    includeColumns: [
      'product',
      'skuId',
      'quantity',
      'price',
      'priceListPrice',
      'quotationPrice',
    ],
    columnTitles: {
      product: t('product'),
      skuId: t('orders.sku_id'),
      quantity: t('quantity'),
      price: t('orders.base_price'),
      priceListPrice: t('orders.price_list_price'),
      quotationPrice: t('orders.quotation_price'),
    },
    columnTypes: {
      product: 'product',
      skuId: 'default',
      quantity: 'editable-number',
      price: 'currency',
      priceListPrice: 'currency',
      quotationPrice: 'editable-currency',
    },
    columnCellProps: {
      quantity: {
        onBlur: handleQuantityChange,
        placeholder: '1',
      },
      quotationPrice: {
        onBlur: handleQuotationPriceChange,
        placeholder: '0',
      },
    },
  });

  addActionsColumn(
    columns,
    {
      onDelete: (rowData: QuotationProductRow) =>
        removeSkuFromSelection(rowData),
    },
    'delete',
  );

  return orderAndFilterColumns(columns, [
    'product',
    'skuId',
    'quantity',
    'price',
    'priceListPrice',
    'quotationPrice',
    'actions',
  ]);
});

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
  setOriginalSavedData,
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
    terms: entityData.terms?.text,
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
      paymentTerms: 'Net 30',
    },
  }),
  parseEntityData: (quotation: Quotation) => {
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
    entityLiveStatus.value =
      quotation.status === 'pending' || quotation.status === 'accepted';
    quotationTotal.value = quotation.total || null;

    // Set company info (selectedCompany is already fetched in onMounted for edit mode)
    const companyId = quotation.company?.companyId?.toString() || '';
    selectedCompanyId.value = companyId;
    selectedAccountName.value = quotation.company?.name || '';

    // Resolve owner and buyer IDs directly from API response
    const ownerId = quotation.owner?.ownerId || '';
    const buyerId = quotation.customer?.customerId || '';

    // Set address data from API response
    selectedBillingAddressId.value = quotation.billingAddress?.addressId || '';
    selectedShippingAddressId.value =
      quotation.shippingAddress?.addressId || '';
    billingAddress.value = quotation.billingAddress || null;
    shippingAddress.value = quotation.shippingAddress || null;

    // Resolve payment terms from validPaymentMethods
    const paymentTerms = quotation.terms?.text || 'Net 30';

    // Set expiration date toggle
    hasExpirationDate.value = !!quotation.validTo;

    // Initialize SKU item data from existing quotation items (includes prices)
    if (quotation.items?.length) {
      const newItemData = new Map<string, SkuItemData>();
      quotation.items.forEach((item) => {
        const skuId = item.sku || item._id;
        newItemData.set(skuId, {
          quantity: item.quantity || 1,
          customPrice:
            item.unitPrice !== item.ordPrice ? item.unitPrice : undefined,
          ordPrice: item.ordPrice || 0,
          listPrice: item.listPrice || 0,
        });
      });
      skuItemData.value = newItemData;
    }

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
      terms: formData.details.paymentTerms || undefined,
      items: quotationItems.value.length > 0 ? quotationItems.value : undefined,
    };
  },
  prepareUpdateData: (formData, _entity) => ({
    name: formData.details.name,
    validTo: formData.details.expirationDate || undefined,
    ownerId: formData.details.createdBy || undefined,
    customerId: formData.details.buyerId || undefined,
    billingAddressId: selectedBillingAddressId.value || undefined,
    shippingAddressId: selectedShippingAddressId.value || undefined,
    terms: formData.details.paymentTerms || undefined,
    items: quotationItems.value,
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
        items:
          quotationItems.value.length > 0 ? quotationItems.value : undefined,
      };
    } else {
      entityDataUpdate.value = {
        ...entityData.value,
        name: values.details.name,
        validTo: values.details.expirationDate || undefined,
        ownerId: values.details.createdBy || undefined,
        customerId: values.details.buyerId || undefined,
        billingAddressId: selectedBillingAddressId.value || undefined,
        shippingAddressId: selectedShippingAddressId.value || undefined,
        items: quotationItems.value,
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
    const response = await productApi.list({
      fields: ['media', 'skus'],
    });

    productsWithSkus.value = transformProductsToSelectorEntities(
      response?.items || [],
    );

    // Initialize SKU selection from existing quotation item data
    if (skuItemData.value.size > 0) {
      const existingSkuIds = Array.from(skuItemData.value.keys());
      skuSelection.value = {
        ...getFallbackSelection(),
        ids: existingSkuIds,
      };
    }
  } catch (error) {
    geinsLogError('Failed to fetch products:', error);
  } finally {
    loadingProducts.value = false;
  }
};

// Watch for company selection changes (create mode only)
watch(
  () => form.values.details?.accountId,
  async (newCompanyId) => {
    if (!createMode.value) return;
    if (newCompanyId) {
      selectedCompanyId.value = newCompanyId;
      const company = companies.value.find((c) => c._id === newCompanyId);
      selectedCompany.value = company;
      selectedAccountName.value = company?.name || '';

      // Clear sales rep and buyer when company changes
      form.setFieldValue('details.createdBy', '', false);
      form.setFieldValue('details.buyerId', '', false);

      // Set currency to first available from company's channels
      if (availableCurrencies.value.length > 0) {
        form.setFieldValue(
          'details.currency',
          availableCurrencies.value[0]?._id,
        );
      }

      // Re-fetch products filtered for this company's channel
      await nextTick();
      fetchProducts();
    } else {
      selectedCompany.value = undefined;
      selectedAccountName.value = '';
      buyers.value = [];
      productsWithSkus.value = [];
    }
  },
);

// Sync expiration date toggle with form value
watch(hasExpirationDate, (enabled) => {
  if (!enabled) {
    form.setFieldValue('details.expirationDate', '');
  }
});

// Sync item changes with entityDataUpdate for unsaved changes detection
watch(
  [quotationItems, simpleSkuSelection],
  () => {
    if (createMode.value || !entityDataUpdate.value) return;
    entityDataUpdate.value = {
      ...entityDataUpdate.value,
      items: quotationItems.value,
    };
  },
  { deep: true },
);

// =====================================================================================
// CUSTOMER PANEL HANDLER
// =====================================================================================

const toQuotationAddress = (address: Address): QuotationAddress => ({
  addressId: address._id,
  email: address.email,
  phone: address.phone,
  company: address.company,
  firstName: address.firstName,
  lastName: address.lastName,
  careOf: address.careOf,
  addressLine1: address.addressLine1,
  addressLine2: address.addressLine2,
  addressLine3: address.addressLine3,
  zip: address.zip,
  city: address.city,
  region: address.region,
  country: address.country,
});

const handleCustomerPanelSave = (data: {
  ownerId: string;
  buyerId: string;
  billingAddressId: string;
  shippingAddressId: string;
}) => {
  // Update form values for owner and buyer
  form.setFieldValue('details.createdBy', data.ownerId);
  form.setFieldValue('details.buyerId', data.buyerId);

  // Store address IDs for update payload
  selectedBillingAddressId.value = data.billingAddressId;
  selectedShippingAddressId.value = data.shippingAddressId;

  // Update address display refs so the Customer card reflects changes immediately
  const addresses = selectedCompany.value?.addresses;
  if (addresses) {
    const billing = addresses.find((a) => a._id === data.billingAddressId);
    const shipping = addresses.find((a) => a._id === data.shippingAddressId);
    if (billing) billingAddress.value = toQuotationAddress(billing);
    if (shipping) shippingAddress.value = toQuotationAddress(shipping);
  }
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
    // Fetch users (needed for sales rep display)
    await fetchUsers();

    // Validate entity data
    const quotation = handleFetchResult<Quotation>(error.value, data.value);

    // Fetch only the selected company (instead of all companies)
    const companyId = quotation.company?.companyId?.toString() || '';
    if (companyId) {
      const company = await customerApi.company.get(companyId, {
        fields: ['buyers', 'salesreps', 'addresses', 'pricelists'],
      });
      selectedCompany.value = company;
    }

    await parseAndSaveData(quotation, false);

    // Fetch products for SKU selector (must await so skuSelection is
    // populated before we take the unsaved-changes baseline snapshot)
    await fetchProducts();

    // Set the saved data snapshot after all async data has settled,
    // so the unsaved changes baseline matches the fully populated form
    await nextTick();
    setOriginalSavedData();
  });
} else {
  // Create mode: fetch all companies and users
  onMounted(async () => {
    await Promise.all([fetchCompanies(), fetchUsers()]);
  });
}

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
const companySummary = computed(() => {
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
    ...(selectedAccountName.value
      ? [{ label: t('company'), value: selectedAccountName.value }]
      : []),
    ...(!createMode.value && selectedCompany.value?.vatNumber
      ? [
          {
            label: t('customers.vat_number'),
            value: selectedCompany.value.vatNumber,
          },
        ]
      : []),
    ...(ownerName ? [{ label: t('owner'), value: ownerName }] : []),
    ...(buyerName ? [{ label: t('buyer'), value: buyerName }] : []),
    ...(formValues?.currency
      ? [{ label: t('currency'), value: formValues.currency }]
      : []),
  ];
});

const priceListSummary = computed<DataItem[]>(() => {
  return [];
});

// Computed properties for summary
const summary = computed(() => {
  if (!entityData.value) return [];

  const formValues = form.values.details;
  return [
    ...(formValues?.name ? [{ label: t('name'), value: formValues.name }] : []),
    ...(createMode.value && companySummary.value.length
      ? companySummary.value
      : []),
    ...(formValues?.quotationNumber
      ? [{ label: t('ref_number'), value: formValues.quotationNumber }]
      : []),
    ...(formValues?.expirationDate
      ? [
          {
            label: t('expiration_date'),
            value: formatDate(formValues.expirationDate),
          },
        ]
      : []),

    ...(!createMode.value && formValues?.paymentTerms
      ? [{ label: t('orders.payment_terms'), value: formValues.paymentTerms }]
      : []),
  ];
});

const productsSummary = computed(() => {
  const priceLists = selectedCompany.value?.priceLists;
  if (!priceLists?.length) return [];
  const displayValue = priceLists.map((pl) => pl.name).join(', ');
  if (quotationProductRows.value.length === 0) return [];
  return [
    ...(!createMode.value && selectedSkus.value.length > 0
      ? [
          {
            label: t('product', selectedSkus.value.length),
            value: t(
              'nr_of_entity',
              { entityName: 'product', count: selectedSkus.value.length },
              selectedSkus.value.length,
            ),
          },
        ]
      : []),
    {
      label: t('orders.price_lists_applied'),
      value: priceLists.map((pl) => pl._id),
      displayValue,
      entityName: 'price_list',
      displayType: DataItemDisplayType.Array,
    },
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
                    :current-billing-address-id="selectedBillingAddressId"
                    :current-shipping-address-id="selectedShippingAddressId"
                    @save="handleCustomerPanelSave"
                  >
                    <Button variant="outline" size="sm">
                      {{ $t('change') }}
                    </Button>
                  </ContentEditCustomerPanel>
                </template>

                <div class="space-y-4">
                  <!-- Company info -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('company') }}
                      </p>
                      <p class="text-sm">
                        {{ selectedCompany?.name || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('customers.vat_number') }}
                      </p>
                      <p class="text-sm">
                        {{ selectedCompany?.vatNumber || '-' }}
                      </p>
                    </div>
                  </div>

                  <!-- Addresses -->
                  <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('billing_address') }}
                      </p>
                      <ContentAddressDisplay
                        v-if="billingAddress"
                        :address="billingAddress"
                        address-only
                      />
                      <p v-else class="text-xs">-</p>
                    </div>

                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('shipping_address') }}
                      </p>
                      <ContentAddressDisplay
                        v-if="shippingAddress"
                        :address="shippingAddress"
                        address-only
                      />
                      <p v-else class="text-xs">-</p>
                    </div>
                  </div>

                  <!-- Owner & Buyer -->
                  <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('buyer') }}
                      </p>
                      <p class="text-sm">
                        {{ currentBuyerName || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('orders.quotation_owner') }}
                      </p>
                      <p class="text-sm">
                        {{ currentOwnerName || '-' }}
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
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                v-for="term in paymentTermsOptions"
                                :key="term"
                                :value="term"
                              >
                                {{ term }}
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
            <ContentEditCard :create-mode="false" :title="$t('product', 2)">
              <template #header-action>
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
                  <ButtonIcon icon="new" size="sm">
                    {{ $t('add_entity', { entityName: 'product' }, 2) }}
                  </ButtonIcon>
                </SelectorPanel>
              </template>
              <template v-if="!loadingProducts">
                <div
                  v-if="selectedCompany?.priceLists?.length"
                  class="mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5"
                >
                  <span class="text-muted-foreground text-xs font-medium">
                    {{ $t('orders.price_lists_applied') }}:
                  </span>
                  <NuxtLink
                    v-for="pl in selectedCompany.priceLists"
                    :key="pl._id"
                    :to="getEntityUrlFor('price-list', 'pricing', pl._id)"
                  >
                    <Badge
                      variant="outline"
                      class="hover:bg-primary/10 cursor-pointer"
                    >
                      {{ pl.name }}
                    </Badge>
                  </NuxtLink>
                </div>
                <TableView
                  :columns="selectedSkuColumns"
                  :data="quotationProductRows"
                  entity-name="product"
                  :mode="TableMode.Minimal"
                  :page-size="10"
                />
                <ContentPriceSummary
                  class="mx-3"
                  v-if="!createMode && quotationTotal"
                  :total="quotationTotal"
                  :currency="form.values.details?.currency || ''"
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
          <ContentEditSummary v-bind="summaryProps">
            <template #after-summary>
              <ContentDataList
                v-if="!createMode && companySummary.length"
                :data-list="companySummary"
                :label="$t('customer')"
              />
              <ContentDataList
                v-if="!createMode && priceListSummary.length"
                :data-list="priceListSummary"
                :label="$t('price_list', 2)"
              />
              <ContentDataList
                v-if="!createMode && productsSummary.length"
                :data-list="productsSummary"
                :label="$t('product', 2)"
              />
              <Separator class="my-5" />
              <ContentPriceSummary
                v-if="!createMode && quotationTotal"
                :total="quotationTotal"
                :currency="form.values.details?.currency || ''"
              />
            </template>
          </ContentEditSummary>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
