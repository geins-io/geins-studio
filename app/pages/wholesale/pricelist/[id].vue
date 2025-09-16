<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import type { AcceptableValue } from 'reka-ui';
import { useToast } from '@/components/ui/toast/use-toast';
import type { ColumnDef, Row } from '@tanstack/vue-table';
import {
  SelectorSelectionStrategy,
  type PricelistRuleMode,
  type PricelistProductList,
  type PricelistRule,
  type PricelistProduct,
  type PricelistRuleField,
} from '#shared/types';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const route = useRoute();
const { t } = useI18n();
const { $geinsApi } = useNuxtApp();
const accountStore = useAccountStore();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog('pages/wholesale/pricelist/[id].vue');

const productsStore = useProductsStore();
const { products } = storeToRefs(productsStore);

// =====================================================================================
// API & REPOSITORY SETUP
// =====================================================================================
const { productApi } = useGeinsRepository();
const { channels, currentCurrencies, currentChannelId, currentCurrency } =
  storeToRefs(accountStore);

// =====================================================================================
// FORM VALIDATION SCHEMA
// =====================================================================================
const formSchema = toTypedSchema(
  z.object({
    vat: z.object({
      exVat: z.boolean().optional(),
    }),
    default: z.object({
      name: z.string().min(1, t('entity_required', { entityName: 'name' })),
      channel: z
        .string()
        .min(1, t('entity_required', { entityName: 'channel' })),
      currency: z
        .string()
        .min(1, t('entity_required', { entityName: 'currency' })),
      forced: z.boolean().optional(),
      autoAddProducts: z.boolean().optional(),
    }),
  }),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
const entityBase: ProductPricelistCreate = {
  name: '',
  active: false,
  channel: currentChannelId.value || '',
  currency: currentCurrency.value || '',
  dateCreated: '',
  exVat: true,
  autoAddProducts: true,
  forced: true,
  products: [],
  rules: [],
  productSelectionQuery: undefined,
};

// =====================================================================================
// UI STATE MANAGEMENT
// =====================================================================================
// Tabs & Steps
const currentTab = ref(0);
const tabs = [t('general'), t('wholesale.pricelist_products_pricing')];
const showSidebar = computed(() => {
  return currentTab.value === 0;
});

const totalCreateSteps = 2;
const { currentStep, nextStep, previousStep } =
  useStepManagement(totalCreateSteps);
const stepValidationMap: Record<number, string> = {
  1: 'vat',
  2: 'default',
};

// Currency selection
const selectableCurrencies = ref(currentCurrencies.value.map((i) => i._id));

// Product selection
const { getEmptyQuerySelectionBase } = useSelector();
const productSelection = ref<SelectorSelectionQueryBase>(
  getEmptyQuerySelectionBase(),
);
const productSelector = ref();

// Pricelist products
const pricelistProducts = ref<PricelistProduct[]>([]);
const editedProducts = ref<PricelistProduct[]>([]);

// Pricelist rules
const pricelistBaseRuleMode = ref<PricelistRuleMode>('discount');
// Track the actual mode and pending mode separately
const actualPricelistRulesMode = ref<PricelistRuleMode>('discount');
const pendingModeChange = ref<PricelistRuleMode | null>(null);

const pricelistBaseRuleInput = ref<number>();

// =====================================================================================
// PRODUCT & PRICING COMPOSABLES
// =====================================================================================
const {
  transformProductsForList,
  getPricelistProduct,
  getNewPricelistProducts,
  addToPricelistProducts,
  convertPriceModeToRuleField,
} = usePricelistProducts();

const { setupPricelistColumns, getPinnedState } = usePricelistProductsTable();

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
  entityDataCreate,
  entityDataUpdate,
  entityData,
  entityPageTitle,
  entityLiveStatus,
  refreshEntityData,
  form,
  formValid,
  formTouched,
  hasUnsavedChanges,
  unsavedChangesDialogOpen,
  validateOnChange,
  setOriginalSavedData,
  confirmLeave,
  createEntity,
  updateEntity,
  deleteEntity,
  parseAndSaveData,
} = useEntityEdit<
  ProductPricelistBase,
  ProductPricelist,
  ProductPricelistCreate,
  ProductPricelistUpdate
