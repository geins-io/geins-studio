import type {
  PriceListContent,
  PriceListProduct,
  PriceListProductList,
  PriceListRule,
  PriceListRuleField,
  PriceListRuleMode,
  ProductPriceListUpdate,
} from '#shared/types';
import type { ColumnDef, Row } from '@tanstack/vue-table';
import type { MaybeRefOrGetter } from 'vue';

export interface UsePriceListEditorOptions {
  /** The edited list's `_id`; without one (a list not created yet) previews work out a new list. */
  priceListId: MaybeRefOrGetter<string | undefined>;
  /**
   * The list being edited. The editor reads its `channel`, `currency` and
   * `exVat`, and writes `rules`, `productSelectionQuery` and `products`.
   */
  draft: Ref<ProductPriceListUpdate>;
  /** An ERP-managed list: saved rows load read-only, nothing is editable. */
  readOnly?: MaybeRefOrGetter<boolean>;
  /** Called after a preview rebuilt the saved rows — the host's clean baseline. */
  onSynced?: () => void;
  /** Title of the grid's list price column; defaults to the price list price. */
  listPriceTitle?: string;
}

export interface UsePriceListEditorReturnType {
  // State
  readOnly: ComputedRef<boolean>;
  priceListId: ComputedRef<string>;
  listPriceTitle: string;
  currency: ComputedRef<string | undefined>;
  vatDescription: ComputedRef<string>;
  productSelection: Ref<SelectorSelectionQueryBase>;
  productSelector: Ref<{ removeFromManuallySelected: (id: string) => void }>;
  editedProducts: Ref<PriceListProduct[]>;
  selectedProducts: Ref<PriceListProductList[]>;
  hasProductSelection: ComputedRef<boolean>;
  columns: Ref<ColumnDef<PriceListProductList>[]>;
  pinnedState: ComputedRef<{ left: never[]; right: string[] }>;
  /** Bumps when a seed brings in another list; key the `Selector` on it. */
  seedVersion: Ref<number>;
  /** Set by the host while it saves, so the re-seed doesn't preview again. */
  saving: Ref<boolean>;
  content: ComputedRef<PriceListContent>;
  isDirty: ComputedRef<boolean>;

  // Read-only rows
  readOnlyRowsLoading: ComputedRef<boolean>;
  readOnlyRowsError: Ref<unknown>;
  loadReadOnlyRows: () => Promise<void>;
  volumePricingOpen: Ref<boolean>;
  volumePricingProduct: Ref<PriceListProductList | undefined>;

  // Base rule
  priceListBaseRuleMode: Ref<PriceListRuleMode>;
  priceListBaseRuleInput: Ref<number | undefined>;
  baseRule: ComputedRef<PriceListRule | undefined>;
  baseRuleMode: ComputedRef<'margin' | 'discount' | null>;
  baseRulePercentage: ComputedRef<number | null>;
  baseRuleText: ComputedRef<string>;
  baseRuleLoading: Ref<boolean>;
  handleApplyBaseRule: () => void;
  handleApplyBaseRuleAndOverwrite: () => void;
  removeBaseRule: () => Promise<void>;

  // Volume pricing
  quantityLevelRules: ComputedRef<PriceListRule[]>;
  volumePricingLoading: Ref<boolean>;
  priceListRulesMode: ComputedRef<PriceListRuleMode>;
  applyRule: (rule: PriceListRule) => Promise<void>;
  applyAndOverwriteRule: (rule: PriceListRule) => Promise<void>;
  removeRule: (rule: PriceListRule) => Promise<void>;
  rulesToEdit: Ref<PriceListRule[]>;
  rulesPanelOpen: Ref<boolean>;
  rulesProductId: Ref<string>;
  rulesProductName: Ref<string>;
  /** The row whose price breaks the panel edits; its base for local prices without an id. */
  rulesProduct: ComputedRef<PriceListProductList | undefined>;
  handleSaveRules: (rules: PriceListRule[]) => void;

