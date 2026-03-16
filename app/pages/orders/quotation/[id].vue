<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { getLocalTimeZone, today } from '@internationalized/date';
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
  QuotationApiOptions,
  QuotationItem,
  QuotationItemCreate,
  QuotationProductRow,
  QuotationTotal,
  QuotationDiscountRequest,
  QuotationMessage,
  QuotationMessageType,
  QuotationStatus,
  StatusTransitionRequest,
  ExtendTransitionRequest,
  SelectorEntity,
  SelectorSelectionQuery,
  Address,
  ProductApiOptions,
  ChangelogEntry,
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
const { orderApi, customerApi, productApi, changelogApi } =
  useGeinsRepository();
const { currentCurrencies, channels } = storeToRefs(accountStore);
const currentChannels = computed(() => channels.value);
const { getFallbackSelection, transformProductsToSelectorEntities } =
  useSelector();

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
const currentStatus = ref<QuotationStatus>('draft');
const canDeleteInSentMode = computed(() =>
  (['rejected', 'expired', 'canceled'] as QuotationStatus[]).includes(
    currentStatus.value,
  ),
);
const communications = ref<QuotationMessage[]>([]);

// Discount & shipping (standalone refs, not form fields)
const discountType = ref<'percent' | 'fixedAmount'>('percent');
const discountValue = ref<string>('');
const shippingFeeInput = ref<string>('');

// Live preview state
const previewTotal = ref<QuotationTotal | null>(null);
const previewLoading = ref(false);

// Guard flag: prevents watchers from mutating entityDataUpdate during initial load
const isInitialLoadComplete = ref(false);

// Tabs & Steps
const tabs = computed(() =>
  createMode.value
    ? [t('general'), t('product', 2)]
    : sentMode.value
      ? [t('general'), t('communication'), t('changelog.tab_title')]
      : [t('general'), t('product', 2)],
);

// Changelog state
const changelogEntries = ref<ChangelogEntry[]>([]);
const changelogLoading = ref(false);
const changelogError = ref(false);

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
const displayTotal = computed<QuotationTotal | null>(
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
const billingAddress = ref<Address | null>(null);
const shippingAddress = ref<Address | null>(null);
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

// Items source of truth — populated from GET, update, or preview response
const displayItems = ref<QuotationItem[]>([]);

// Derived SKU selection for SelectorPanel (read-only)
const skuSelection = computed<SelectorSelectionInternal>(() => ({
  ...getFallbackSelection(),
  ids: displayItems.value.map((item) => item.skuId),
}));

const getItemName = (item: QuotationItem) => {
  const hasSkuName = item.skuName && item.skuName !== '-';
  const skuNamePart = hasSkuName ? ` (${item.skuName})` : '';
  return `${item.name}${skuNamePart}`;
};

// Derived table rows from displayItems
const quotationProductRows = computed<QuotationProductRow[]>(() => {
  const currency = form.values.details?.currency || 'SEK';
  return displayItems.value.map((item) => {
    return {
      _id: item.skuId,
      product: getItemName(item),
      skuId: item.skuId,
      quantity: item.quantity,
      image: item.primaryImage || '',
      price: {
        price: item.ordPrice ? String(item.ordPrice) : '',
        currency,
      },
      priceListPrice: {
        price:
          item.listPrice && item.listPrice !== item.ordPrice
            ? String(item.listPrice)
            : '---',
        currency,
      },
      quotationPrice: {
        price:
          item.unitPrice !== undefined
            ? String(item.unitPrice)
            : item.listPrice
              ? String(item.listPrice)
              : '',
        currency,
      },
      rowTotal: {
        price: String(item.rowTotal),
        currency,
      },
      articleNumber: item.articleNumber || '',
    };
  });
});

// Build quotation items payload from displayItems
const quotationItems = computed<QuotationItemCreate[]>(() =>
  displayItems.value.map((item) => ({
    skuId: item.skuId,
    quantity: item.quantity,
    ...(item.unitPrice !== undefined && item.unitPrice !== item.listPrice
      ? { unitPrice: item.unitPrice }
      : {}),
  })),
);

const handleQuantityChange = (
  value: string | number,
  row: Row<QuotationProductRow>,
) => {
  const skuId = row.original._id;
  const item = displayItems.value.find((i) => i.skuId === skuId);
  if (!item) return;
  item.quantity = Math.max(1, Number(value) || 1);
  displayItems.value = [...displayItems.value];
  debouncedCallPreview();
};

const handleQuotationPriceChange = (
  value: string | number,
  row: Row<QuotationProductRow>,
) => {
  const skuId = row.original._id;
  const item = displayItems.value.find((i) => i.skuId === skuId);
  if (!item) return;
  const normalized = String(value).replace(',', '.');
  const num = Number(normalized);
  // Reset to undefined if value is empty, invalid, or matches the list price
  item.unitPrice =
    normalized === '' || isNaN(num) || num === item.listPrice ? undefined : num;
  displayItems.value = [...displayItems.value];
  debouncedCallPreview();
};

const removeSkuFromSelection = (rowData: QuotationProductRow) => {
  displayItems.value = displayItems.value.filter(
    (item) => item.skuId !== rowData._id,
  );
  debouncedCallPreview();
};

// =====================================================================================
// LIVE PREVIEW
// =====================================================================================
const callPreview = async () => {
  if (createMode.value || sentMode.value || !entityId.value) return;
  const items = quotationItems.value;
  if (items.length === 0) {
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
      items,
    });
    previewTotal.value = response.total;
    if (response.items?.length) {
      displayItems.value = response.items;
    }
  } catch (error) {
    geinsLogError('Failed to fetch preview:', error);
  } finally {
    previewLoading.value = false;
  }
};
const debouncedCallPreview = useDebounceFn(callPreview, 500);