>({
  repository: productApi.pricelist,
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  stepValidationMap,
  getInitialFormValues: (entityData) => ({
    vat: {
      exVat: entityData.exVat,
    },
    default: {
      name: entityData.name || '',
      channel: entityData.channel || '',
      currency: entityData.currency || '',
      forced: entityData.forced,
      autoAddProducts: entityData.autoAddProducts,
    },
  }),
  reshapeEntityData: (entityData) => ({
    ...entityData,
    products: [],
    rules: (entityData.rules || []).map((rule) => ({
      _id: rule._id,
      quantity: rule.quantity,
      ...(rule.margin && { margin: rule.margin }),
      ...(rule.discountPercent && { discountPercent: rule.discountPercent }),
    })),
  }),
  parseEntityData: (entity) => {
    entityLiveStatus.value = entity.active;
    if (entity.productSelectionQuery) {
      productSelection.value = entity.productSelectionQuery;
    }
    if (entity.rules && entity.rules.length) {
      const quantityLevels = entity.rules.filter(
        (r) => r.quantity && r.quantity > 1,
      );
      const firstRuleMargin = quantityLevels[0]?.margin;
      pricelistRulesMode.value = firstRuleMargin ? 'margin' : 'discount';

      globalRules.value = entity.rules.map((rule) => ({
        _id: rule._id,
        internalId: generateInternalId(),
        quantity: rule.quantity,
        ...(rule.margin && { margin: rule.margin }),
        ...(rule.discountPercent && { discountPercent: rule.discountPercent }),
        applied: true,
        global: true,
      }));
    }
    form.setValues({
      vat: {
        exVat: entity.exVat,
      },
      default: {
        name: entity.name || '',
        channel: entity.channel || '',
        currency: entity.currency || '',
        forced: entity.forced,
        autoAddProducts: entity.autoAddProducts,
      },
    });
  },
  prepareCreateData: (formData) => ({
    ...entityBase,
    ...formData.vat,
    ...formData.default,
  }),
  prepareUpdateData: (formData, entity) => ({
    ...entity,
    ...formData.vat,
    ...formData.default,
  }),
  onFormValuesChange: (values) => {
    const targetEntity = createMode.value ? entityDataCreate : entityDataUpdate;
    targetEntity.value = {
      ...entityData.value,
      ...values.vat,
      ...values.default,
    };
  },
});

// =====================================================================================
// PREVIEW PRICELIST
// =====================================================================================
const { batchQueryAll } = useBatchQuery();
const updateInProgress = ref(false);

const previewPricelist = async (
  feedbackMessage: string = 'Pricelist preview updated.',
  updateProducts: boolean = false,
  showFeedback: boolean = true,
) => {
  if (
    !entityId.value ||
    !entityDataUpdate.value.productSelectionQuery ||
    updateInProgress.value
  )
    return;
  try {
    updateInProgress.value = true;
    const previewPricelist = await productApi.pricelist
      .id(entityId.value)
      .preview(entityDataUpdate.value, batchQueryAll.value, {
        fields: ['products', 'productinfo'],
      });

    pricelistProducts.value = previewPricelist.products?.items || [];

    if (updateProducts) {
      editedProducts.value = pricelistProducts.value
        .filter((p) => p.priceMode !== 'rule' && p.priceMode !== 'auto')
        .map((p) => {
          const priceMode = convertPriceModeToRuleField(p.priceMode);
          const value = priceMode ? Number(p[priceMode]) || null : null;
          const product = getPricelistProduct(
            p.productId,
            value,
            priceMode,
            p.staggeredCount,
          );
          return {
            _id: p._id,
            ...product,
          };
        });
      await nextTick();
      setOriginalSavedData();
    }
    selectedProducts.value = transformProductsForList(
      pricelistProducts.value,
      entityData.value,
    );
    setupColumns();
    if (showFeedback) {
      toast({
        title: feedbackMessage,
        variant: 'positive',
      });
    }
  } catch (error) {
    geinsLogError('error fetching preview pricelist:', error);
    toast({
      title: t('feedback_error'),
      description: t('feedback_error_description'),
      variant: 'negative',
    });
  } finally {
    updateInProgress.value = false;
  }
};

// =====================================================================================
// GLOBAL PRICELIST RULES
// =====================================================================================

const globalRules = ref<PricelistRule[]>([]);
const baseRuleLoading = ref<boolean>(false);
const quantityLevelsLoading = ref<boolean>(false);

