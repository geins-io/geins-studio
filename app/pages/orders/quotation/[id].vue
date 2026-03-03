<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { toTypedSchema } from '@vee-validate/zod';
import { useDebounceFn } from '@vueuse/core';
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
  QuotationDiscountRequest,
  QuotationMessage,
  QuotationMessageType,
  QuotationStatus,
  StatusTransitionRequest,
  SelectorEntity,
  Address,
  ProductApiOptions,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';
import type { ColumnDef, Row } from '@tanstack/vue-table';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const scope = 'pages/orders/quotation/[id].vue';
const { t } = useI18n();
const { toast } = useToast();
const { getEntityUrl, getEntityUrlFor } = useEntityUrl();
const { formatDate } = useDate();
const { geinsLogError } = useGeinsLog(scope);
const router = useRouter();
const accountStore = useAccountStore();
const breadcrumbsStore = useBreadcrumbsStore();
const userStore = useUserStore();

// =====================================================================================
// API & REPOSITORY SETUP
// =====================================================================================
const { orderApi, customerApi, productApi } = useGeinsRepository();
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
      ownerId: z.string().min(1, t('entity_required', { entityName: 'owner' })),
      buyerId: z.string().optional(),
      currency: z
        .string()
        .min(1, t('entity_required', { entityName: 'currency' })),
      expirationDate: z.string().optional(),
      paymentTerms: z.string().optional(),
      requireConfirmation: z.boolean().optional(),
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
// Sent mode — set from API response in parseEntityData
const sentMode = ref(false);
const communications = ref<QuotationMessage[]>([]);

// Discount & shipping (standalone refs, not form fields)
const discountType = ref<'percent' | 'fixedAmount'>('percent');
const discountValue = ref<string>('');
const shippingFeeInput = ref<string>('');

// Live preview state
const previewTotal = ref<QuotationPreviewTotal | null>(null);
const previewLoading = ref(false);

// Tabs & Steps
const tabs = computed(() =>
  sentMode.value
    ? [t('general'), t('communication', 2)]
    : [t('general'), t('product', 2)],
);

const stepValidationMap: Record<number, string> = {
  1: 'details',
};

// Company & User selection
const companies = ref<CustomerCompany[]>([]);
const buyers = ref<CompanyBuyer[]>([]);
const selectedCompanyId = ref<string>('');
const selectedAccountName = ref<string>('');
const selectedCompany = ref<CustomerCompany | undefined>();

// Edit mode state
const quotationTotal = ref<QuotationTotal | null>(null);

// Computed: prefer live preview total, fall back to saved total
const displayTotal = computed<QuotationTotal | QuotationPreviewTotal | null>(
  () => previewTotal.value ?? quotationTotal.value,
);

// Computed: build discount request from standalone refs
const discountRequest = computed<QuotationDiscountRequest | null>(() => {
  const val = Number(discountValue.value);
  if (!val || isNaN(val)) return null;
  return { type: discountType.value, value: val };
});

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
  unitPrice: number | undefined;
  ordPrice: number;
  listPrice: number;
}

const skuItemData = ref<Map<string, SkuItemData>>(new Map());

const defaultSkuItemData: SkuItemData = {
  quantity: 1,
  unitPrice: undefined,
  ordPrice: 0,
  listPrice: 0,
};

const getSkuItemData = (skuId: string): SkuItemData => {
  return skuItemData.value.get(skuId) || defaultSkuItemData;
};

const ensureSkuItemData = (skuId: string) => {
  if (!skuItemData.value.has(skuId)) {
    skuItemData.value.set(skuId, { ...defaultSkuItemData });
  }
  return skuItemData.value.get(skuId)!;
};

// Initialize item data for newly selected SKUs
watch(
  () => selectedSkus.value,
  (skus) => {
    let added = false;
    for (const sku of skus) {
      if (!skuItemData.value.has(sku._id)) {
        skuItemData.value.set(sku._id, { ...defaultSkuItemData });
        added = true;
      }
    }
    if (added) {
      skuItemData.value = new Map(skuItemData.value);
    }
  },
  { immediate: true },
);