// Build a placeholder QuotationItem for a newly added SKU, using productsWithSkus
// data for display info. Prices are zeroed out; the API will fill them in on success.
const createPlaceholderItem = (skuId: string): QuotationItem => {
  let productName = skuId;
  let skuName = '';
  let articleNumber = '';
  let primaryImage = '';
  for (const product of productsWithSkus.value) {
    const sku = product.skus?.find((s) => s._id === skuId);
    if (sku) {
      productName = product.name;
      skuName = sku.name || '';
      articleNumber = product.articleNumber || '';
      primaryImage = product.thumbnail || product.image || '';
      break;
    }
  }
  return {
    _id: skuId,
    _type: 'quotation_item',
    skuId,
    quantity: 1,
    name: productName,
    skuName,
    articleNumber,
    primaryImage,
    ordPrice: 0,
    ordPriceIncVat: 0,
    listPrice: 0,
    listPriceIncVat: 0,
    rowTotal: 0,
    rowTotalIncVat: 0,
  };
};

// Handle SelectorPanel save — optimistically add new SKUs before calling preview
const updateSkuSelection = async (
  updatedSelection: SelectorSelectionInternal,
) => {
  const newIds = updatedSelection.ids || [];
  const currentSkuIds = new Set(displayItems.value.map((item) => item.skuId));
  const newIdSet = new Set(newIds);

  // Remove deselected SKUs
  displayItems.value = displayItems.value.filter((item) =>
    newIdSet.has(item.skuId),
  );

  // Add placeholder items for newly added SKUs so they are visible even if the
  // preview API call fails. The placeholders will be replaced by the API response
  // on success.
  const addedSkuIds = newIds.filter((id) => !currentSkuIds.has(id));
  if (addedSkuIds.length > 0) {
    displayItems.value = [
      ...displayItems.value,
      ...addedSkuIds.map(createPlaceholderItem),
    ];
  }

  await callPreview();
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
      'rowTotal',
    ],
    columnTitles: {
      product: t('product'),
      skuId: t('orders.sku_id'),
      quantity: t('quantity'),
      price: t('orders.base_price'),
      priceListPrice: t('orders.price_list_price'),
      quotationPrice: t('orders.quotation_price'),
      rowTotal: t('orders.row_total'),
    },
    columnTypes: {
      product: 'product',
      skuId: 'default',
      quantity: 'editable-number',
      price: 'currency',
      priceListPrice: 'currency',
      quotationPrice: 'editable-currency',
      rowTotal: 'currency',
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
    'rowTotal',
    'actions',
  ]);
});

// Sales reps from selected company
const availableSalesReps = computed(() => {
  if (!selectedCompany.value?.salesReps) return [];
  return selectedCompany.value.salesReps;
});