// Computed property to get only quantity levels (exclude base rule with quantity 1)
const quantityLevelRules = computed(() => {
  return globalRules.value.filter((rule) => rule.quantity !== 1);
});

const baseRule = computed(() => {
  return globalRules.value.find((rule) => rule.quantity === 1);
});

const baseRuleMode = computed(() => {
  if (!baseRule.value) return null;
  return baseRule.value.margin !== undefined && baseRule.value.margin !== null
    ? 'margin'
    : 'discount';
});

const baseRulePercentage = computed(() => {
  if (!baseRule.value) return null;
  return baseRuleMode.value === 'margin'
    ? baseRule.value.margin
    : baseRule.value.discountPercent;
});

const baseRuleText = computed(() => {
  if (!baseRule.value) return '';
  return `${baseRulePercentage.value}% ${baseRuleMode.value} applied globally`;
});

const handleApplyBaseRule = () => {
  if (pricelistBaseRuleInput.value === undefined || !entityId.value) return;
  const percentage = pricelistBaseRuleInput.value;
  const mode = pricelistBaseRuleMode.value;
  applyBaseRule(percentage, mode);
};

const handleApplyBaseRuleAndOverwrite = () => {
  if (pricelistBaseRuleInput.value === undefined || !entityId.value) return;
  const percentage = pricelistBaseRuleInput.value;
  const mode = pricelistBaseRuleMode.value;
  applyBaseRuleAndOverwrite(percentage, mode);
};

const applyBaseRule = async (
  percentage: number,
  mode: PricelistRuleMode,
): Promise<void> => {
  baseRuleLoading.value = true;
  try {
    // Create global rule for quantity 1
    const globalRule: PricelistRule = {
      quantity: 1,
      ...(mode === 'margin' && { margin: percentage }),
      ...(mode === 'discount' && { discountPercent: percentage }),
    };

    if (!!baseRule.value) {
      globalRule._id = baseRule.value._id;
    }

    globalRules.value = globalRules.value.filter((rule) => rule.quantity !== 1);
    globalRules.value.push(globalRule);

    await updateEntityRules();
    await previewPricelist(`${percentage}% ${mode} applied globally`);
    pricelistBaseRuleInput.value = undefined;
  } catch (error) {
    geinsLogError('error applying base rule:', error);
    toast({
      title: t('feedback_error'),
      description: t('feedback_error_description'),
      variant: 'negative',
    });
  } finally {
    baseRuleLoading.value = false;
  }
};

const applyBaseRuleAndOverwrite = async (
  percentage: number,
  mode: PricelistRuleMode,
): Promise<void> => {
  if (entityDataUpdate.value.products) {
    overwriteBaseRulePromptVisible.value = true;
    overwriteContinueAction.value = async () => {
      overwriteBaseRulePromptVisible.value = false;
      await overwriteProducts(1);
      await applyBaseRule(percentage, mode);
    };
    return;
  }
  await applyBaseRule(percentage, mode);
};

const removeBaseRule = async () => {
  if (!baseRule.value) return;
  const feedback = `${baseRulePercentage.value}% ${baseRuleMode.value} removed`;
  globalRules.value = globalRules.value.filter((rule) => rule.quantity !== 1);
  entityDataUpdate.value.rules = globalRules.value;
  removeBaseRulePromptVisible.value = false;
  await previewPricelist(feedback);
};

const applyRule = async (rule: PricelistRule): Promise<void> => {
  quantityLevelsLoading.value = true;
  let ruleIndex = -1;
  try {
    // Find existing rule index by internal ID first, then by _id
    const existingRuleIndex = globalRules.value.findIndex(
      (r) =>
        (rule.internalId && r.internalId === rule.internalId) ||
        (rule._id && r._id === rule._id),
    );

    if (existingRuleIndex !== -1) {
      // Update existing rule in place to preserve order
      globalRules.value[existingRuleIndex] = { ...rule, global: true };
      ruleIndex = existingRuleIndex;
    } else {
      // Add new rule at the end
      globalRules.value.push({ ...rule, global: true });
      ruleIndex = globalRules.value.length - 1;
    }

    await updateEntityRules();
    await previewPricelist('Quantity level applied globally');
  } catch (error) {
    geinsLogError('error applying rules:', error);
    toast({
      title: t('feedback_error'),
      description: t('feedback_error_description'),
      variant: 'negative',
    });
  } finally {
    quantityLevelsLoading.value = false;
    const ruleToUpdate = globalRules.value[ruleIndex];
    if (ruleToUpdate) {
      ruleToUpdate.applied = true;
    }
  }
};

