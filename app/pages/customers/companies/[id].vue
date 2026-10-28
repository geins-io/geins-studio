<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
// Intent: Explicit imports for types, schemas, and components not auto-imported by Nuxt.
// Only add imports here that Nuxt auto-import does not cover (e.g. zod, shared types, specific components).
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import {
  DataItemDisplayType,
  TableMode,
  SelectorCondition,
  type CustomerCompanyApiOptions,
  type CompanyBuyerList,
} from '#shared/types';
import { ENTITIES, NEW_ENTITY_URL_SEGMENT } from '#shared/utils/entities';
import {
  companyPriceListIdentifier,
  companyPriceListName,
  getCompanyPriceListSaveAction,
  getPriceListSummaryCounts,
  isOwnAccountPriceList,
  pickAccountPriceList,
} from '#shared/utils/price-list';
import { useToast } from '@/components/ui/toast/use-toast';
import { LucideUser, LucidePackage } from '#components';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
// Intent: Initialize all composables and Pinia stores used across this page.
// Order matters — some composables depend on values from earlier ones (e.g. useGeinsRepository before API calls).
// Add new composables here; do not scatter initialization throughout the file.
const scope = 'pages/customers/companies/[id].vue';
const { customerApi, userApi } = useGeinsRepository();
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
  addressSchema,
} = useCustomerCompanies();
const { t } = useI18n();
const { geinsLogError, geinsLogWarn } = useGeinsLog(scope);
const accountStore = useAccountStore();
const { toast } = useToast();
const viewport = useViewport();
const breadcrumbsStore = useBreadcrumbsStore();

// =====================================================================================
// FORM VALIDATION SCHEMA
// =====================================================================================
// Intent: Define Zod validation schemas converted via toTypedSchema for vee-validate.
// addressSchema (shared via useCustomerCompanies) is reused for billing and shipping and by
// the address edit panel. stepValidationMap (below) ties form steps to schema segments.
// Keep schema in sync with the form fields in the <template>.
const isCreateMode = useRoute().params.id === NEW_ENTITY_URL_SEGMENT;