const availableBuyers = computed(() => {
  return selectedCompany.value?.buyers?.filter((b) => b.active) || [];
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

// Get the default currency for a company based on its first channel's default market
const getDefaultCurrencyForCompany = (
  company: CustomerCompany | undefined,
): string | undefined => {
  if (!company?.channels?.length) return undefined;
  for (const channelId of company.channels) {
    const channel = currentChannels.value.find((ch) => ch._id === channelId);
    if (!channel?.markets?.length) continue;
    const defaultMarket = channel.markets.find(
      (m) => m._id === String(channel.defaultMarket),
    );
    if (defaultMarket?.currency?._id) return defaultMarket.currency._id;
  }
  return undefined;
};

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
  cancelPendingFormSync,
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
  excludeSaveFields: [
    'billingAddress',
    'shippingAddress',
    'company',
    'owner',
    'customer',
    'communication',
    'changelog',
    'total',
    'createdAt',
    'modifiedAt',
    'orderId',
    'quotationNumber',
    'status',
    'currency',
    'channelId',
    'marketId',
  ],
  reshapeEntityData: (entityData) => ({
    ...entityData,
    // Normalize update-relevant fields to match onFormValuesChange shape
    ownerId: entityData.owner?._id || undefined,
    customerId: entityData.customer?._id || undefined,
    companyId: entityData.company?._id || undefined,
    billingAddressId: entityData.billingAddress?._id || undefined,
    shippingAddressId: entityData.shippingAddress?._id || undefined,
    items: (entityData.items || []).map((item) => ({
      skuId: item.skuId,
      quantity: item.quantity,
      ...(item.unitPrice !== undefined && item.unitPrice !== item.listPrice
        ? { unitPrice: item.unitPrice }
        : {}),
    })),
    discount: entityData.discount?.value ? entityData.discount : undefined,
    settings: entityData.settings ?? { requireConfirmation: false },
    validPaymentMethods:
      entityData.validPaymentMethods?.map((pm) => ({
        paymentId: String(pm.paymentId),
      })) ?? [],
    validShippingMethods:
      entityData.validShippingMethods?.map((sm) => ({
        shippingId: String(sm.shippingId),
        shippingFee: sm.shippingFee,
      })) ?? [],
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
    currentStatus.value = quotation.status;
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
    billingAddress.value = quotation.billingAddress;
    shippingAddress.value = quotation.shippingAddress;

    // Resolve payment terms from validPaymentMethods
    const paymentTerms = quotation.terms || 'Net 30';

    // Set expiration date toggle
    hasExpirationDate.value = !!quotation.validTo;

    // Set items from API response as the source of truth
    displayItems.value = quotation.items || [];

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
    companyId: formData.details.accountId || undefined,
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
      // During initial load, the debounced callback fires after setOriginalSavedData,
      // which would overwrite entityDataUpdate and cause false unsaved changes.
      if (sentMode.value || !isInitialLoadComplete.value) return;
      entityDataUpdate.value = {
        ...entityDataUpdate.value,
        name: values.details.name,
        validTo: values.details.expirationDate || undefined,
        ownerId: values.details.ownerId || undefined,
        customerId: values.details.buyerId || undefined,
        companyId: values.details.accountId || undefined,
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
          requireConfirmation: values.details.requireConfirmation ?? false,
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
    const currency = entityData.value?.currency;
    const options: ProductApiOptions = { fields: ['media', 'skus'] };
    const selection: SelectorSelectionQuery = {
      ...(channelId && { channelIds: [channelId] }),
      ...(currency && { currencyIds: [currency] }),
    };
    const hasFilters = channelId || currency;
    const response = hasFilters
      ? await productApi.query(
          { include: [{ selections: [selection] }] },
          options,
        )
      : await productApi.list(options);

    productsWithSkus.value = transformProductsToSelectorEntities(
      response?.items || [],
    );
  } catch (error) {
    geinsLogError('Failed to fetch products:', error);
  } finally {
    loadingProducts.value = false;
  }
};

// Fetch changelog entries — non-blocking, errors captured in changelogError
const fetchChangelog = async () => {
  if (!entityId.value) return;
  changelogLoading.value = true;
  changelogError.value = false;
  try {
    changelogEntries.value = await changelogApi.getForEntity(
      'quotation',
      entityId.value,
    );
  } catch (error) {
    geinsLogError('Failed to fetch changelog:', error);
    changelogError.value = true;
  } finally {
    changelogLoading.value = false;
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

      // Set currency to channel's default market currency, or first available
      if (availableCurrencies.value.length > 0) {
        const defaultCurrency = getDefaultCurrencyForCompany(company);
        form.setFieldValue(
          'details.currency',
          defaultCurrency || availableCurrencies.value[0]?._id,
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
  quotationItems,
  () => {
    if (
      createMode.value ||
      !entityDataUpdate.value ||
      !isInitialLoadComplete.value
    )
      return;
    entityDataUpdate.value = {
      ...entityDataUpdate.value,
      items: quotationItems.value,
    };
  },
  { deep: true },
);

// Sync address changes with entityDataUpdate for unsaved changes detection
watch([selectedBillingAddressId, selectedShippingAddressId], () => {
  if (
    createMode.value ||
    !entityDataUpdate.value ||
    !isInitialLoadComplete.value
  )
    return;
  entityDataUpdate.value = {
    ...entityDataUpdate.value,
    billingAddressId: selectedBillingAddressId.value || undefined,
    shippingAddressId: selectedShippingAddressId.value || undefined,
  };
});

// Sync discount & shipping fee with entityDataUpdate for unsaved changes detection
watch([discountType, discountValue, shippingFeeInput], () => {
  if (
    createMode.value ||
    !entityDataUpdate.value ||
    !isInitialLoadComplete.value
  )
    return;
  entityDataUpdate.value = {
    ...entityDataUpdate.value,
    discount: discountRequest.value || undefined,
    suggestedShippingFee:
      shippingFeeInput.value !== ''
        ? Number(shippingFeeInput.value)
        : undefined,
  };
});

// =====================================================================================
// CUSTOMER PANEL HANDLER
// =====================================================================================

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
    if (billing) billingAddress.value = billing;
    if (shipping) shippingAddress.value = shipping;
  }
};

// =====================================================================================
// DRAFT SNAPSHOT SYNC
// =====================================================================================
// In draft mode, compare snapshot data (addresses, owner, buyer, company) against
// live company data. If content has changed since the snapshot was taken, update
// local refs so the UI shows current data. Returns true if any snapshot was stale,
// so the caller can auto-save to persist the updated snapshots.

function hasFieldsChanged<T>(
  snapshot: T | null | undefined,
  live: T | null | undefined,
  fields: (keyof T)[],
): boolean {
  if (!snapshot || !live) return false;
  return fields.some((field) => snapshot[field] !== live[field]);
}

const addressFields: (keyof Address)[] = [
  'firstName',
  'lastName',
  'company',
  'careOf',
  'addressLine1',
  'addressLine2',
  'addressLine3',
  'zip',
  'city',
  'region',
  'country',
  'email',
  'phone',
];

const personFields = ['firstName', 'lastName', 'phone'] as const;

function syncCompanySnapshots(): boolean {
  if (sentMode.value) return false;
  const company = selectedCompany.value;
  if (!company) return false;

  let changed = false;

  // --- Addresses ---
  const addresses = company.addresses;
  if (addresses) {
    const liveBilling = addresses.find(
      (a) => a._id === selectedBillingAddressId.value,
    );
    if (
      hasFieldsChanged(billingAddress.value, liveBilling, addressFields) &&
      liveBilling
    ) {
      billingAddress.value = liveBilling;
      changed = true;
    }

    const liveShipping = addresses.find(
      (a) => a._id === selectedShippingAddressId.value,
    );
    if (
      hasFieldsChanged(shippingAddress.value, liveShipping, addressFields) &&
      liveShipping
    ) {
      shippingAddress.value = liveShipping;
      changed = true;
    }
  }

  // --- Owner (sales rep) ---
  const ownerSnapshot = entityData.value?.owner;
  const liveOwner = company.salesReps?.find(
    (sr) => sr._id === ownerSnapshot?._id,
  );
  if (hasFieldsChanged(ownerSnapshot, liveOwner, [...personFields])) {
    changed = true;
  }

  // --- Buyer (customer) ---
  const buyerSnapshot = entityData.value?.customer;
  const liveBuyer = company.buyers?.find((b) => b._id === buyerSnapshot?._id);
  if (hasFieldsChanged(buyerSnapshot, liveBuyer, [...personFields])) {
    changed = true;
  }

  // --- Company name / VAT ---
  const companySnapshot = entityData.value?.company;
  if (
    companySnapshot &&
    (companySnapshot.name !== company.name ||
      companySnapshot.vatNumber !== company.vatNumber)
  ) {
    selectedAccountName.value = company.name || '';
    changed = true;
  }

  return changed;
}

function hasItemPriceDrift(
  savedItems: QuotationItem[],
  previewItems: QuotationItem[],
): boolean {
  if (sentMode.value || savedItems.length === 0 || previewItems.length === 0)
    return false;

  const savedBySkuId = new Map(savedItems.map((s) => [s.skuId, s]));
  for (const previewItem of previewItems) {
    const saved = savedBySkuId.get(previewItem.skuId);
    if (!saved) continue;
    if (
      saved.ordPrice !== previewItem.ordPrice ||
      saved.listPrice !== previewItem.listPrice
    ) {
      return true;
    }
  }
  return false;
}

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

    // Fetch products for SKU selector (must await so skuSelection is
    // populated before we take the unsaved-changes baseline snapshot)
    await fetchProducts();

    // Capture saved item prices before preview overwrites them with current pricelist values
    const savedItems: QuotationItem[] = [...(quotation.items || [])];

    // Trigger initial preview so prices are enriched before the snapshot
    if (quotationItems.value.length > 0) {
      await callPreview();
    }

    // Cancel any pending debounced onFormValuesChange that was queued by
    // form.setValues() in parseEntityData — it would mutate entityDataUpdate
    // after the snapshot and cause false unsaved changes.
    cancelPendingFormSync();

    // Set the saved data snapshot after all async data has settled,
    // so the unsaved changes baseline matches the fully populated form
    await nextTick();
    setOriginalSavedData();

    // Sync stale snapshots (addresses, owner, buyer, company) and stale pricelist
    // prices. If either is outdated, auto-save once so the backend re-snapshots
    // the current content and persists current prices.
    const snapshotsDrifted = syncCompanySnapshots();
    const pricesDrifted = hasItemPriceDrift(savedItems, displayItems.value);
    if (snapshotsDrifted || pricesDrifted) {
      await updateEntity(undefined, undefined, false, true);
      cancelPendingFormSync();
      await nextTick();
      setOriginalSavedData();
    }

    // Enable watchers only after all async loading and snapshot syncing is complete.
    // Prevents debounced onFormValuesChange and reactive watchers from mutating
    // entityDataUpdate after the baseline snapshot, which caused false unsaved changes.
    isInitialLoadComplete.value = true;
    fetchingData.value = false;

    // Fetch changelog non-blocking — errors captured in changelogError
    fetchChangelog();
  });

  // Re-parse entity data when refreshed (e.g., after a status transition).
  // refresh() from useAsyncData updates data.value reactively, but parseAndSaveData
  // is only called explicitly in onMounted — so we watch data for subsequent changes.
  watch(data, async (newData) => {
    if (!newData) return;
    await parseAndSaveData(newData, false);
    cancelPendingFormSync();
    await nextTick();
    setOriginalSavedData();
    fetchChangelog();
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
    cancelPendingFormSync();
    await nextTick();
    setOriginalSavedData();
    fetchChangelog();
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
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
  icon?: 'send' | 'check' | 'ban' | 'x' | 'shopping-cart' | 'calendar-plus';
  messageType?: QuotationMessageType;
  blockReasons?: string[];
  showDatePicker?: boolean;
}

interface StatusActionLayout {
  placeOrder: boolean;
  groupActions: StatusAction[];
  dropdownActions: StatusAction[];
}

const statusActions = computed<StatusActionLayout>(() => {
  const status = entityData.value?.status;
  const strict = entityData.value?.settings?.requireConfirmation ?? false;

  const en = { entityName };

  const extendAction = (description: string): StatusAction => ({
    action: 'extend',
    label: t('orders.extend_quotation'),
    title: t('orders.extend_quotation'),
    description,
    icon: 'calendar-plus',
    showDatePicker: true,
  });

  switch (status) {
    case 'pending':
      if (strict) {
        return {
          placeOrder: false,
          groupActions: [
            {
              action: 'accept',
              label: t('accept_entity', en),
              title: t('accept_entity', en),
              description: t('orders.accept_quotation_description'),
              icon: 'check',
            },
            {
              action: 'reject',
              label: t('reject_entity', en),
              title: t('reject_entity', en),
              description: t('orders.reject_quotation_description'),
              icon: 'x',
            },
          ],
          dropdownActions: [
            extendAction(t('orders.extend_quotation_description_pending')),
            {
              action: 'cancel',
              label: t('cancel_entity', en),
              title: t('cancel_entity', en),
              description: t('orders.cancel_quotation_description'),
              icon: 'ban',
            },
          ],
        };
      }
      return {
        placeOrder: true,
        groupActions: [
          {
            action: 'cancel',
            label: t('cancel_entity', en),
            title: t('cancel_entity', en),
            description: t('orders.cancel_quotation_description'),
            icon: 'ban',
          },
        ],
        dropdownActions: [
          extendAction(t('orders.extend_quotation_description_pending')),
        ],
      };

    case 'expired':
      return {
        placeOrder: false,
        groupActions: [
          extendAction(t('orders.extend_quotation_description_expired')),
        ],
        dropdownActions: [],
      };

    case 'accepted':
      return {
        placeOrder: true,
        groupActions: [
          {
            action: 'confirm',
            label: t('confirm_entity', en),
            title: t('confirm_entity', en),
            description: t('orders.confirm_quotation_description'),
            icon: 'check',
            messageType: 'toCustomer',
          },
        ],
        dropdownActions: [
          {
            action: 'cancel',
            label: t('cancel_entity', en),
            title: t('cancel_entity', en),
            description: t('orders.cancel_quotation_description'),
            icon: 'ban',
          },
        ],
      };

    case 'confirmed':
      return {
        placeOrder: true,
        groupActions: [
          {
            action: 'cancel',
            label: t('cancel_entity', en),
            title: t('cancel_entity', en),
            description: t('orders.cancel_quotation_description'),
            icon: 'ban',
          },
        ],
        dropdownActions: [],
      };

    default:
      return { placeOrder: false, groupActions: [], dropdownActions: [] };
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
  validTo?: string,
) => {
  // Extend uses a dedicated endpoint with validTo in the request body
  if (action === 'extend') {
    if (!validTo) return;
    transitionLoading.value = true;
    try {
      const request: ExtendTransitionRequest = {
        ...buildTransitionRequest(message, messageType),
        validTo,
      };
      await orderApi.quotation.extend(entityId.value, request);
      await refreshEntityData.value?.();
      toast({
        title: t(`orders.quotation_transition_success_${action}`),
        variant: 'positive',
      });
    } catch (error) {
      geinsLogError('Failed to extend quotation:', error);
      showErrorToast(t('orders.quotation_transition_error'));
    } finally {
      transitionLoading.value = false;
      transitionDialogOpen.value = false;
    }
    return;
  }

  const method = transitionMethods[action];
  if (!method) return;

  transitionLoading.value = true;
  try {
    const request = buildTransitionRequest(message, messageType);

    // Auto-confirm before finalize when requireConfirmation is enabled and status is accepted.
    // Send confirm without a message to avoid duplicate entries in the communications tab.
    if (
      action === 'finalize' &&
      entityData.value?.settings?.requireConfirmation &&
      entityData.value?.status === 'accepted'
    ) {
      const confirmRequest = buildTransitionRequest(undefined, messageType);
      const confirmMethod = transitionMethods.confirm;
      if (confirmMethod) {
        await confirmMethod(entityId.value, confirmRequest);
      }
    }

    await method(entityId.value, request);
    if (action === 'send') {
      currentTab.value = 0;
    }
    await refreshEntityData.value?.();
    toast({
      title: t(`orders.quotation_transition_success_${action}`),
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

// =====================================================================================
// MESSAGE CRUD
// =====================================================================================
const messageLoading = ref(false);
const messageEditLoading = ref(false);
const messageSendSuccessCount = ref(0);

const handleSendMessage = async (
  type: QuotationMessageType,
  message: string,
  answerRef?: string,
) => {
  const { userName, userEmail } = storeToRefs(userStore);
  messageLoading.value = true;
  try {
    await orderApi.quotation.createMessage(entityId.value, {
      type,
      authorId: userEmail.value,
      authorName: userName.value,
      message,
      ...(answerRef ? { answerRef } : {}),
    });
    await refreshEntityData.value?.();
    messageSendSuccessCount.value++;
    toast({
      title: t('entity_sent', { entityName: 'message' }),
      variant: 'positive',
    });
  } catch (error) {
    geinsLogError('Failed to create message:', error);
    showErrorToast(t('error_sending_entity', { entityName: 'message' }));
  } finally {
    messageLoading.value = false;
  }
};

const handleEditMessage = async (messageId: string, newText: string) => {
  messageEditLoading.value = true;
  try {
    await orderApi.quotation.updateMessage(messageId, { message: newText });
    await refreshEntityData.value?.();
    toast({ title: t('entity_updated'), variant: 'positive' });
  } catch (error) {
    geinsLogError('Failed to update message:', error);
    showErrorToast(t('error_updating_entity', { entityName: 'message' }));
  } finally {
    messageEditLoading.value = false;
  }
};

const handleDeleteMessage = async (messageId: string) => {
  try {
    await orderApi.quotation.deleteMessage(messageId);
    await refreshEntityData.value?.();
    toast({
      title: t('entity_deleted', { entityName: 'message' }),
      variant: 'positive',
    });
  } catch (error) {
    geinsLogError('Failed to delete message:', error);
    showErrorToast(t('error_deleting_entity', { entityName: 'message' }));
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
      'rowTotal',
    ],
    columnTitles: {
      product: t('product'),
      skuId: t('orders.sku_id'),
      quantity: t('quantity'),
      price: t('orders.base_price'),
      priceListPrice: t('orders.price_list_price'),
      quotationPrice: t('orders.quotation_price'),
      rowTotal: t('orders.row_total'),
    },
    columnTypes: {
      product: 'product',
      skuId: 'default',
      quantity: 'default',
      price: 'currency',
      priceListPrice: 'currency',
      quotationPrice: 'currency',
      rowTotal: 'currency',
    },
  });

  return orderAndFilterColumns(columns, [
    'product',
    'skuId',
    'quantity',
    'price',
    'priceListPrice',
    'quotationPrice',
    'rowTotal',
  ]);
});

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
const companySummary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  const formValues = form.values.details;

  if (selectedAccountName.value) {
    const companyId = selectedCompanyId.value;
    dataList.push({
      label: t('company'),
      value: selectedAccountName.value,
      ...(companyId && {
        displayType: DataItemDisplayType.Link,
        href: getEntityUrlFor('company', 'customers', companyId),
        target: '_blank',
      }),
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
    dataList.push({
      label: t('orders.require_confirmation'),
      value: entityData.value.settings?.requireConfirmation
        ? t('yes')
        : t('no'),
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

  if (!createMode.value && displayItems.value.length > 0) {
    dataList.push({
      label: t('product', displayItems.value.length),
      value: t(
        'nr_of_entity',
        { entityName: 'product', count: displayItems.value.length },
        displayItems.value.length,
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
  <DialogStatusTransition
    v-if="transitionAction"
    v-model:open="transitionDialogOpen"
    :action="transitionAction.label"
    :title="transitionAction.title"
    :description="transitionAction.description"
    :loading="transitionLoading"
    :variant="transitionAction.variant || 'default'"
    :icon="transitionAction.icon"
    :default-message-type="transitionAction.messageType"
    :block-reasons="transitionAction.blockReasons"
    :show-date-picker="transitionAction.showDatePicker"
    :date-picker-label="$t('orders.new_expiration_date')"
    @confirm="
      (
        msg: string | undefined,
        msgType: QuotationMessageType,
        validTo?: string,
      ) =>
        handleStatusTransition(transitionAction!.action, msg, msgType, validTo)
    "
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
              :disabled="!hasUnsavedChanges || loading || fetchingData"
              @click="handleSave"
              >{{ $t('save_entity', { entityName: 'draft' }) }}</ButtonIcon
            >
            <ButtonGroup>
              <ButtonIcon
                variant="secondary"
                icon="send"
                :disabled="loading"
                @click="
                  openTransitionDialog({
                    action: 'send',
                    label: $t('send_entity', { entityName }),
                    title: $t('send_entity', { entityName }),
                    description: form.values.details.requireConfirmation
                      ? $t(
                          'orders.send_quotation_description_require_confirmation',
                        )
                      : $t('orders.send_quotation_description'),
                    icon: 'send',
                    messageType: 'toCustomer',
                    blockReasons: sendBlockReasons,
                  })
                "
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
            <Button
              v-if="statusActions.placeOrder"
              @click="
                openTransitionDialog({
                  action: 'finalize',
                  label: $t('orders.place_order'),
                  title: $t('orders.place_order'),
                  description: $t('orders.place_order_description'),
                  icon: 'shopping-cart',
                })
              "
            >
              <LucideShoppingCart class="mr-2 size-4" />
              {{ $t('orders.place_order') }}
            </Button>
            <ButtonGroup>
              <Button
                v-for="action in statusActions.groupActions"
                :key="action.action"
                variant="secondary"
                @click="openTransitionDialog(action)"
              >
                <LucideCheck
                  v-if="action.icon === 'check'"
                  class="mr-2 size-4"
                />
                <LucideBan v-if="action.icon === 'ban'" class="mr-2 size-4" />
                <LucideX v-if="action.icon === 'x'" class="mr-2 size-4" />
                <LucideCalendarPlus
                  v-if="action.icon === 'calendar-plus'"
                  class="mr-2 size-4"
                />
                {{ action.label }}
              </Button>
              <DropdownMenu v-if="statusActions.groupActions.length">
                <DropdownMenuTrigger as-child>
                  <Button size="icon" variant="secondary">
                    <LucideMoreHorizontal
                      v-if="statusActions.groupActions.length"
                      class="size-3.5"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <template v-if="statusActions.dropdownActions.length">
                    <DropdownMenuItem
                      v-for="action in statusActions.dropdownActions"
                      :key="action.action"
                      @click="openTransitionDialog(action)"
                    >
                      <LucideCheck
                        v-if="action.icon === 'check'"
                        class="mr-2 size-4"
                      />
                      <LucideBan
                        v-if="action.icon === 'ban'"
                        class="mr-2 size-4"
                      />
                      <LucideCalendarPlus
                        v-if="action.icon === 'calendar-plus'"
                        class="mr-2 size-4"
                      />
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
                  <template v-if="canDeleteInSentMode">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="openDeleteDialog">
                      <LucideTrash class="mr-2 size-4" />
                      <span>{{ $t('delete_entity', { entityName }) }}</span>
                    </DropdownMenuItem>
                  </template>
                </DropdownMenuContent>
              </DropdownMenu>
              <template v-else>
                <Button variant="secondary" as-child>
                  <NuxtLink :to="newEntityUrl">
                    <LucidePlus class="mr-2 size-4" />
                    <span>{{ $t('new_entity', { entityName }) }}</span>
                  </NuxtLink>
                </Button>
                <Button
                  :disabled="copyLoading"
                  variant="secondary"
                  @click="handleCopy"
                >
                  <LucideCopy class="mr-2 size-4" />
                  {{ $t('orders.copy_as_new_draft') }}
                </Button>
                <Button
                  v-if="canDeleteInSentMode"
                  variant="secondary"
                  @click="openDeleteDialog"
                >
                  <LucideTrash class="mr-2 size-4" />
                  {{ $t('delete_entity', { entityName }) }}
                </Button>
              </template>
            </ButtonGroup>
          </template>
        </ContentActionBar>
        <template v-if="!createMode" #tabs>
          <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
        </template>
        <template v-if="!createMode && !sentMode" #changes>
          <ContentEditHasChanges
            :changes="hasUnsavedChanges && !fetchingData"
          />
        </template>
      </ContentHeader>
    </template>
    <form
      :class="{ 'pointer-events-none opacity-60': fetchingData }"
      @submit.prevent
    >
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
                                v-for="company in companies.filter(
                                  (c) => c.active,
                                )"
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
                    <div
                      v-if="
                        quotationStatus === 'pending' ||
                        quotationStatus === 'expired'
                      "
                    >
                      <p class="text-muted-foreground mb-1 text-xs font-medium">
                        {{ $t('expiration_date') }}
                      </p>
                      <div class="flex items-center gap-2">
                        <p
                          :class="
                            cn(
                              'text-sm',
                              quotationStatus === 'expired' &&
                                entityData?.validTo
                                ? 'text-destructive'
                                : '',
                            )
                          "
                        >
                          {{
                            entityData?.validTo
                              ? formatDate(entityData.validTo)
                              : $t('orders.no_expiration_date')
                          }}
                        </p>
                      </div>
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
                      <ContentQuotationWorkflowInfo
                        :require-confirmation="
                          entityData?.settings?.requireConfirmation
                        "
                      />
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
                <ContentQuotationCustomerDisplay
                  :company-name="selectedCompany?.name"
                  :vat-number="selectedCompany?.vatNumber"
                  :billing-address="billingAddress"
                  :shipping-address="shippingAddress"
                  :buyer-name="currentBuyerName"
                  :owner-name="currentOwnerName"
                  :currency="entityData?.currency"
                  :loading="fetchingData"
                />
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
                    v-if="quotationTotal && displayItems.length"
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
                            :min-value="today(getLocalTimeZone())"
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
                          <ContentQuotationWorkflowInfo
                            :require-confirmation="value"
                            edit-mode
                            @update:require-confirmation="handleChange"
                          />
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

                <ContentQuotationCustomerDisplay
                  :company-name="selectedCompany?.name"
                  :vat-number="selectedCompany?.vatNumber"
                  :billing-address="billingAddress"
                  :shipping-address="shippingAddress"
                  :buyer-name="currentBuyerName"
                  :owner-name="currentOwnerName"
                  :currency="form.values.details?.currency"
                  :loading="fetchingData"
                />
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
                  v-if="displayTotal && displayItems.length"
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

        <!-- TAB 1: COMMUNICATION (sent mode) -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1 && sentMode"
            :key="`tab-communications`"
          >
            <ContentEditCard :create-mode="false" :title="$t('communication')">
              <QuotationCommunications
                :communications="communications"
                :current-user-email="userStore.userEmail"
                :loading="messageLoading"
                :edit-loading="messageEditLoading"
                :message-send-success-count="messageSendSuccessCount"
                @send-message="handleSendMessage"
                @edit-message="handleEditMessage"
                @delete-message="handleDeleteMessage"
              />
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- TAB 2: CHANGELOG (all non-create modes) -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 2 && !createMode"
            :key="`tab-changelog`"
          >
            <ContentEditCard
              :create-mode="false"
              :title="$t('changelog.tab_title')"
            >
              <QuotationChangelog
                :entries="changelogEntries"
                :loading="changelogLoading"
                :error="changelogError"
                @retry="fetchChangelog"
              />
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
                v-if="!createMode && displayTotal && displayItems.length"
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