const applyAndOverwriteRule = async (rule: PricelistRule): Promise<void> => {
  if (entityDataUpdate.value.products) {
    currentOverwriteQuantity.value = Number(rule.quantity);
    overwriteLevelsPromptVisible.value = true;
    overwriteContinueAction.value = async () => {
      overwriteLevelsPromptVisible.value = false;
      await overwriteProducts(currentOverwriteQuantity.value);
      await applyRule(rule);
    };
    return;
  }
  await applyRule(rule);
};

const removeRule = async (rule: PricelistRule): Promise<void> => {
  globalRules.value = globalRules.value.filter(
    (r) =>
      !(
        (rule.internalId && r.internalId === rule.internalId) ||
        (rule._id && r._id === rule._id)
      ),
  );
  await updateEntityRules();
  await previewPricelist('Quantity level removed.');
};

const updateEntityRules = async (): Promise<void> => {
  // Preserve existing quantity 1 rule if it exists and isn't in newRules
  const existingQuantity1Rule = entityDataUpdate.value.rules?.find(
    (rule) => rule.quantity === 1,
  );
  const hasQuantity1InNewRules = globalRules.value.some(
    (rule) => rule.quantity === 1,
  );

  // Start with globalRules and remove internal IDs
  const newRules: PricelistRule[] = globalRules.value.map((rule) => {
    const { internalId, ...cleanRule } = rule;
    return {
      _id: cleanRule._id,
      quantity: cleanRule.quantity,
      ...(cleanRule.margin && { margin: cleanRule.margin }),
      ...(cleanRule.discountPercent && {
        discountPercent: cleanRule.discountPercent,
      }),
    };
  });

  // Add back the quantity 1 rule if it existed and wasn't replaced
  if (existingQuantity1Rule && !hasQuantity1InNewRules) {
    newRules.push(existingQuantity1Rule);
  }

  entityDataUpdate.value.rules = newRules;
};

// RULES PROMPTS

const overwriteBaseRulePromptVisible = ref(false);
const overwriteLevelsPromptVisible = ref(false);
const currentOverwriteQuantity = ref<number>(1);
const overwriteContinueAction = ref(() => {});
const removeBaseRulePromptVisible = ref(false);

const overwriteProducts = async (staggeredCount: number) => {
  // Remove products with the specified staggeredCount
  entityDataUpdate.value.products =
    entityDataUpdate.value.products?.map((product: PricelistProduct) => {
      if (product.staggeredCount === staggeredCount) {
        return {
          productId: product.productId,
          staggeredCount: product.staggeredCount,
        };
      }
      return product;
    }) || [];
};

// =====================================================================================
// PRODUCT QUANTITY LEVELS MANAGEMENT
// =====================================================================================
const rulesToEdit = ref<PricelistRule[]>([]);
const rulesPanelOpen = ref(false);
const rulesProductId = ref<string>('');
const rulesProductName = ref<string>('');

// Prompt
const rulesModeChangePrompt = ref(false);

const handleSaveRules = (_rules: PricelistRule[]) => {
  previewPricelist(
    `Quantity levels applied for ${rulesProductName.value} (${rulesProductId.value})`,
  );
};

// Use a computed for the displayed mode
const pricelistRulesMode = computed({
  get: () => actualPricelistRulesMode.value,
  set: (newMode: PricelistRuleMode) => {
    if (
      newMode !== actualPricelistRulesMode.value &&
      globalRules.value.length
    ) {
      if (
        globalRules.value.length === 1 &&
        globalRules.value[0]?.quantity === 1
      ) {
        actualPricelistRulesMode.value = newMode;
        return;
      }

      pendingModeChange.value = newMode;
      rulesModeChangePrompt.value = true;
    } else {
      actualPricelistRulesMode.value = newMode;
    }
  },
});

const confirmModeChange = async () => {
  rulesModeChangePrompt.value = false;
  if (pendingModeChange.value) {
    actualPricelistRulesMode.value = pendingModeChange.value;
    pendingModeChange.value = null;
    globalRules.value = globalRules.value.filter((rule) => rule.quantity === 1);
    await updateEntityRules();
    previewPricelist();
  }
};

const cancelModeChange = () => {
  rulesModeChangePrompt.value = false;
  pendingModeChange.value = null;
};