  // Prompts
  overwriteBaseRulePromptVisible: Ref<boolean>;
  overwriteLevelsPromptVisible: Ref<boolean>;
  currentOverwriteQuantity: Ref<number>;
  overwriteContinueAction: Ref<() => void>;
  removeBaseRulePromptVisible: Ref<boolean>;
  rulesModeChangePrompt: Ref<boolean>;
  pendingModeChange: Ref<PriceListRuleMode | null>;
  confirmModeChange: () => Promise<void>;
  cancelModeChange: () => void;

  // Lifecycle
  seed: (
    list: Pick<ProductPriceListUpdate, 'rules' | 'productSelectionQuery'>,
  ) => void;
  load: () => Promise<void>;
  afterSave: () => Promise<void>;
  captureBaseline: () => void;
}

/**
 * The "Products & pricing" editor of a price list — rules, product selection
 * and the editable grid — taking its list as input so any page can host it.
 * Render it with `<PriceListEditor :editor>`. Call it in the host's setup (not
 * inside a lazily mounted tab): the first preview sets the host's baseline.
 */
export function usePriceListEditor({
  priceListId,
  draft,
  readOnly,
  onSynced,
  listPriceTitle,
}: UsePriceListEditorOptions): UsePriceListEditorReturnType {
  const { t } = useI18n();
  const priceColumnTitle = listPriceTitle ?? t('pricing.price_list_price');
  const { productApi } = useGeinsRepository();
  const productsStore = useProductsStore();

  const id = computed(() => toValue(priceListId) ?? '');
  const isReadOnly = computed(() => toValue(readOnly) ?? false);
  const currency = computed(() => draft.value.currency);
  const vatDescription = computed(() =>
    draft.value.exVat ? t('ex_vat') : t('inc_vat'),
  );

  // =====================================================================================
  // STATE
  // =====================================================================================
  const { getEmptyQuerySelectionBase } = useSelector();
  const productSelection = ref<SelectorSelectionQueryBase>(
    getEmptyQuerySelectionBase(),
  );
  const productSelector = ref();

  const priceListBaseRuleMode = ref<PriceListRuleMode>('discount');
  const priceListBaseRuleInput = ref<number>();

  const editedProducts = ref<PriceListProduct[]>([]);

  const volumePricingOpen = ref(false);
  const volumePricingProduct = ref<PriceListProductList>();

  const seedVersion = ref(0);
  const saving = ref(false);

  // =====================================================================================
  // PRODUCTS GRID
  // =====================================================================================
  const {
    transformProductsForList,
    getPriceListProduct,
    addToPriceListProducts,
    convertPriceModeToRuleField,
  } = usePriceListProducts();

  const {
    setupPriceListColumns,
    setupReadOnlyPriceListColumns,
    getPinnedState,
  } = usePriceListProductsTable();

  const columns = shallowRef<ColumnDef<PriceListProductList>[]>([]);
  const pinnedState = computed(() => getPinnedState.value);

  const cellEditCallback = (
    value: string | number,
    row: Row<PriceListProductList>,
    field: PriceListRuleField,
  ) => {
    addToPriceListProducts(
      getPriceListProduct(row.original._id, Number(value), field),
      editedProducts.value,
    );
    previewPriceList(
      t('price_updated_for', { name: row.original.name, id: row.original._id }),
    );
  };

  const setupColumns = () => {
    if (isReadOnly.value) {
      columns.value = setupReadOnlyPriceListColumns(
        selectedProducts.value,
        vatDescription.value,
        priceColumnTitle,
        ({ id }) => {
          volumePricingProduct.value = selectedProducts.value.find(
            (product) => product._id === id,
          );
          volumePricingOpen.value = true;
        },
      );
      return;
    }
    columns.value = setupPriceListColumns(
      selectedProducts.value,
      vatDescription.value,
      (payload) => {
        // On edit volume pricing
        const rules = selectedProducts.value.find(
          (p) => p._id === payload.id,
        )?.volumePricing;
        // Filter out quantity 1 rules before editing
        rulesToEdit.value = rules
          ? rules.filter((rule) => rule.quantity !== 1)
          : [];
        rulesProductId.value = payload.id;
        rulesProductName.value = payload.name;
        rulesPanelOpen.value = true;
      },
      (id: string) => productSelector.value.removeFromManuallySelected(id),
      (value: string | number, row: Row<PriceListProductList>) => {
        cellEditCallback(value, row, 'price');
      },
      (value: string | number, row: Row<PriceListProductList>) => {
        cellEditCallback(value, row, 'margin');
      },
      (value: string | number, row: Row<PriceListProductList>) => {
        cellEditCallback(value, row, 'discountPercent');
      },
      priceColumnTitle,
    );
  };

  // `sync`: an overwrite replaces the rows right before a preview reads the draft.
  watch(
    editedProducts,
    (newVal) => {
      draft.value.products = newVal;
    },
    { deep: true, flush: 'sync' },
  );

  watch(vatDescription, () => {
    setupColumns();
  });

  // =====================================================================================
  // PREVIEW
  // =====================================================================================
  const { selectedProducts, hasProductSelection, previewPriceList } =
    usePriceListPreview({
      entityId: id,
      entityDataUpdate: draft,
      transformProductsForList,
      setupColumns,
      onUpdateProducts: async (editedProductsList) => {
        editedProducts.value = editedProductsList;
        await nextTick();
        onSynced?.();
      },
      convertPriceModeToRuleField,
      getPriceListProduct,
    });

  // =====================================================================================
  // READ-ONLY ROWS
  // =====================================================================================
  // A read-only list has nothing to preview, so its saved rows load read-only
  // (an ERP list may have no selection query to preview from).
  const { batchQueryNoPagination } = useBatchQuery();
  const {
    data: readOnlyRows,
    error: readOnlyRowsError,
    status: readOnlyRowsStatus,
    execute: loadReadOnlyRows,
  } = useAsyncData(
    () => `price-list-rows-${id.value}`,
    async () => {
      if (!id.value) return [];
      const result = await productApi.priceList.id(id.value).query(
        batchQueryNoPagination.value,
        { fields: ['products', 'productinfo'] },
        // A failure shows inline as the table's error state.
        { suppressErrorToast: true },
      );
      return result.items ?? [];
    },
    { immediate: false, default: () => [] },
  );
  // `immediate: false` leaves the status `idle` until the load starts.
  const readOnlyRowsLoading = computed(
    () =>
      isReadOnly.value &&
      (readOnlyRowsStatus.value === 'idle' ||
        readOnlyRowsStatus.value === 'pending'),
  );

  watch(readOnlyRows, (rows) => {
    selectedProducts.value = transformProductsForList(rows, draft.value);
    setupColumns();
  });

  // =====================================================================================
  // RULES & VOLUME PRICING
  // =====================================================================================
  const {
    globalRules,
    baseRuleLoading,
    volumePricingLoading,
    quantityLevelRules,
    baseRule,
    baseRuleMode,
    baseRulePercentage,
    baseRuleText,
    applyBaseRule,
    applyBaseRuleAndOverwrite,
    removeBaseRule,
    applyRule,
    applyAndOverwriteRule,
    removeRule,
    updateEntityRules,
    overwriteBaseRulePromptVisible,
    overwriteLevelsPromptVisible,
    currentOverwriteQuantity,
    overwriteContinueAction,
    removeBaseRulePromptVisible,
  } = usePriceListRules({
    entityDataUpdate: draft,
    editedProducts,
    previewPriceList,
  });

  const {
    rulesToEdit,
    rulesPanelOpen,
    rulesProductId,
    rulesProductName,
    actualPriceListRulesMode,
    pendingModeChange,
    rulesModeChangePrompt,
    priceListRulesMode,
    handleSaveRules,
    confirmModeChange,
    cancelModeChange,
  } = usePriceListVolumePricing({
    globalRules,
    updateEntityRules,
    previewPriceList,
  });
  const rulesProduct = computed(() =>
    selectedProducts.value.find((p) => p._id === rulesProductId.value),
  );

  const handleApplyBaseRule = () => {
    if (priceListBaseRuleInput.value === undefined) return;
    const percentage = priceListBaseRuleInput.value;
    const mode = priceListBaseRuleMode.value;
    applyBaseRule(percentage, mode);
    priceListBaseRuleInput.value = undefined;
  };

  const handleApplyBaseRuleAndOverwrite = () => {
    if (priceListBaseRuleInput.value === undefined) return;
    const percentage = priceListBaseRuleInput.value;
    const mode = priceListBaseRuleMode.value;
    applyBaseRuleAndOverwrite(percentage, mode);
    priceListBaseRuleInput.value = undefined;
  };

  // =====================================================================================
  // DIRTY STATE
  // =====================================================================================
  // For hosts without useEntityEdit's snapshot over the whole list.
  const content = computed<PriceListContent>(() => ({
    rules: draft.value.rules,
    productSelectionQuery: draft.value.productSelectionQuery,
    products: draft.value.products,
  }));
  const { isDirty, captureBaseline } = usePanelDirty(content);

  // =====================================================================================
  // LIFECYCLE
  // =====================================================================================
  // Off until `load()`, so seeding the selection doesn't preview it again.
  let selectionWatched = false;
  watch(
    productSelection,
    async (newSelection) => {
      if (!selectionWatched || saving.value) return;

      draft.value.productSelectionQuery = newSelection;

      await previewPriceList(t('product_selection_updated'));
    },
    { deep: true },
  );

  let seeded = false;
  let seededListId: string | undefined;

  const seed: UsePriceListEditorReturnType['seed'] = (list) => {
    if (list.productSelectionQuery) {
      productSelection.value = list.productSelectionQuery;
    }
    if (list.rules && list.rules.length) {
      const volumePricing = list.rules.filter(
        (r) => r.quantity && r.quantity > 1,
      );
      const listBaseRule = list.rules.find((r) => r.quantity === 1);
      actualPriceListRulesMode.value = volumePricing[0]?.margin
        ? 'margin'
        : 'discount';
      priceListBaseRuleMode.value = listBaseRule?.margin
        ? 'margin'
        : 'discount';

      globalRules.value = list.rules.map((rule) => ({
        _id: rule._id,
        internalId: generateInternalId(),
        quantity: rule.quantity,
        ...(rule.margin && { margin: rule.margin }),
        ...(rule.discountPercent && { discountPercent: rule.discountPercent }),
        applied: true,
        global: true,
      }));
    }
    // The Selector reads its selection once: remount it for another list, but
    // keep it (and the grid's search) when a save re-seeds the same one.
    if (!seeded || id.value !== seededListId) seedVersion.value++;
    seeded = true;
    seededListId = id.value;
  };

  const load = async () => {
    if (isReadOnly.value) {
      productsStore.init();
      await loadReadOnlyRows();
      return;
    }
    if (draft.value.productSelectionQuery) {
      await previewPriceList(undefined, true, false);
    }
    productsStore.init();
    selectionWatched = true;
  };

  // Rebuilds the saved rows (and the baseline, via `onSynced`) from the saved list.
  const afterSave = async () => {
    if (hasProductSelection.value) {
      await previewPriceList(undefined, true, false);
    }
  };

  return {
    readOnly: isReadOnly,
    priceListId: id,
    listPriceTitle: priceColumnTitle,
    currency,
    vatDescription,
    productSelection,
    productSelector,
    editedProducts,
    selectedProducts,
    hasProductSelection,
    columns,
    pinnedState,
    seedVersion,
    saving,
    content,
    isDirty,

    readOnlyRowsLoading,
    readOnlyRowsError,
    loadReadOnlyRows,
    volumePricingOpen,
    volumePricingProduct,

    priceListBaseRuleMode,
    priceListBaseRuleInput,
    baseRule,
    baseRuleMode,
    baseRulePercentage,
    baseRuleText,
    baseRuleLoading,
    handleApplyBaseRule,
    handleApplyBaseRuleAndOverwrite,
    removeBaseRule,

    quantityLevelRules,
    volumePricingLoading,
    priceListRulesMode,
    applyRule,
    applyAndOverwriteRule,
    removeRule,
    rulesToEdit,
    rulesPanelOpen,
    rulesProductId,
    rulesProductName,
    rulesProduct,
    handleSaveRules,

    overwriteBaseRulePromptVisible,
    overwriteLevelsPromptVisible,
    currentOverwriteQuantity,
    overwriteContinueAction,
    removeBaseRulePromptVisible,
    rulesModeChangePrompt,
    pendingModeChange,
    confirmModeChange,
    cancelModeChange,

    seed,
    load,
    afterSave,
    captureBaseline,
  };
}
