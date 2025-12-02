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
  type PriceListRuleMode,
  type PriceListProductList,
  type PriceListRule,
  type PriceListProduct,
  type PriceListRuleField,
  type ProductPriceListApiOptions,
} from '#shared/types';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const route = useRoute();
const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog('pages/wholesale/price-list/[id].vue');
const accountStore = useAccountStore();
const productsStore = useProductsStore();
const { products } = storeToRefs(productsStore);
const breadcrumbsStore = useBreadcrumbsStore();

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
const entityBase: ProductPriceListCreate = {
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
const tabs = [t('general'), t('wholesale.price_list_products_pricing')];

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

// Price list base rule input
const priceListBaseRuleMode = ref<PriceListRuleMode>('discount');
const priceListBaseRuleInput = ref<number>();

// Edited products for form tracking
const editedProducts = ref<PriceListProduct[]>([]);

// =====================================================================================
// PRICELIST PRODUCTS MANAGEMENT
// =====================================================================================

const {
  transformProductsForList,
  getPriceListProduct,
  addToPriceListProducts,
  convertPriceModeToRuleField,
} = usePriceListProducts();

const { setupPriceListColumns, getPinnedState } = usePriceListProductsTable();

const vatDescription = computed(() => {
  return entityData.value?.exVat ? t('ex_vat') : t('inc_vat');
});

let columns: ColumnDef<PriceListProductList>[] = [];
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
    `Price updated for ${row.original.name} (${row.original._id})`,
  );
};

const setupColumns = () => {
  columns = setupPriceListColumns(
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
  );
};

watch(
  editedProducts,
  (newVal) => {
    entityDataUpdate.value.products = newVal;
  },
  { deep: true },
);

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
  ProductPriceListBase,
  ProductPriceList,
  ProductPriceListCreate,
  ProductPriceListUpdate,
  ProductPriceListApiOptions