// =====================================================================================
// PRODUCTS STATE
// =====================================================================================
const selectedProducts = ref<PricelistProductList[]>([]);

const hasProductSelection = computed(() => {
  return selectedProducts.value.length > 0;
});

const vatDescription = computed(() => {
  return entityData.value?.exVat ? t('ex_vat') : t('inc_vat');
});

let columns: ColumnDef<PricelistProductList>[] = [];
const pinnedState = ref(getPinnedState());

// =====================================================================================
// COLUMN SETUP FUNCTIONS
// =====================================================================================
const cellEditCallback = (
  value: string | number,
  row: Row<PricelistProductList>,
  field: PricelistRuleField,
) => {
  addToPricelistProducts(
    getPricelistProduct(row.original._id, Number(value), field),
    editedProducts.value,
  );
  previewPricelist(
    `Price updated for ${row.original.name} (${row.original._id})`,
  );
};

const setupColumns = () => {
  columns = setupPricelistColumns(
    selectedProducts.value,
    vatDescription.value,
    (payload) => {
      // On edit quantity levels
      const rules = selectedProducts.value.find(
        (p) => p._id === payload.id,
      )?.quantityLevels;
      // Filter out quantity 1 rules before editing
      rulesToEdit.value = rules
        ? rules.filter((rule) => rule.quantity !== 1)
        : [];
      rulesProductId.value = payload.id;
      rulesProductName.value = payload.name;
      rulesPanelOpen.value = true;
    },
    (id: string) => productSelector.value.removeFromManuallySelected(id),
    (value: string | number, row: Row<PricelistProductList>) => {
      cellEditCallback(value, row, 'price');
    },
    (value: string | number, row: Row<PricelistProductList>) => {
      cellEditCallback(value, row, 'margin');
    },
    (value: string | number, row: Row<PricelistProductList>) => {
      cellEditCallback(value, row, 'discountPercent');
    },
  );
};

// =====================================================================================
// EDIT PRODUCTS IN GRID
// =====================================================================================
watch(
  editedProducts,
  (newVal) => {
    entityDataUpdate.value.products = newVal;
  },
  { deep: true },
);

// =====================================================================================
// FORM VALUE WATCHERS
// =====================================================================================
watch(
  currentChannelId,
  (newChannelId) => {
    if (formTouched.value) return;
    const id = String(newChannelId);
    selectableCurrencies.value = accountStore.getCurrenciesByChannelId(id);
    form.setValues({
      ...form.values,
      default: {
        ...form.values.default,
        channel: id,
      },
    });
  },
  { immediate: true },
);

watch(channels, () => {
  selectableCurrencies.value = accountStore.getCurrenciesByChannelId(
    String(currentChannelId.value),
  );
});

watch(entityData, (newEntityData, oldEntityData) => {
  if (newEntityData.channel === oldEntityData?.channel) return;
  selectableCurrencies.value = accountStore.getCurrenciesByChannelId(
    String(newEntityData.channel),
  );
});

watch(vatDescription, () => {
  setupColumns();
});

// =====================================================================================
// ENTITY ACTIONS
// =====================================================================================
const saveInProgress = ref(false);
const handleSave = async () => {
  saveInProgress.value = true;
  try {
    await updateEntity(
      undefined,
      {
        fields: 'rules,selectionquery',
      },
      !hasProductSelection.value,
    );
    if (hasProductSelection.value) {
      await previewPricelist(undefined, true, false);
    }
  } catch (error) {
    geinsLogError('error saving entity:', error);
  } finally {
    saveInProgress.value = false;
  }
};

const copyEntity = async () => {
  if (!entityId.value) return;
  loading.value = true;

  try {
    const result = await productApi.pricelist.id(entityId.value).copy();
    if (result?._id) {
      const currentPath = route.path;
      const newPath = currentPath.replace(entityId.value, result._id);
      await parseAndSaveData(result, false);
      await useRouter().replace(newPath);
      toast({
        title: t('entity_copied', { entityName }),
        variant: 'positive',
      });
    }
  } catch (error) {
    geinsLogError('error copying entity:', error);
    toast({
      title: t('error_copying_entity', { entityName }),
      description: t('feedback_error_description'),
      variant: 'negative',
    });
  } finally {
    loading.value = false;
  }
};