const formSchema = toTypedSchema(
  z.object({
    details: z
      .object({
        name: z.string().min(1, { message: t('form.field_required') }),
        vatNumber: isCreateMode
          ? z.string().min(1, { message: t('form.field_required') })
          : z.string().optional(),
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
// Intent: Define default/template objects used as initial state for create and update modes.
// entityBase and addressBase are passed to useEntityEdit. Ensure every field has a sensible default.
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
// Intent: Local reactive state for UI concerns — tabs, steps, address toggles, company groups.
// This is NOT entity data; it's presentation state. Keep UI state separate from entity/form data.
// Tabs & Steps
const tabs = [
  t('general'),
  t('buyer', 2),
  t('navigation.pricing'),
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

// Company set prices: the switch saves with "Save company", so it counts as
// an unsaved change until the saved list matches it (see COMPANY SET PRICES).
const companyPriceList = ref<CustomerPriceList>();
const companyPriceListEnabled = ref(false);
const companyPriceListHasChanges = computed(
  () =>
    companyPriceListEnabled.value !== (companyPriceList.value?.active ?? false),
);

// =====================================================================================
// ENTITY EDIT COMPOSABLE
// =====================================================================================
// Intent: Central CRUD orchestrator — provides create/update/delete, form binding, unsaved changes.
// Configuration callbacks transform data between API shape and form shape.
// Do NOT duplicate CRUD logic outside this composable.
const {
  entityKey,
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
  entity: ENTITIES.company,
  repository: customerApi.company,
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  stepValidationMap,
  externalChanges: companyPriceListHasChanges,
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
          entityKey: 'price_list',
          formatter: (priceList) => `${priceList?.name}`,
          t,
        }),
      };
    });
    entityLiveStatus.value = company.active || false;
    companyGroups.value = extractCompanyGroupsFromTags(company.tags || []);
    const priceLists = company.priceLists || [];
    addedPriceLists.value = priceLists.filter(
      (pl) => !isOwnAccountPriceList(pl, company._id),
    );
    ownAccountPriceLists.value = priceLists.filter((pl) =>
      isOwnAccountPriceList(pl, company._id),
    );
    selectCompanyPriceList(company.channels?.[0]);

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
      // Canonicalize address order (billing first, shipping last) so the
      // unsaved-changes snapshot matches the order getAddresses() emits on
      // form sync — the API returns addresses in arbitrary order, which would
      // otherwise flag a false "unsaved changes" right after load (STU-224).
      addresses: entityData.addresses
        ? [...entityData.addresses].sort(
            (a, b) =>
              (a.addressType === 'shipping' ? 1 : 0) -
              (b.addressType === 'shipping' ? 1 : 0),
          )
        : entityData.addresses,
      salesReps: entityData.salesReps?.map((salesRep) => salesRep._id),
      // The account update keeps the company's own lists when `priceLists`
      // leaves them out, so only connected (shared) lists round-trip.
      priceLists: entityData.priceLists
        ?.filter(
          (priceList) => !isOwnAccountPriceList(priceList, entityData._id),
        )
        .map((priceList) => priceList._id),
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
// Intent: Page-level error handling for API fetch failures.
// handleFetchResult validates the initial data load and redirects on 404.

const { handleFetchResult } = usePageError({
  entity: ENTITIES.company,
  entityId: entityId.value,
  scope,
});

// =====================================================================================
// SALES REPS MANAGEMENT
// =====================================================================================
// Intent: Fetch and store user list for the sales rep selector.
// Users are fetched once on page load and used in the form dropdown and summary display.
const users = ref<User[]>([]);

const { data: usersData, error: usersError } = await useAsyncData<User[]>(
  'company-users',
  () => userApi.list(),
);

if (!usersError.value && Array.isArray(usersData.value)) {
  users.value = usersData.value.map((user) => ({
    ...user,
    name: fullName(user),
  }));
}

// =====================================================================================
// BUYERS MANAGEMENT
// =====================================================================================
// Intent: Manage the list of buyer contacts associated with this company.
// Includes table column setup, edit panel state, and buyer data transformations.
// Buyer CRUD operations happen via the side panel component (CompanyBuyerPanel).
const buyers = ref<CompanyBuyer[]>([]);
const buyersList = ref<CompanyBuyerList[]>([]);
const buyerPanelOpen = ref(false);
const buyerToEdit = ref<CompanyBuyerUpdate | undefined>();
const buyerPanelMode = ref<'edit' | 'add'>('add');
const columnOptions: ColumnOptions<CompanyBuyerList> = {
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
  useColumns<CompanyBuyerList>();

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
      onEdit: (entity: CompanyBuyerList) => {
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
// Intent: Manage the association of price lists to this company.
// addedPriceLists holds the connected lists (shared, or owned by another account)
// and syncs to entityDataUpdate.priceLists; the company's own account lists are
// kept apart in ownAccountPriceLists. Fetches all shared lists for the selector.

const { productApi } = useGeinsRepository();
const addedPriceLists = ref<CustomerPriceList[]>([]);
const ownAccountPriceLists = ref<CustomerPriceList[]>([]);
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
      entityKey: 'price_list',
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
  const { data, error } = await useAsyncData<ProductPriceList[]>(
    'company-price-lists',
    () => productApi.priceList.list(),
  );

  if (!data.value || error.value) {
    geinsLogError(
      `${t('failed_to_fetch_entity', { entityKey: 'price_list' }, 2)}`,
      error.value,
    );
  } else {
    allPriceLists.value = data.value;
  }
}

// The list endpoint never returns account lists, so a buyer's assigned
// account lists are added to the options or their chips would show raw ids.
const buyerPriceListOptions = computed<CustomerPriceList[]>(() => {
  const assigned =
    buyers.value.find((buyer) => buyer._id === buyerToEdit.value?._id)
      ?.priceLists ?? [];
  const missing = assigned.filter(
    (pl) => !allPriceLists.value.some((option) => option._id === pl._id),
  );
  return [...allPriceLists.value, ...missing];
});

// =====================================================================================
// COMPANY SET PRICES
// =====================================================================================
// Intent: The company's own account price list. v1 shows one list: the one in the
// company's default channel and currency. An ERP import's list (`readOnly`) shows
// locked with a read-only grid; rows load like the price list page — one unpaginated
// query, grouped per product, searched and paged client-side by TableView. Any other
// company gets a Studio-managed switch that "Save company" saves (saveCompanyPriceList).

const { transformProductsForList } = usePriceListProducts();
const { setupReadOnlyPriceListColumns, getPinnedState } =
  usePriceListProductsTable();
const { batchQueryNoPagination } = useBatchQuery();

const erpPriceList = computed(() =>
  companyPriceList.value?.readOnly ? companyPriceList.value : undefined,
);
// An inactive list stays folded, so its rows are only fetched when active.
const erpPriceListId = computed(() =>
  erpPriceList.value?.active ? erpPriceList.value._id : undefined,
);

const getDefaultCurrency = (channel?: string) =>
  channel ? accountStore.getCurrenciesByChannelId(channel)[0] : undefined;

const selectCompanyPriceList = (channel?: string) => {
  const currency = getDefaultCurrency(channel);
  const { priceList, fallback } = pickAccountPriceList(
    ownAccountPriceLists.value,
    channel,
    currency,
  );
  if (fallback) {
    geinsLogWarn(
      `no account price list for channel ${channel} / ${currency}, showing ${priceList?._id}`,
    );
  }
  companyPriceList.value = priceList;
  companyPriceListEnabled.value = priceList?.active ?? false;
};

// Runs before the company update, whose reload (`fields: all`) brings the new or
// changed list back. On failure the global API error toast says why and the save
// stops, so everything stays unsaved for a retry.
const saveCompanyPriceList = async (): Promise<boolean> => {
  const priceList = companyPriceList.value;
  const action = getCompanyPriceListSaveAction(
    priceList,
    companyPriceListEnabled.value,
  );
  if (action === 'none') return true;

  loading.value = true;
  try {
    if (!priceList) {
      const channel = entityData.value.channels?.[0] ?? '';
      const currency = getDefaultCurrency(channel) ?? '';
      companyPriceList.value = await productApi.priceList.create({
        name: companyPriceListName(entityData.value.name ?? '', currency),
        identifier: companyPriceListIdentifier(
          entityData.value.externalId,
          currency,
        ),
        channel,
        currency,
        wholesaleAccountId: entityId.value,
        active: true,
        exVat: true,
        // The list starts empty; `forced` has no effect on an account list.
        autoAddProducts: false,
        forced: false,
        dateCreated: '',
      });
    } else {
      const active = action === 'activate';
      await productApi.priceList.update(priceList._id, { active });
      // Kept locally too, so a failed company update can't re-send this on retry.
      companyPriceList.value = { ...priceList, active };
    }
    return true;
  } catch (error) {
    geinsLogError('error saving company price list:', error);
    return false;
  } finally {
    loading.value = false;
  }
};

const {
  data: companyPriceRows,
  error: companyPricesError,
  status: companyPricesStatus,
  refresh: refreshCompanyPrices,
} = useAsyncData(
  `company-set-prices-${entityId.value}`,
  async () => {
    if (!erpPriceListId.value) return [];
    const result = await productApi.priceList.id(erpPriceListId.value).query(
      batchQueryNoPagination.value,
      { fields: ['products', 'productinfo'] },
      // A failure shows inline as the table's error state.
      { suppressErrorToast: true },
    );
    return result.items ?? [];
  },
  { watch: [erpPriceListId], immediate: false, default: () => [] },
);

const companyPriceProducts = computed(() =>
  erpPriceList.value
    ? transformProductsForList(companyPriceRows.value, erpPriceList.value)
    : [],
);
const companyPriceVatDescription = computed(() =>
  erpPriceList.value?.exVat ? t('ex_vat') : t('inc_vat'),
);
const volumePricingOpen = ref(false);
const volumePricingProduct = ref<PriceListProductList>();
const companyPriceColumns = computed(() =>
  setupReadOnlyPriceListColumns(
    companyPriceProducts.value,
    companyPriceVatDescription.value,
    t('pricing.company_price'),
    ({ id }) => {
      volumePricingProduct.value = companyPriceProducts.value.find(
        (product) => product._id === id,
      );
      volumePricingOpen.value = true;
    },
  ),
);
// `immediate: false` leaves the status `idle` until the id watcher fires, so
// treat idle as loading too, or the empty state flashes first.
const companyPricesLoading = computed(
  () =>
    companyPricesStatus.value === 'idle' ||
    companyPricesStatus.value === 'pending',
);

// Summary of a Studio-managed list. The key follows the list id, so a list
// created on "Save company" is fetched once it exists. A background read: on
// failure the fold falls back to the list's `productCount` and hides the counts.
const studioPriceListId = computed(() =>
  companyPriceList.value && !companyPriceList.value.readOnly
    ? companyPriceList.value._id
    : undefined,
);
const { data: studioPriceListData, error: studioPriceListError } = useAsyncData(
  () => `company-set-prices-counts-${studioPriceListId.value ?? 'none'}`,
  async () => {
    if (!studioPriceListId.value) return null;
    return await productApi.priceList.get(
      studioPriceListId.value,
      { fields: ['counts'] },
      { suppressErrorToast: true },
    );
  },
  { default: () => null },
);
const studioPriceListCounts = computed(() =>
  studioPriceListError.value ? undefined : studioPriceListData.value,
);
const studioPriceListProductCount = computed(
  () =>
    studioPriceListCounts.value?.productCount ??
    companyPriceList.value?.productCount ??
    0,
);
const studioPriceListSummaryCounts = computed(() =>
  getPriceListSummaryCounts(studioPriceListCounts.value),
);

// No flag says an account's prices come from an external system, so an
// `externalId` is the hint: an import for the same channel and currency takes
// over a Studio-created list. Warn only; the switch stays usable.
const showExternalSystemWarning = computed(
  () => !erpPriceList.value && !!entityData.value.externalId?.trim(),
);
// Buyers restricted to their own lists never get the company's list.
const restrictedBuyerCount = computed(
  () =>
    buyers.value.filter((buyer) => buyer.restrictToDedicatedPriceLists).length,
);
const companySetPricesOn = computed(() =>
  erpPriceList.value
    ? erpPriceList.value.active
    : companyPriceListEnabled.value,
);
const showRestrictedBuyersNote = computed(
  () => companySetPricesOn.value && restrictedBuyerCount.value > 0,
);

// =====================================================================================
// ORDERS MANAGEMENT
// =====================================================================================
// Intent: Fetch and display orders for this company in a read-only tab.
// Delegates to useCompanyOrders composable for data fetching and column definitions.

const { ordersList, orderColumns, fetchOrders } = useCompanyOrders();

// =====================================================================================
// ADDRESS MANAGEMENT
// =====================================================================================
// Intent: CRUD operations for billing and shipping addresses within this company.
// Addresses are stored in entityDataUpdate.addresses and synced on save.
// Shipping address is optional and can be added/removed independently.
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
    title: t('entity_deleted', { entityKey: 'shipping_address' }),
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
// Intent: Page-specific action handlers for create/update workflows.
// These orchestrate validation, form resets, and entity persistence.
// Each handler validates relevant steps before proceeding.
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
  // Validate before the company list saves, so an invalid form saves nothing.
  const stepsValid = await validateSteps([1]);
  if (!stepsValid) {
    validateOnChange.value = true;
    return;
  }
  validateOnChange.value = false;
  if (!(await saveCompanyPriceList())) return;
  await updateEntity(undefined, { fields: ['all'] });
};

// =====================================================================================
// DELETE FUNCTIONALITY
// =====================================================================================
// Intent: Delete confirmation dialog wired to useDeleteDialog composable.
// Redirects to the list page after successful deletion.
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, entityListUrl);

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
// Intent: Computed data items displayed in the sidebar summary panel (ContentEditSummary).
// Builds DataItem arrays from entity state for quick-glance information across tabs.
const summary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  if (!createMode.value) {
    dataList.push({
      label: t('entity_id', { entityKey }),
      value: String(entityDataUpdate.value?._id),
      displayType: DataItemDisplayType.Copy,
    });
  }
  if (entityData.value?.name) {
    dataList.push({
      label: t('entity_name', { entityKey }),
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
      entityKey: 'sales_rep',
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
      entityKey: 'channel',
    });
  }
  if (companyGroups.value.length) {
    const displayValue = companyGroups.value.join(', ');
    dataList.push({
      label: t('customers.company_groups'),
      value: companyGroups.value,
      displayValue,
      displayType: DataItemDisplayType.Array,
      entityKey: 'company_group',
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
      .map((buyer: CompanyBuyer) => fullName(buyer))
      .join(', ');
    dataList.push({
      label: t('buyer', 2),
      value: entityData.value.buyers,
      displayValue,
      entityKey: 'buyer',
      displayType: DataItemDisplayType.Array,
    });
  }
  if (entityData.value?.priceLists?.length) {
    const displayValue = entityData.value.priceLists
      .map((pl: string) => getEntityNameById(pl, addedPriceLists.value))
      .join(', ');
    dataList.push({
      label: t('price_list', 2),
      value: entityData.value.priceLists,
      displayValue,
      entityKey: 'price_list',
      displayType: DataItemDisplayType.Array,
    });
  }
  if (ordersList.value.length) {
    dataList.push({
      label: t('order', 2),
      value: t('nr_of_entity', {
        count: ordersList.value.length,
        entityKey: 'order',
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
  entityKey,
  entityLiveStatus,
});

// =====================================================================================
// DATA LOADING FOR EDIT MODE
// =====================================================================================
// Intent: Initial data fetch when editing an existing entity (not in create mode).
// Uses useAsyncData for SSR-compatible fetching, then parseAndSaveData to hydrate form state.
// onMounted watchers depend on loaded data — keep watcher setup inside onMounted.
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
      // Account lists are missing from allPriceLists; add the company's for names.
      [
        ...allPriceLists.value,
        ...addedPriceLists.value,
        ...ownAccountPriceLists.value,
      ],
      undefined,
      buyers.value,
    );
  });
}
</script>

<template>
  <PriceListVolumePricingPanel
    v-if="erpPriceList"
    v-model:open="volumePricingOpen"
    readonly
    :rules="volumePricingProduct?.volumePricing ?? []"
    :product="volumePricingProduct"
    :product-id="volumePricingProduct?._id ?? ''"
    :product-name="volumePricingProduct?.name ?? ''"
    :price-list-id="erpPriceList._id"
    :currency="erpPriceList.currency"
    :vat-description="companyPriceVatDescription"
    :list-price-title="$t('pricing.company_price')"
  />
  <DialogUnsavedChanges
    v-model:open="unsavedChangesDialogOpen"
    :entity-key="entityKey"
    :loading="loading"
    @confirm="confirmLeave"
  />
  <DialogDelete
    v-model:open="deleteDialogOpen"
    :entity-key="entityKey"
    :loading="deleting"
    @confirm="confirmDelete"
  />
  <DialogDelete
    v-model:open="deleteAddressDialogOpen"
    entity-key="shipping_address"
    :loading="deleting"
    @confirm="confirmAddressDelete"
  />

  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-key="entityKey">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            :disabled="!hasUnsavedChanges || loading"
            @click="handleUpdateCompany"
          >
            {{ $t('save_entity', { entityKey }) }}
          </ButtonIcon>
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
                  <span>{{ $t('new_entity', { entityKey }) }}</span>
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="openDeleteDialog">
                <LucideTrash class="mr-2 size-4" />
                <span>{{ $t('delete_entity', { entityKey }) }}</span>
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
                      <FormLabel>
                        {{ $t('entity_name', { entityKey }) }}
                      </FormLabel>
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
                                    class="block max-w-75"
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
                                      >
                                        {{ $t('customers.veis') }}
                                      </a>
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
                      <FormLabel :optional="true">
                        {{ $t('customers.external_id') }}
                      </FormLabel>
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
                      <FormLabel :optional="true">
                        {{ $t('sales_rep', 2) }}
                      </FormLabel>
                      <FormControl>
                        <FormInputTagsSearch
                          :model-value="componentField.modelValue"
                          entity-key="sales_rep"
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
                      <FormLabel :optional="true">
                        {{ $t('customers.company_groups') }}
                      </FormLabel>
                      <FormControl>
                        <FormInputTagsSearch
                          :model-value="componentField.modelValue"
                          entity-key="company_group"
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
                      <Button variant="outline" size="sm">
                        {{ $t('edit') }}
                      </Button>
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
                          $t('add_entity', { entityKey: 'shipping_address' })
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
                      <Button variant="outline" size="sm">
                        {{ $t('edit') }}
                      </Button>
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
                {{ $t('create_entity', { entityKey }) }}
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
                <CompanyBuyerPanel
                  v-model:open="buyerPanelOpen"
                  :mode="buyerPanelMode"
                  :buyer="buyerToEdit"
                  :company-id="entityDataUpdate?._id || ''"
                  :company-name="entityDataUpdate.name || ''"
                  :price-lists="buyerPriceListOptions"
                >
                  <ButtonIcon
                    v-if="!createMode"
                    icon="new"
                    variant="outline"
                    size="sm"
                  >
                    {{ $t('add_entity', { entityKey: 'buyer' }) }}
                  </ButtonIcon>
                </CompanyBuyerPanel>
              </template>
              <div>
                <TableView
                  :mode="TableMode.Simple"
                  entity-key="buyer"
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
              :title="$t('customers.connected_price_lists')"
              :description="$t('customers.price_lists_description')"
            >
              <template #header-action>
                <SelectorQuickAdd
                  :entities="allPriceLists"
                  :selection="addedPriceListsIds"
                  entity-key="price_list"
                  :show-image="false"
                  class="sm:w-60! lg:w-96!"
                  @add="addPriceList($event)"
                  @remove="removePriceList($event)"
                />
              </template>
              <div>
                <TableView
                  :mode="TableMode.Simple"
                  entity-key="price_list"
                  :columns="priceListColumns"
                  :data="addedPriceLists"
                  :init-visibility-state="visibilityState"
                  :pinned-state="
                    viewport.isGreaterThan('xs') ? null : undefined
                  "
                />
              </div>
            </ContentEditCard>
            <ContentEditCard
              :create-mode="createMode"
              :title="$t('company_set_price', 2)"
              :description="$t('customers.company_set_prices_description')"
            >
              <div class="space-y-4">
                <Feedback v-if="showExternalSystemWarning" type="warning">
                  <template #title>
                    {{ $t('customers.company_set_prices_external_title') }}
                  </template>
                  <template #description>
                    {{
                      $t('customers.company_set_prices_external_description')
                    }}
                  </template>
                </Feedback>
                <Feedback v-if="showRestrictedBuyersNote" type="info">
                  <template #title>
                    {{
                      $t(
                        'customers.company_set_prices_restricted_buyers_title',
                        { count: restrictedBuyerCount },
                        restrictedBuyerCount,
                      )
                    }}
                  </template>
                  <template #description>
                    {{
                      $t(
                        'customers.company_set_prices_restricted_buyers_description',
                      )
                    }}
                  </template>
                </Feedback>
                <ContentSwitch
                  v-if="erpPriceList"
                  :checked="erpPriceList.active"
                  locked
                  :label="$t('customers.use_company_set_prices')"
                  :description="
                    $t('customers.company_set_prices_erp_description')
                  "
                  :disabled-tooltip="
                    $t('customers.company_set_prices_locked_tooltip')
                  "
                >
                  <div class="border-t pt-4">
                    <TableView
                      :mode="TableMode.Simple"
                      entity-key="product"
                      :columns="companyPriceColumns"
                      :data="companyPriceProducts"
                      :loading="companyPricesLoading"
                      :error="!!companyPricesError"
                      :on-retry="refreshCompanyPrices"
                      :empty-text="
                        $t('no_entity', { entityKey: 'company_set_price' }, 2)
                      "
                      :empty-description="
                        $t(
                          'empty_description',
                          { entityKey: 'company_set_price' },
                          2,
                        )
                      "
                      :page-size="20"
                      :pinned-state="getPinnedState"
                      :show-search="true"
                    />
                  </div>
                </ContentSwitch>
                <ContentSwitch
                  v-else
                  v-model:checked="companyPriceListEnabled"
                  :label="$t('customers.use_company_set_prices')"
                  :description="
                    $t('customers.company_set_prices_studio_description')
                  "
                >
                  <div class="border-t pt-4">
                    <Item class="p-0">
                      <ItemContent v-if="studioPriceListProductCount > 0">
                        <ItemTitle>
                          {{
                            $t(
                              'customers.company_set_prices_product_count',
                              { count: studioPriceListProductCount },
                              studioPriceListProductCount,
                            )
                          }}
                        </ItemTitle>
                        <ItemDescription v-if="studioPriceListSummaryCounts">
                          {{
                            $t('customers.company_set_prices_counts', {
                              manual: studioPriceListSummaryCounts.manual,
                              volume: studioPriceListSummaryCounts.volume,
                            })
                          }}
                        </ItemDescription>
                      </ItemContent>
                      <ItemContent v-else>
                        <ItemTitle>
                          {{ $t('no_entity_yet', { entityKey: 'product' }, 2) }}
                        </ItemTitle>
                        <ItemDescription>
                          {{
                            $t('customers.company_set_prices_empty_description')
                          }}
                        </ItemDescription>
                      </ItemContent>
                    </Item>
                  </div>
                </ContentSwitch>
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
                  entity-key="order"
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
                          class="block max-w-75"
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
                            >
                              {{ $t('customers.veis') }}
                            </a>
                          </template>
                        </i18n-t>
                      </p>
                      <ContentDataList
                        v-if="vatValid"
                        class="block max-w-75 pb-2"
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