>({
  repository: productApi.priceList,
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
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
    if (entity.productSelectionQuery) {
      productSelection.value = entity.productSelectionQuery;
    }
    if (entity.rules && entity.rules.length) {
      const volumePricing = entity.rules.filter(
        (r) => r.quantity && r.quantity > 1,
      );
      const baseRule = entity.rules.find((r) => r.quantity === 1);
      const firstRuleMargin = volumePricing[0]?.margin;
      const baseRuleMargin = baseRule?.margin;
      actualPriceListRulesMode.value = firstRuleMargin ? 'margin' : 'discount';
      priceListBaseRuleMode.value = baseRuleMargin ? 'margin' : 'discount';

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

const { selectedProducts, hasProductSelection, previewPriceList } =
  usePriceListPreview({
    entityId,
    entityDataUpdate,
    transformProductsForList,
    setupColumns,
    onUpdateProducts: async (editedProductsList) => {
      editedProducts.value = editedProductsList;
      await nextTick();
      setOriginalSavedData();
    },
    convertPriceModeToRuleField,
    getPriceListProduct,
  });

// =====================================================================================
// RULES & VOLUME PRICING MANAGEMENT
// =====================================================================================

// Rules management
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
  entityDataUpdate,
  previewPriceList,
});

// Volume pricing management
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

// =====================================================================================
// BASE RULES MANAGEMENT
// =====================================================================================
const handleApplyBaseRule = () => {
  if (priceListBaseRuleInput.value === undefined || !entityId.value) return;
  const percentage = priceListBaseRuleInput.value;
  const mode = priceListBaseRuleMode.value;
  applyBaseRule(percentage, mode);
  priceListBaseRuleInput.value = undefined;
};

const handleApplyBaseRuleAndOverwrite = () => {
  if (priceListBaseRuleInput.value === undefined || !entityId.value) return;
  const percentage = priceListBaseRuleInput.value;
  const mode = priceListBaseRuleMode.value;
  applyBaseRuleAndOverwrite(percentage, mode);
  priceListBaseRuleInput.value = undefined;
};

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
        fields: ['rules', 'selectionquery'],
      },
      !hasProductSelection.value,
    );
    if (hasProductSelection.value) {
      await previewPriceList(undefined, true, false);
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
    const result = await productApi.priceList.id(entityId.value).copy();
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
  useDeleteDialog(deleteEntity, '/wholesale/price-list/list');

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
      label: t('wholesale.price_list_channel'),
      value: displayValue,
    });
  }

  if (entityData.value?.currency) {
    dataList.push({
      label: t('wholesale.price_list_currency'),
      value: entityData.value.currency,
    });
  }

  dataList.push({
    label: t('wholesale.price_list_forced'),
    value: entityData.value?.forced ? t('yes') : t('no'),
  });

  dataList.push({
    label: t('wholesale.price_list_vat_config_label'),
    value: entityData.value?.exVat
      ? t('wholesale.price_list_ex_vat')
      : t('wholesale.price_list_inc_vat'),
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
  const { data, error, refresh } = await useAsyncData<ProductPriceList>(() =>
    productApi.priceList.get(entityId.value, {
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
      await previewPriceList(undefined, true, false);
    }
  }

  productsStore.init();

  watch(
    productSelection,
    async (newSelection) => {
      if (saveInProgress.value) return;

      entityDataUpdate.value.productSelectionQuery = newSelection;

      await previewPriceList('Product selection updated');
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
        <AlertDialogTitle>
          Your applied price breaks will be removed!
        </AlertDialogTitle>
        <AlertDialogDescription>
          If you proceed changing price mode to
          <strong>{{ pendingModeChange }}</strong
          >, your globally applied price breaks will be removed.
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
          Product volume pricing will be overwritten!
        </AlertDialogTitle>
        <AlertDialogDescription>
          If you proceed to apply and <strong>overwrite</strong>, your manually
          added volume pricing for quantity
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
  <PriceListVolumePricingPanel
    v-model:open="rulesPanelOpen"
    v-model:price-list-products="editedProducts"
    :product-id="rulesProductId"
    :product-name="rulesProductName"
    :price-list-id="entityId"
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
              <Button class="p-1" size="icon" variant="secondary">
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
              :title="$t('wholesale.price_list_vat_config_title')"
              :description="$t('wholesale.price_list_vat_config_description')"
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
                      :label="$t('wholesale.price_list_enter_prices_ex_vat')"
                      :description="
                        $t(
                          'wholesale.price_list_enter_prices_ex_vat_description',
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
              :title="$t('wholesale.price_list_details_title')"
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
                        {{ $t('wholesale.price_list_channel') }}
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
                        {{ $t('wholesale.price_list_currency') }}
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
                    $t('wholesale.price_list_product_prices_options_title')
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
                      :label="$t('wholesale.price_list_forced')"
                      :description="
                        $t('wholesale.price_list_override_prices_description')
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
                      :label="$t('wholesale.price_list_auto_add_products')"
                      :description="
                        $t('wholesale.price_list_auto_add_products_description')
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
                :title="$t('wholesale.price_list_global_rules_title')"
                :description="
                  $t('wholesale.price_list_global_rules_description')
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
                        !hasProductSelection &&
                          'pointer-events-none opacity-60',
                      )
                    "
                  >
                    <TabsTrigger value="base-rule"> Base rule </TabsTrigger>
                    <TabsTrigger value="qty-levels">
                      Volume pricing
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent v-if="hasProductSelection" value="base-rule">
                    <PriceListRulesWrapper
                      v-model:mode="priceListBaseRuleMode"
                      title="Base rule"
                      mode-id="priceListBaseRuleMode"
                    >
                      <Label class="w-full">
                        {{ $t(priceListBaseRuleMode) }}
                      </Label>
                      <Input
                        v-model.number="priceListBaseRuleInput"
                        class="w-full sm:w-48"
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
                        {{ $t('wholesale.price_list_apply_overwrite') }}
                      </Button>
                      <template #footer>
                        <SelectorTag
                          v-if="baseRule && baseRuleText && !baseRuleLoading"
                          class="mt-2"
                          :label="baseRuleText"
                          @remove="removeBaseRulePromptVisible = true"
                        />
                      </template>
                    </PriceListRulesWrapper>
                  </TabsContent>
                  <TabsContent v-if="hasProductSelection" value="qty-levels">
                    <PriceListRulesWrapper
                      v-model:mode="priceListRulesMode"
                      title="Volume pricing"
                      mode-id="priceListRulesMode"
                    >
                      <PriceListRules
                        v-model:loading="volumePricingLoading"
                        :rules="quantityLevelRules"
                        :mode="priceListRulesMode"
                        @apply="applyRule"
                        @apply-overwrite="applyAndOverwriteRule"
                        @remove="removeRule"
                      />
                    </PriceListRulesWrapper>
                  </TabsContent>
                </Tabs>
                <p
                  v-if="!hasProductSelection"
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
                  :show-search="true"
                />
              </template>
            </Selector>
          </ContentCard>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