const handleChannelChange = async (value: AcceptableValue) => {
  const stringValue = String(value);
  selectableCurrencies.value =
    accountStore.getCurrenciesByChannelId(stringValue);
  if (!selectableCurrencies.value.includes(stringValue)) {
    await nextTick();
    form.setValues({
      ...form.values,
      default: {
        ...form.values.default,
        currency: selectableCurrencies.value[0],
      },
    });
    validateOnChange.value = true;
  }
};

// =====================================================================================
// DELETE FUNCTIONALITY
// =====================================================================================
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, '/wholesale/pricelist/list');

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
const summary = computed<DataItem[]>(() => {
  if (createMode.value && currentStep.value === 1) return [];

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

  if (entityData.value?.channel) {
    const displayValue = accountStore.getChannelNameById(
      entityData.value.channel,
    );
    dataList.push({
      label: t('wholesale.pricelist_channel'),
      value: displayValue,
    });
  }

  if (entityData.value?.currency) {
    dataList.push({
      label: t('wholesale.pricelist_currency'),
      value: entityData.value.currency,
    });
  }

  dataList.push({
    label: t('wholesale.pricelist_forced'),
    value: entityData.value?.forced ? t('yes') : t('no'),
  });

  dataList.push({
    label: t('wholesale.pricelist_vat_config_label'),
    value: entityData.value?.exVat
      ? t('wholesale.pricelist_ex_vat')
      : t('wholesale.pricelist_inc_vat'),
  });

  if (!createMode.value) {
    const date = new Date(entityData.value?.dateCreated || '');
    const formatted = date.toLocaleDateString('sv-SE');
    dataList.push({
      label: t('created'),
      value: formatted,
    });
  }

  return dataList;
});