// Derived table rows merging selected SKUs with item data
const quotationProductRows = computed<QuotationProductRow[]>(() => {
  const currency = form.values.details?.currency || 'SEK';
  return selectedSkus.value.map((sku) => {
    const data = getSkuItemData(sku._id);
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
          data.unitPrice !== undefined
            ? String(data.unitPrice)
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
    const data = getSkuItemData(sku._id);
    return {
      skuId: sku._id,
      quantity: data.quantity,
      ...(data.unitPrice !== undefined && data.unitPrice !== data.listPrice
        ? { unitPrice: data.unitPrice }
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
  debouncedCallPreview();
};

const handleQuotationPriceChange = (
  value: string | number,
  row: Row<QuotationProductRow>,
) => {
  const id = row.original._id;
  const data = ensureSkuItemData(id);
  const num = Number(value);
  // Reset to undefined if value is empty, invalid, or matches the list price
  data.unitPrice =
    value === '' || isNaN(num) || num === data.listPrice ? undefined : num;
  skuItemData.value = new Map(skuItemData.value);
  debouncedCallPreview();
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
  debouncedCallPreview();
};

// =====================================================================================
// LIVE PREVIEW
// =====================================================================================
const callPreview = async () => {
  if (createMode.value || sentMode.value || !entityId.value) return;
  if (quotationItems.value.length === 0) {
    previewTotal.value = null;
    return;
  }
  previewLoading.value = true;
  try {
    const response = await orderApi.quotation.preview(entityId.value, {
      suggestedShippingFee:
        shippingFeeInput.value !== ''
          ? Number(shippingFeeInput.value)
          : undefined,
      discount: discountRequest.value || undefined,
      items: quotationItems.value,
    });
    previewTotal.value = response.total;
    // Enrich skuItemData with calculated prices (ordPrice, listPrice).
    // Do NOT touch unitPrice — that is user-controlled.
    if (response.items?.length) {
      for (const item of response.items) {
        const skuId = item.sku || item._id;
        const data = skuItemData.value.get(skuId);
        if (data) {
          data.ordPrice = item.ordPrice || 0;
          data.listPrice = item.listPrice || 0;
        }
      }
      skuItemData.value = new Map(skuItemData.value);
    }
  } catch (error) {
    geinsLogError('Failed to fetch preview:', error);
  } finally {
    previewLoading.value = false;
  }
};
const debouncedCallPreview = useDebounceFn(callPreview, 500);

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

// Sales reps from selected company
const availableSalesReps = computed(() => {
  if (!selectedCompany.value?.salesReps) return [];
  return selectedCompany.value.salesReps;
});

const availableBuyers = computed(() => {
  return selectedCompany.value?.buyers || [];
});

// Resolved display names for current owner and buyer
const currentOwnerName = computed(() => {
  const ownerId = form.values.details?.ownerId;
  if (!ownerId) return '';
  const owner = availableSalesReps.value.find((u) => u._id === ownerId);
  return fullName(owner);
});

const currentBuyerName = computed(() => {
  const buyerId = form.values.details?.buyerId;
  if (!buyerId) return '';
  const buyer = availableBuyers.value.find((b) => b._id === buyerId);
  return fullName(buyer);
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
    validPaymentMethods: entityData.validPaymentMethods?.map((pm) => ({
      paymentId: String(pm.paymentId),
    })),
    validShippingMethods: entityData.validShippingMethods?.map((sm) => ({
      shippingId: String(sm.shippingId),
      shippingFee: sm.shippingFee,
    })),
  }),
  getInitialFormValues: () => ({
    details: {
      name: '',
      accountId: '',
      ownerId: '',
      buyerId: '',
      currency: '',
      expirationDate: '',
      paymentTerms: 'Net 30',
      requireConfirmation: false,
    },
  }),
  parseEntityData: (quotation: Quotation) => {
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
    entityLiveStatus.value =
      quotation.status === 'pending' || quotation.status === 'accepted';
    quotationTotal.value = quotation.total || null;
    previewTotal.value = null;

    // Sent mode: any non-draft status
    sentMode.value = quotation.status !== 'draft';
    communications.value = quotation.communication || [];

    // Discount & shipping fee from API response
    if (quotation.discount) {
      discountType.value = quotation.discount.type;
      discountValue.value = String(quotation.discount.value);
    } else {
      discountType.value = 'percent';
      discountValue.value = '';
    }
    shippingFeeInput.value = quotation.suggestedShippingFee
      ? String(quotation.suggestedShippingFee)
      : '';

    // Set company info (selectedCompany is already fetched in onMounted for edit mode)
    const companyId = quotation.company?._id || '';
    selectedCompanyId.value = companyId;
    selectedAccountName.value = quotation.company?.name || '';

    // Resolve owner and buyer IDs directly from API response
    const ownerId = quotation.owner?._id || '';
    const buyerId = quotation.customer?._id || '';

    // Set address data from API response
    selectedBillingAddressId.value = quotation.billingAddress?._id || '';
    selectedShippingAddressId.value = quotation.shippingAddress?._id || '';
    billingAddress.value = quotation.billingAddress || null;
    shippingAddress.value = quotation.shippingAddress || null;

    // Resolve payment terms from validPaymentMethods
    const paymentTerms = quotation.terms || 'Net 30';

    // Set expiration date toggle
    hasExpirationDate.value = !!quotation.validTo;

    // Initialize SKU item data from existing quotation items (includes prices)
    if (quotation.items?.length) {
      const newItemData = new Map<string, SkuItemData>();
      quotation.items.forEach((item) => {
        const skuId = item.sku || item._id;
        newItemData.set(skuId, {
          quantity: item.quantity || 1,
          unitPrice:
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
        ownerId,
        buyerId,
        currency: quotation.currency || 'SEK',
        expirationDate: quotation.validTo || '',
        paymentTerms,
        requireConfirmation: quotation.settings?.requireConfirmation ?? false,
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
      ownerId: formData.details.ownerId || undefined,
      customerId: formData.details.buyerId || undefined,
      terms: formData.details.paymentTerms || undefined,
      items: quotationItems.value.length > 0 ? quotationItems.value : undefined,
      discount: discountRequest.value || undefined,
      suggestedShippingFee:
        shippingFeeInput.value !== ''
          ? Number(shippingFeeInput.value)
          : undefined,
      settings: { requireConfirmation: formData.details.requireConfirmation },
    };
  },
  prepareUpdateData: (formData, _entity) => ({
    name: formData.details.name,
    validTo: formData.details.expirationDate || undefined,
    ownerId: formData.details.ownerId || undefined,
    customerId: formData.details.buyerId || undefined,
    billingAddressId: selectedBillingAddressId.value || undefined,
    shippingAddressId: selectedShippingAddressId.value || undefined,
    terms: formData.details.paymentTerms || undefined,
    items: quotationItems.value,
    discount: discountRequest.value || undefined,
    suggestedShippingFee:
      shippingFeeInput.value !== ''
        ? Number(shippingFeeInput.value)
        : undefined,
    settings: { requireConfirmation: formData.details.requireConfirmation },
  }),
  onFormValuesChange: (values) => {
    if (createMode.value) {
      const cm = resolveChannelMarket(values.details.currency);
      entityDataCreate.value = {
        channelId: cm?.channelId || '',
        marketId: cm?.marketId || '',
        name: values.details.name,
        companyId: values.details.accountId || undefined,
        ownerId: values.details.ownerId || undefined,
        customerId: values.details.buyerId || undefined,
        items:
          quotationItems.value.length > 0 ? quotationItems.value : undefined,
        settings: { requireConfirmation: values.details.requireConfirmation },
      };
    } else {
      // In sent mode, form fields are unmounted and VeeValidate clears their values.
      // Skip the update to preserve entityDataUpdate from reshapeEntityData.
      if (sentMode.value) return;
      entityDataUpdate.value = {
        ...entityData.value,
        name: values.details.name,
        validTo: values.details.expirationDate || undefined,
        ownerId: values.details.ownerId || undefined,
        customerId: values.details.buyerId || undefined,
        billingAddressId: selectedBillingAddressId.value || undefined,
        shippingAddressId: selectedShippingAddressId.value || undefined,
        terms: values.details.paymentTerms || undefined,
        items: quotationItems.value,
        discount: discountRequest.value || undefined,
        suggestedShippingFee:
          shippingFeeInput.value !== ''
            ? Number(shippingFeeInput.value)
            : undefined,
        settings: {
          requireConfirmation: values.details.requireConfirmation,
        },
      };
    }
  },
});

// =====================================================================================
// ERROR HANDLING SETUP
// =====================================================================================
const { handleFetchResult, showErrorToast } = usePageError({
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
// Fetch companies
const fetchCompanies = async () => {
  companies.value = await customerApi.company.list({
    fields: ['buyers', 'salesreps'],
  });
};

// Fetch products with SKUs for product selector
const fetchProducts = async () => {
  loadingProducts.value = true;
  try {
    const channelId = entityData.value?.channelId;
    const options: ProductApiOptions = { fields: ['media', 'skus'] };
    const response = channelId
      ? await productApi.query(
          { include: [{ selections: [{ channelIds: [channelId] }] }] },
          options,
        )
      : await productApi.list(options);

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
      form.setFieldValue('details.ownerId', '', false);
      form.setFieldValue('details.buyerId', '', false);

      // Set currency to first available from company's channels
      if (availableCurrencies.value.length > 0) {
        form.setFieldValue(
          'details.currency',
          availableCurrencies.value[0]?._id,
        );
      }
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

// Sync address changes with entityDataUpdate for unsaved changes detection
watch([selectedBillingAddressId, selectedShippingAddressId], () => {
  if (createMode.value || !entityDataUpdate.value) return;
  entityDataUpdate.value = {
    ...entityDataUpdate.value,
    billingAddressId: selectedBillingAddressId.value || undefined,
    shippingAddressId: selectedShippingAddressId.value || undefined,
  };
});

// Sync discount & shipping fee with entityDataUpdate for unsaved changes detection
watch([discountType, discountValue, shippingFeeInput], () => {
  if (createMode.value || !entityDataUpdate.value) return;
  entityDataUpdate.value = {
    ...entityDataUpdate.value,
    discount: discountRequest.value || undefined,
    suggestedShippingFee:
      shippingFeeInput.value !== ''
        ? Number(shippingFeeInput.value)
        : undefined,
  };
});

// Trigger preview when SKU selection changes
watch(simpleSkuSelection, () => {
  if (!createMode.value && !sentMode.value) {
    debouncedCallPreview();
  }
});

// =====================================================================================
// CUSTOMER PANEL HANDLER
// =====================================================================================

const toQuotationAddress = (address: Address): QuotationAddress => ({
  _id: address._id,
  _type: 'geins.wholesale_account_address',
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
  form.setFieldValue('details.ownerId', data.ownerId);
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
const fetchingData = ref(false);

if (!createMode.value) {
  fetchingData.value = true;

  const { data, error, refresh } = await useAsyncData<Quotation>(
    entityFetchKey.value,
    () => orderApi.quotation.get(entityId.value, { fields: ['all'] }),
  );

  refreshEntityData.value = refresh;

  onMounted(async () => {
    // Validate entity data
    const quotation = handleFetchResult<Quotation>(error.value, data.value);

    // Fetch only the selected company (instead of all companies)
    const companyId = quotation.company?._id || '';
    if (companyId) {
      const company = await customerApi.company.get(companyId, {
        fields: ['buyers', 'salesreps', 'addresses', 'pricelists'],
      });
      selectedCompany.value = company;
    }

    await parseAndSaveData(quotation, false);
    fetchingData.value = false;

    // Fetch products for SKU selector (must await so skuSelection is
    // populated before we take the unsaved-changes baseline snapshot)
    await fetchProducts();

    // Trigger initial preview so prices are enriched before the snapshot
    if (quotationItems.value.length > 0) {
      await callPreview();
    }

    // Set the saved data snapshot after all async data has settled,
    // so the unsaved changes baseline matches the fully populated form
    await nextTick();
    setOriginalSavedData();
  });

  // Re-parse entity data when refreshed (e.g., after a status transition).
  // refresh() from useAsyncData updates data.value reactively, but parseAndSaveData
  // is only called explicitly in onMounted — so we watch data for subsequent changes.
  watch(data, async (newData) => {
    if (!newData) return;
    await parseAndSaveData(newData, false);
    await nextTick();
    setOriginalSavedData();
  });
} else {
  // Create mode: fetch all companies
  onMounted(async () => {
    await fetchCompanies();
  });
}

// =====================================================================================
// SAVE HANDLER
// =====================================================================================
// Custom save handler that delays the unsaved-changes snapshot until all
// reactive side effects (quotationItems watcher, debounced onFormValuesChange)
// have settled — matching the pattern used during initial data loading.
const handleSave = async () => {
  const result = await updateEntity(undefined, undefined, false);
  if (result) {
    await nextTick();
    setOriginalSavedData();
  }
};

// =====================================================================================
// SEND READINESS
// =====================================================================================
const sendBlockReasons = computed<string[]>(() => {
  const reasons: string[] = [];
  const details = form.values.details;
  if (!details?.name) {
    reasons.push(t('orders.send_requires_name'));
  }
  if (!details?.accountId) {
    reasons.push(t('orders.send_requires_customer'));
  }
  if (!details?.ownerId) {
    reasons.push(t('orders.send_requires_owner'));
  }
  if (!details?.buyerId) {
    reasons.push(t('orders.send_requires_buyer'));
  }
  if (!selectedBillingAddressId.value) {
    reasons.push(t('orders.send_requires_billing_address'));
  }
  if (!selectedShippingAddressId.value) {
    reasons.push(t('orders.send_requires_shipping_address'));
  }
  if (!details?.paymentTerms) {
    reasons.push(t('orders.send_requires_terms'));
  }
  if (!details?.currency) {
    reasons.push(t('orders.send_requires_currency'));
  }
  if (quotationItems.value.length === 0) {
    reasons.push(t('orders.send_requires_products'));
  }
  if (hasUnsavedChanges.value) {
    reasons.push(t('orders.send_requires_no_unsaved_changes'));
  }
  return reasons;
});

// =====================================================================================
// STATUS TRANSITION LOGIC
// =====================================================================================

interface StatusAction {
  action: string;
  label: string;
  variant?: 'default' | 'destructive';
}

const statusActions = computed<{
  primary: StatusAction | null;
  secondary: StatusAction[];
}>(() => {
  const status = entityData.value?.status;
  switch (status) {
    case 'pending':
      return {
        primary: {
          action: 'accept',
          label: t('orders.accept_quotation'),
        },
        secondary: [
          {
            action: 'reject',
            label: t('orders.reject_quotation'),
            variant: 'destructive',
          },
          {
            action: 'cancel',
            label: t('orders.cancel_quotation'),
            variant: 'destructive',
          },
          {
            action: 'expire',
            label: t('orders.expire_quotation'),
            variant: 'destructive',
          },
        ],
      };
    case 'accepted':
      return {
        primary: {
          action: 'confirm',
          label: t('orders.confirm_quotation'),
        },
        secondary: [
          {
            action: 'cancel',
            label: t('orders.cancel_quotation'),
            variant: 'destructive',
          },
        ],
      };
    case 'confirmed':
      return {
        primary: {
          action: 'finalize',
          label: t('orders.finalize_quotation'),
        },
        secondary: [
          {
            action: 'cancel',
            label: t('orders.cancel_quotation'),
            variant: 'destructive',
          },
        ],
      };
    default:
      return { primary: null, secondary: [] };
  }
});

// Transition dialog state
const transitionDialogOpen = ref(false);
const transitionAction = ref<StatusAction | null>(null);
const transitionLoading = ref(false);

const openTransitionDialog = (action: StatusAction) => {
  transitionAction.value = action;
  transitionDialogOpen.value = true;
};

const buildTransitionRequest = (
  message?: string,
  messageType: QuotationMessageType = 'internal',
): StatusTransitionRequest => {
  const { userName, userEmail } = storeToRefs(userStore);
  const request: StatusTransitionRequest = {
    authorId: userEmail.value,
    authorName: userName.value,
  };
  if (message) {
    request.message = { type: messageType, message };
  }
  return request;
};

type TransitionMethod = (
  id: string,
  data: StatusTransitionRequest,
) => Promise<void>;

const transitionMethods: Record<string, TransitionMethod> = {
  send: (id, data) => orderApi.quotation.send(id, data),
  accept: (id, data) => orderApi.quotation.accept(id, data),
  reject: (id, data) => orderApi.quotation.reject(id, data),
  confirm: (id, data) => orderApi.quotation.confirm(id, data),
  expire: (id, data) => orderApi.quotation.expire(id, data),
  cancel: (id, data) => orderApi.quotation.cancel(id, data),
  finalize: (id, data) => orderApi.quotation.finalize(id, data),
};

const handleStatusTransition = async (
  action: string,
  message?: string,
  messageType: QuotationMessageType = 'internal',
) => {
  const method = transitionMethods[action];
  if (!method) return;

  transitionLoading.value = true;
  try {
    const request = buildTransitionRequest(message, messageType);
    await method(entityId.value, request);
    await refreshEntityData.value?.();
    toast({
      title: t('orders.quotation_transition_success'),
      variant: 'positive',
    });
  } catch (error) {
    geinsLogError(`Failed to ${action} quotation:`, error);
    showErrorToast(t('orders.quotation_transition_error'));
  } finally {
    transitionLoading.value = false;
    transitionDialogOpen.value = false;
  }
};

// Send quotation dialog state
const sendDialogOpen = ref(false);
const sendLoading = ref(false);

const handleSendQuotation = async (message?: string) => {
  sendLoading.value = true;
  try {
    const request = buildTransitionRequest(message, 'toCustomer');
    await orderApi.quotation.send(entityId.value, request);
    currentTab.value = 0;
    await refreshEntityData.value?.();
    toast({ title: t('entity_sent', { entityName }), variant: 'positive' });
  } catch (error) {
    geinsLogError('Failed to send quotation:', error);
    showErrorToast(t('error_sending_entity', { entityName }));
  } finally {
    sendLoading.value = false;
    sendDialogOpen.value = false;
  }
};

// Copy as new draft
const copyLoading = ref(false);
const handleCopy = async () => {
  copyLoading.value = true;
  try {
    const newQuotation = await orderApi.quotation.copy(entityId.value);
    if (newQuotation?._id) {
      toast({ title: t('entity_copied', { entityName }), variant: 'positive' });
      await router.push(getEntityUrl(newQuotation._id));
    }
  } catch (error) {
    geinsLogError('Failed to copy quotation:', error);
    showErrorToast(t('error_copying_entity', { entityName }));
  } finally {
    copyLoading.value = false;
  }
};

// Read-only columns for sent mode items table
const sentModeSkuColumns = computed<ColumnDef<QuotationProductRow>[]>(() => {
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
      quantity: 'default',
      price: 'currency',
      priceListPrice: 'currency',
      quotationPrice: 'currency',
    },
  });

  return orderAndFilterColumns(columns, [
    'product',
    'skuId',
    'quantity',
    'price',
    'priceListPrice',
    'quotationPrice',
  ]);
});

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
const companySummary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  const formValues = form.values.details;

  if (selectedAccountName.value) {
    dataList.push({
      label: t('company'),
      value: selectedAccountName.value,
    });
  }
  if (!createMode.value && selectedCompany.value?.vatNumber) {
    dataList.push({
      label: t('customers.vat_number'),
      value: selectedCompany.value.vatNumber,
    });
  }

  if (currentOwnerName.value) {
    dataList.push({
      label: t('owner'),
      value: currentOwnerName.value,
    });
  }

  if (currentBuyerName.value) {
    dataList.push({
      label: t('buyer'),
      value: currentBuyerName.value,
    });
  }
  if (formValues?.currency) {
    dataList.push({ label: t('currency'), value: formValues.currency });
  }

  return dataList;
});

const priceListSummary = computed<DataItem[]>(() => {
  return [];
});

const summary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  if (!entityData.value) return dataList;

  const formValues = form.values.details;
  // In sent mode, VeeValidate clears form values when fields unmount.
  // Use entityData (from reshapeEntityData) as the primary source to stay correct in all modes.
  const summaryName = entityData.value?.name || formValues?.name;
  const summaryExpirationDate =
    entityData.value?.validTo || formValues?.expirationDate;
  const summaryPaymentTerms =
    entityData.value?.terms || formValues?.paymentTerms;

  if (summaryName) {
    dataList.push({ label: t('name'), value: summaryName });
  }
  if (!createMode.value) {
    dataList.push({
      label: t('ref_number'),
      value: entityData.value.quotationNumber,
      displayType: DataItemDisplayType.Copy,
    });
  }
  if (createMode.value && companySummary.value.length) {
    dataList.push(...companySummary.value);
  }
  if (summaryExpirationDate) {
    dataList.push({
      label: t('expiration_date'),
      value: formatDate(summaryExpirationDate),
    });
  }
  if (!createMode.value && summaryPaymentTerms) {
    dataList.push({
      label: t('orders.payment_terms'),
      value: summaryPaymentTerms,
    });
  }

  return dataList;
});

const productsSummary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  const priceLists = selectedCompany.value?.priceLists;

  if (!priceLists?.length || quotationProductRows.value.length === 0) {
    return dataList;
  }

  if (!createMode.value && selectedSkus.value.length > 0) {
    dataList.push({
      label: t('product', selectedSkus.value.length),
      value: t(
        'nr_of_entity',
        { entityName: 'product', count: selectedSkus.value.length },
        selectedSkus.value.length,
      ),
    });
  }

  dataList.push({
    label: t('orders.price_lists_applied'),
    value: priceLists.map((pl) => pl._id),
    displayValue: priceLists.map((pl) => pl.name).join(', '),
    entityName: 'price_list',
    displayType: DataItemDisplayType.Array,
  });

  return dataList;
});

const settingsSummary = ref<DataItem[]>([]);

const quotationStatus = computed<QuotationStatus>(
  () => entityData.value?.status || 'draft',
);

const { summaryProps } = useEntityEditSummary({
  createMode,
  formTouched,
  summary,
  settingsSummary,
  entityName,
  entityLiveStatus,
  showActiveStatus: false,
  status: quotationStatus,
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
  <DialogConfirmSend
    v-model:open="sendDialogOpen"
    :entity-name="entityName"
    :loading="sendLoading"
    :block-reasons="sendBlockReasons"
    @confirm="handleSendQuotation"
  />
  <DialogStatusTransition
    v-if="transitionAction"
    v-model:open="transitionDialogOpen"
    :action="transitionAction.label"
    :entity-name="entityName"
    :loading="transitionLoading"
    :variant="transitionAction.variant || 'default'"
    @confirm="(msg) => handleStatusTransition(transitionAction!.action, msg)"
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
          <!-- DRAFT MODE actions -->
          <template v-if="!createMode && !sentMode">
            <ButtonIcon
              icon="save"
              :loading="loading"
              :disabled="!hasUnsavedChanges || loading"
              @click="handleSave"
              >{{ $t('save_entity', { entityName: 'draft' }) }}</ButtonIcon
            >
            <ButtonGroup>
              <ButtonIcon
                variant="secondary"
                icon="send"
                :disabled="loading"
                @click="sendDialogOpen = true"
                >{{ $t('send_entity', { entityName }) }}
              </ButtonIcon>
              <DropdownMenu>
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
                  <DropdownMenuItem :disabled="copyLoading" @click="handleCopy">
                    <LucideCopy class="mr-2 size-4" />
                    <span>{{ $t('orders.copy_as_new_draft') }}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="openDeleteDialog">
                    <LucideTrash class="mr-2 size-4" />
                    <span>{{ $t('delete_entity', { entityName }) }}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </template>

          <!-- SENT MODE actions -->
          <template v-if="sentMode">
            <ButtonGroup>
              <Button
                v-if="statusActions.primary"
                @click="openTransitionDialog(statusActions.primary)"
              >
                {{ statusActions.primary.label }}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    :size="statusActions.primary ? 'icon' : 'default'"
                    :variant="statusActions.primary ? 'outline' : 'secondary'"
                  >
                    <LucideMoreHorizontal
                      v-if="statusActions.primary"
                      class="size-3.5"
                    />
                    <template v-else>
                      {{ $t('actions') }}
                      <LucideChevronDown class="ml-2 size-3.5" />
                    </template>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <template v-if="statusActions.secondary.length">
                    <DropdownMenuItem
                      v-for="action in statusActions.secondary"
                      :key="action.action"
                      @click="openTransitionDialog(action)"
                    >
                      {{ action.label }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </template>
                  <DropdownMenuItem as-child>
                    <NuxtLink :to="newEntityUrl">
                      <LucidePlus class="mr-2 size-4" />
                      <span>{{ $t('new_entity', { entityName }) }}</span>
                    </NuxtLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem :disabled="copyLoading" @click="handleCopy">
                    <LucideCopy class="mr-2 size-4" />
                    <span>{{ $t('orders.copy_as_new_draft') }}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </template>
        </ContentActionBar>
        <template v-if="!createMode" #tabs>
          <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
        </template>
        <template v-if="!createMode && !sentMode" #changes>
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
                      name="details.ownerId"
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
                                v-for="salesRep in availableSalesReps"
                                :key="salesRep._id"
                                :value="salesRep._id"
                              >
                                {{ fullName(salesRep) }}
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
                                {{ fullName(buyer) }}
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

            <!-- ========== SENT MODE (read-only) ========== -->
            <template v-else-if="sentMode">
              <!-- Card 1: Quotation Details (read-only) -->
              <ContentEditCard
                :create-mode="false"
                :title="$t('entity_details', { entityName })"
              >
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('entity_name', { entityName }) }}
                      </p>
                      <p class="text-sm">
                        {{ entityData?.name || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('ref_number') }}
                      </p>
                      <p class="text-sm">
                        {{ entityData?.quotationNumber || '-' }}
                      </p>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('status') }}
                      </p>
                      <StatusBadge :status="quotationStatus" />
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('expiration_date') }}
                      </p>
                      <p class="text-sm">
                        {{
                          entityData?.validTo
                            ? formatDate(entityData.validTo)
                            : '-'
                        }}
                      </p>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('orders.sent_on') }}
                      </p>
                      <p class="text-sm">
                        {{
                          entityData?.validFrom
                            ? formatDate(entityData.validFrom)
                            : '-'
                        }}
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('orders.modified_at') }}
                      </p>
                      <p class="text-sm">
                        {{
                          entityData?.modifiedAt
                            ? formatDate(entityData.modifiedAt)
                            : '-'
                        }}
                      </p>
                    </div>
                  </div>
                  <div class="border-t pt-4">
                    <div class="mb-1 flex items-center gap-1.5">
                      <p class="text-muted-foreground text-xs font-medium">
                        {{ $t('orders.require_confirmation') }}
                      </p>
                      <ContentQuotationWorkflowInfo />
                    </div>
                    <p class="text-sm">
                      {{
                        entityData?.settings?.requireConfirmation
                          ? $t('yes')
                          : $t('no')
                      }}
                    </p>
                  </div>
                </div>
              </ContentEditCard>

              <!-- Card 2: Customer (read-only, no Change button) -->
              <ContentEditCard :create-mode="false" :title="$t('customer')">
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('company') }}
                      </p>
                      <p class="text-sm">
                        <Skeleton v-if="fetchingData" class="h-5 w-32" />
                        <template v-else>
                          {{ selectedCompany?.name || '-' }}
                        </template>
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('customers.vat_number') }}
                      </p>
                      <p class="text-sm">
                        <Skeleton v-if="fetchingData" class="h-5 w-32" />
                        <template v-else>
                          {{ selectedCompany?.vatNumber || '-' }}
                        </template>
                      </p>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('billing_address') }}
                      </p>
                      <ContentAddressDisplay
                        :loading="fetchingData"
                        :address="billingAddress"
                        address-only
                      />
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('shipping_address') }}
                      </p>
                      <ContentAddressDisplay
                        :loading="fetchingData"
                        :address="shippingAddress"
                        address-only
                      />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('buyer') }}
                      </p>
                      <p class="text-sm">
                        <Skeleton v-if="fetchingData" class="h-5 w-32" />
                        <template v-else>
                          {{ currentBuyerName || '-' }}
                        </template>
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('orders.quotation_owner') }}
                      </p>
                      <p class="text-sm">
                        <Skeleton v-if="fetchingData" class="h-5 w-32" />
                        <template v-else>
                          {{ currentOwnerName || '-' }}
                        </template>
                      </p>
                    </div>
                  </div>
                  <div class="border-t pt-4">
                    <p class="text-muted-foreground mb-1 text-xs font-medium">
                      {{ $t('currency') }}
                    </p>
                    <p class="text-sm">
                      <Skeleton v-if="fetchingData" class="h-5 w-32" />
                      <template v-else>
                        {{ entityData?.currency || '-' }}
                      </template>
                    </p>
                  </div>
                </div>
              </ContentEditCard>

              <!-- Card 3: Payment Terms (read-only) -->
              <ContentEditCard
                :create-mode="false"
                :title="$t('orders.payment_settings')"
              >
                <div>
                  <p class="text-muted-foreground mb-1 text-xs font-medium">
                    {{ $t('orders.payment_terms') }}
                  </p>
                  <p class="text-sm">
                    <Skeleton v-if="fetchingData" class="h-5 w-32" />
                    <template v-else>
                      {{ entityData?.terms || '-' }}
                    </template>
                  </p>
                </div>
              </ContentEditCard>

              <!-- Card 4: Items & Summary -->
              <ContentEditCard
                :create-mode="false"
                :title="$t('orders.items_and_summary')"
              >
                <template v-if="!loadingProducts">
                  <div
                    v-if="selectedCompany?.priceLists?.length"
                    class="dark:bg-input mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5"
                  >
                    <span class="text-primary text-xs font-medium">
                      {{ $t('orders.price_lists_applied') }}:
                    </span>
                    <NuxtLink
                      v-for="pl in selectedCompany.priceLists"
                      :key="pl._id"
                      :to="getEntityUrlFor('price-list', 'pricing', pl._id)"
                      target="_blank"
                      :class="
                        cn(
                          'bg-secondary dark:bg-card dark:hover:border-primary/50 data-[state=active]:ring-ring ring-offset-background hover:bg-muted/80 flex h-6 items-center rounded-md border px-2 py-0.5 text-sm transition-colors data-[state=active]:ring-2 data-[state=active]:ring-offset-2 dark:h-7',
                        )
                      "
                    >
                      {{ pl.name }}
                      <LucideExternalLink class="ml-1.5 size-3" />
                    </NuxtLink>
                  </div>
                  <TableView
                    :columns="sentModeSkuColumns"
                    :data="quotationProductRows"
                    entity-name="product"
                    :mode="TableMode.Minimal"
                    :empty-description="
                      t(
                        'empty_description_not_added',
                        {
                          entityName: 'product',
                        },
                        2,
                      )
                    "
                    :page-size="10"
                  />
                  <ContentPriceSummary
                    v-if="quotationTotal && selectedSkus.length"
                    class="mx-3"
                    :total="quotationTotal"
                    :currency="entityData?.currency || ''"
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
            </template>

            <!-- ========== EDIT MODE (draft) ========== -->
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
                      v-slot="{ value, handleChange }"
                      name="details.requireConfirmation"
                    >
                      <FormItemSwitch
                        :model-value="value"
                        :label="$t('orders.require_confirmation')"
                        :description="
                          $t('orders.require_confirmation_description')
                        "
                        class="mt-4"
                        @update:model-value="handleChange"
                      >
                        <template #after-label>
                          <ContentQuotationWorkflowInfo />
                        </template>
                      </FormItemSwitch>
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
                    :current-owner-id="form.values.details?.ownerId || ''"
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
                        <Skeleton v-if="fetchingData" class="h-5 w-32" />
                        <template v-else>
                          {{ selectedCompany?.name || '-' }}
                        </template>
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('customers.vat_number') }}
                      </p>
                      <p class="text-sm">
                        <Skeleton v-if="fetchingData" class="h-5 w-32" />
                        <template v-else>
                          {{ selectedCompany?.vatNumber || '-' }}
                        </template>
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
                        :loading="fetchingData"
                        :address="billingAddress"
                        address-only
                      />
                    </div>

                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('shipping_address') }}
                      </p>
                      <ContentAddressDisplay
                        :loading="fetchingData"
                        :address="shippingAddress"
                        address-only
                      />
                    </div>
                  </div>

                  <!-- Owner & Buyer -->
                  <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('buyer') }}
                      </p>
                      <p class="text-sm">
                        <Skeleton v-if="fetchingData" class="h-5 w-32" />
                        <template v-else>
                          {{ currentBuyerName || '-' }}
                        </template>
                      </p>
                    </div>
                    <div>
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('orders.quotation_owner') }}
                      </p>
                      <p class="text-sm">
                        <Skeleton v-if="fetchingData" class="h-5 w-32" />
                        <template v-else>
                          {{ currentOwnerName || '-' }}
                        </template>
                      </p>
                    </div>
                  </div>

                  <!-- Currency -->
                  <div class="border-t pt-4">
                    <p class="text-muted-foreground mb-1 text-xs font-medium">
                      {{ $t('currency') }}
                    </p>
                    <p class="text-sm">
                      <Skeleton v-if="fetchingData" class="h-5 w-32" />
                      <template v-else>
                        {{ form.values.details?.currency || '-' }}
                      </template>
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

        <!-- TAB 1: PRODUCTS (draft edit mode) -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1 && !createMode && !sentMode"
            :key="`tab-products`"
          >
            <ContentEditCard :create-mode="false" :title="$t('product', 2)">
              <template #header-action>
                <SelectorPanel
                  :selection="skuSelection"
                  :mode="SelectorMode.Simple"
                  entity-name="product"
                  :entities="productsWithSkus"
                  :entity-type="SelectorEntityType.Sku"
                  :options="[
                    {
                      id: 'product',
                      group: 'ids',
                      label: $t('product', 2),
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
                  class="dark:bg-input mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2.5"
                >
                  <span class="text-primary text-xs font-medium">
                    {{ $t('orders.price_lists_applied') }}:
                  </span>
                  <NuxtLink
                    v-for="pl in selectedCompany.priceLists"
                    :key="pl._id"
                    :to="getEntityUrlFor('price-list', 'pricing', pl._id)"
                    target="_blank"
                    :class="
                      cn(
                        'bg-secondary dark:bg-card dark:hover:border-primary/50 data-[state=active]:ring-ring ring-offset-background hover:bg-muted/80 flex h-6 items-center rounded-md border px-2 py-0.5 text-sm transition-colors data-[state=active]:ring-2 data-[state=active]:ring-offset-2 dark:h-7',
                      )
                    "
                  >
                    {{ pl.name }}
                    <LucideExternalLink class="ml-1.5 size-3" />
                  </NuxtLink>
                </div>
                <TableView
                  :columns="selectedSkuColumns"
                  :data="quotationProductRows"
                  entity-name="product"
                  :mode="TableMode.Minimal"
                  :empty-description="
                    t(
                      'empty_description_not_added',
                      {
                        entityName: 'product',
                      },
                      2,
                    )
                  "
                  :page-size="10"
                />
                <ContentPriceSummary
                  v-if="displayTotal && selectedSkus.length"
                  v-model:discount-type="discountType"
                  v-model:discount-value="discountValue"
                  v-model:shipping-fee="shippingFeeInput"
                  class="mx-3"
                  edit-mode
                  :total="displayTotal"
                  :currency="form.values.details?.currency || ''"
                  @blur="debouncedCallPreview()"
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

        <!-- TAB 1: COMMUNICATIONS (sent mode) -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1 && sentMode"
            :key="`tab-communications`"
          >
            <ContentEditCard
              :create-mode="false"
              :title="$t('communication', 2)"
            >
              <QuotationCommunications :communications="communications" />
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
              <Separator
                v-if="!createMode && productsSummary.length"
                class="my-5"
              />
              <ContentPriceSummary
                v-if="!createMode && displayTotal && selectedSkus.length"
                :total="displayTotal"
                :currency="
                  entityData?.currency || form.values.details?.currency || ''
                "
              />
            </template>
          </ContentEditSummary>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