const settingsSummary = computed<DataItem[]>(() => []);

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
  const { data, error, refresh } = await useAsyncData<ProductPricelist>(() =>
    productApi.pricelist.get(entityId.value, {
      fields: ['rules', 'selectionquery'],
    }),
  );

  if (error.value) {
    toast({
      title: t(`error_fetching_entity`, { entityName }),
      description: t('feedback_error_description'),
      variant: 'negative',
    });
  }

  refreshEntityData.value = refresh;

  if (data.value) {
    const hasSelection = !!data.value.productSelectionQuery;
    await parseAndSaveData(data.value, !hasSelection);
    if (hasSelection) {
      await previewPricelist(undefined, true, false);
    }
  }

  productsStore.init();

  watch(
    productSelection,
    async (newSelection) => {
      if (saveInProgress.value) return;

      entityDataUpdate.value.productSelectionQuery = newSelection;

      await previewPricelist('Product selection updated');
    },
    { deep: true },
  );
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
  <AlertDialog v-model:open="rulesModeChangePrompt">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle
          >Your applied quantity levels will be removed!</AlertDialogTitle
        >
        <AlertDialogDescription>
          If you proceed changing price mode to
          <strong>{{ pendingModeChange }}</strong
          >, your applied quantity levels will be removed.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="cancelModeChange">{{
          $t('cancel')
        }}</AlertDialogCancel>

        <Button @click.prevent.stop="confirmModeChange">
          {{ $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <AlertDialog v-model:open="overwriteBaseRulePromptVisible">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Product prices will be overwritten!
        </AlertDialogTitle>
        <AlertDialogDescription>
          If you proceed to apply and <strong>overwrite</strong>, all your
          manually added product prices in the table below will be overwritten.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="overwriteBaseRulePromptVisible = false">{{
          $t('cancel')
        }}</AlertDialogCancel>

        <Button @click.prevent.stop="overwriteContinueAction">
          {{ $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <AlertDialog v-model:open="overwriteLevelsPromptVisible">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Product quantity levels will be overwritten!
        </AlertDialogTitle>
        <AlertDialogDescription>
          If you proceed to apply and <strong>overwrite</strong>, your manually
          added quantity levels for quantity
          <strong>{{ currentOverwriteQuantity }}</strong> in the table below
          will be overwritten.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="overwriteLevelsPromptVisible = false">{{
          $t('cancel')
        }}</AlertDialogCancel>

        <Button @click.prevent.stop="overwriteContinueAction">
          {{ $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <AlertDialog v-model:open="removeBaseRulePromptVisible">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          Global {{ baseRuleMode }} will be removed!
        </AlertDialogTitle>
        <AlertDialogDescription>
          If you continue, your globally applied {{ baseRuleMode }} of
          <strong>{{ baseRulePercentage }}%</strong> will be removed.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="removeBaseRulePromptVisible = false">{{
          $t('cancel')
        }}</AlertDialogCancel>

        <Button @click.prevent.stop="removeBaseRule">
          {{ $t('continue') }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
  <PricelistQtyLevelsPanel
    v-model:open="rulesPanelOpen"
    v-model:pricelist-products="editedProducts"
    :product-id="rulesProductId"
    :product-name="rulesProductName"
    :pricelist-id="entityId"
    :rules="rulesToEdit"
    :currency="entityData.currency"
    :vat-description="vatDescription"
    @save="handleSaveRules"
  />

  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            :disabled="!hasUnsavedChanges || saveInProgress"
            @click="handleSave"
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
              <DropdownMenuItem as-child>
                <button type="button" class="w-full" @click="copyEntity">
                  <LucideCopy class="mr-2 size-4" />
                  <span>{{ $t('copy_entity', { entityName }) }}</span>
                </button>
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
          <ContentEditHasChanges
            :changes="hasUnsavedChanges && !saveInProgress"
          />
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
              v-if="createMode"
              :title="$t('wholesale.pricelist_vat_config_title')"
              :description="$t('wholesale.pricelist_vat_config_description')"
              :step="1"
              :total-steps="totalCreateSteps"
              :create-mode="createMode"
              :current-step="currentStep"
              :step-valid="true"
              @next="nextStep"
            >
              <FormGridWrap>
                <FormGrid design="1">
                  <FormField v-slot="{ value, handleChange }" name="vat.exVat">
                    <FormItemSwitch
                      :label="$t('wholesale.pricelist_enter_prices_ex_vat')"
                      :description="
                        $t(
                          'wholesale.pricelist_enter_prices_ex_vat_description',
                        )
                      "
                      :model-value="value"
                      @update:model-value="handleChange"
                    />
                  </FormField>
                </FormGrid>
              </FormGridWrap>
            </ContentEditCard>
            <ContentEditCard
              :title="$t('wholesale.pricelist_details_title')"
              :step="2"
              :total-steps="totalCreateSteps"
              :create-mode="createMode"
              :current-step="currentStep"
              :step-valid="formValid"
              @previous="previousStep"
            >
              <FormGridWrap>
                <FormGrid design="1+1+1">
                  <FormField v-slot="{ componentField }" name="default.name">
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
                  <FormField v-slot="{ componentField }" name="default.channel">
                    <FormItem>
                      <FormLabel>
                        {{ $t('wholesale.pricelist_channel') }}
                      </FormLabel>
                      <FormControl>
                        <Select
                          v-bind="componentField"
                          :disabled="!createMode"
                          @update:model-value="handleChannelChange"
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              v-for="channel in channels"
                              :key="channel._id"
                              :value="channel._id"
                            >
                              {{ channel.name }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription v-if="createMode">
                        {{ $t('form.cannot_be_changed') }}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="default.currency"
                  >
                    <FormItem>
                      <FormLabel>
                        {{ $t('wholesale.pricelist_currency') }}
                      </FormLabel>
                      <FormControl>
                        <Select v-bind="componentField" :disabled="!createMode">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              v-for="currency in selectableCurrencies"
                              :key="currency"
                              :value="currency"
                            >
                              {{ currency }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription v-if="createMode">
                        {{ $t('form.cannot_be_changed') }}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
              </FormGridWrap>

              <FormGridWrap class="border-t pt-6">
                <ContentCardHeader
                  :title="
                    $t('wholesale.pricelist_product_prices_options_title')
                  "
                  size="md"
                  heading-level="h3"
                />
                <FormGrid design="1">
                  <FormField
                    v-slot="{ value, handleChange }"
                    name="default.forced"
                  >
                    <FormItemSwitch
                      :label="$t('wholesale.pricelist_forced')"
                      :description="
                        $t('wholesale.pricelist_override_prices_description')
                      "
                      :model-value="value"
                      @update:model-value="handleChange"
                    />
                  </FormField>
                </FormGrid>
                <!-- <FormGrid design="1">
                  <FormField
                    v-slot="{ value, handleChange }"
                    name="default.autoAddProducts"
                  >
                    <FormItemSwitch
                      :label="$t('wholesale.pricelist_auto_add_products')"
                      :description="
                        $t('wholesale.pricelist_auto_add_products_description')
                      "
                      :disabled="true"
                      :model-value="value"
                      @update:model-value="handleChange"
                    />
                  </FormField>
                </FormGrid> -->
              </FormGridWrap>
            </ContentEditCard>
            <div v-if="createMode" class="flex flex-row justify-end gap-4">
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
          </ContentEditMainContent>
        </KeepAlive>
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1 && !createMode"
            :key="`tab-${currentTab}`"
          >
            <ContentCard>
              <ContentCardHeader
                :title="$t('wholesale.pricelist_global_rules_title')"
                :description="
                  $t('wholesale.pricelist_global_rules_description')
                "
                size="lg"
                class="mb-6"
              />
              <div>
                <Tabs v-auto-animate default-value="base-rule" class="relative">
                  <TabsList
                    :class="
                      cn(
                        'mb-3',
                        !selectedProducts.length &&
                          'pointer-events-none opacity-60',
                      )
                    "
                  >
                    <TabsTrigger value="base-rule"> Base rule </TabsTrigger>
                    <TabsTrigger value="qty-levels">
                      Quantity levels
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent v-if="selectedProducts.length" value="base-rule">
                    <PricelistRulesWrapper
                      v-model:mode="pricelistBaseRuleMode"
                      title="Base rule"
                      mode-id="pricelistBaseRuleMode"
                    >
                      <Label class="w-full">
                        {{ $t(pricelistBaseRuleMode) }}
                      </Label>
                      <Input
                        v-model.number="pricelistBaseRuleInput"
                        class="w-48"
                        size="md"
                        :loading="baseRuleLoading"
                      >
                        <template #valueDescriptor>%</template>
                      </Input>
                      <Button variant="outline" @click="handleApplyBaseRule">{{
                        $t('apply')
                      }}</Button>
                      <Button
                        variant="outline"
                        @click="handleApplyBaseRuleAndOverwrite"
                      >
                        {{ $t('wholesale.pricelist_apply_overwrite') }}
                      </Button>
                      <template #footer>
                        <SelectorTag
                          v-if="baseRule && baseRuleText && !baseRuleLoading"
                          class="mt-2"
                          :label="baseRuleText"
                          @remove="removeBaseRulePromptVisible = true"
                        />
                      </template>
                    </PricelistRulesWrapper>
                  </TabsContent>
                  <TabsContent
                    v-if="selectedProducts.length"
                    value="qty-levels"
                  >
                    <PricelistRulesWrapper
                      v-model:mode="pricelistRulesMode"
                      title="Quantity levels"
                      mode-id="pricelistRulesMode"
                    >
                      <PricelistRules
                        v-model:loading="quantityLevelsLoading"
                        :rules="quantityLevelRules"
                        :mode="pricelistRulesMode"
                        @apply="applyRule"
                        @apply-overwrite="applyAndOverwriteRule"
                        @remove="removeRule"
                      />
                    </PricelistRulesWrapper>
                  </TabsContent>
                </Tabs>
                <p
                  v-if="!selectedProducts.length"
                  class="text-muted-foreground text-sm italic"
                >
                  These settings will be available once you have made a product
                  selection below.
                </p>
              </div>
            </ContentCard>
          </ContentEditMainContent>
        </KeepAlive>
        <template #sidebar>
          <ContentEditSummary
            v-model:active="entityDataUpdate.active"
            v-bind="summaryProps"
          />
        </template>
        <template v-if="currentTab === 1 && !createMode" #secondary>
          <ContentCard>
            <Selector
              ref="productSelector"
              v-model:selection="productSelection"
              :entities="products"
              :selection-strategy="SelectorSelectionStrategy.None"
              :currency="entityData.currency"
              :fetch-entities-externally="true"
            >
              <template #list="{ selectorEntityName }">
                <ContentHeading>
                  {{
                    $t('selected_entity', { entityName: selectorEntityName }, 2)
                  }}
                </ContentHeading>
                <TableView
                  :columns="columns"
                  :data="selectedProducts"
                  :entity-name="selectorEntityName"
                  :empty-text="
                    $t(
                      'no_entity_selected',
                      { entityName: selectorEntityName },
                      2,
                    )
                  "
                  :mode="TableMode.Simple"
                  :page-size="15"
                  :pinned-state="pinnedState"
                />
              </template>
            </Selector>
          </ContentCard>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
