<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { toTypedSchema } from '@vee-validate/zod';
import { useI18n } from '#imports';
import * as z from 'zod';
import type { AcceptableValue } from 'reka-ui';
import { useToast } from '@/components/ui/toast/use-toast';
import type { ColumnDef, Row } from '@tanstack/vue-table';
import {
  SelectorSelectionStrategy,
  type PricelistRuleMode,
  type PricelistProductList,
  type Product,
  type PricelistRule,
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
const productApi = repo.product($geinsApi);
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
      name: z.string().min(1, t('entity_required', { entityName: t('name') })),
      channel: z
        .string()
        .min(1, t('entity_required', { entityName: t('channel') })),
      currency: z
        .string()
        .min(1, t('entity_required', { entityName: t('currency') })),
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
  autoAddProducts: false,
  forced: false,
  products: [],
  rules: [],
  productSelectionQuery: {
    include: [],
    exclude: [],
  },
};

// =====================================================================================
// UI STATE MANAGEMENT
// =====================================================================================
// Tabs & Steps
const currentTab = ref(0);
const tabs = [
  t('wholesale.pricelist_tab_general'),
  t('wholesale.pricelist_tab_products_pricing'),
];
const showSidebar = computed(() => true);

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

// Pricelist rules
const pricelistRulesMode = ref<PricelistRuleMode>('margin');

// =====================================================================================
// PRODUCT & PRICING COMPOSABLES
// =====================================================================================
const {
  transformProductsForList,
  getPricelistProducts,
  updatePricelistProductsPrice,
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
  }),
  parseEntityData: (entity) => {
    entityLiveStatus.value = entity.active;
    if (entity.productSelectionQuery) {
      productSelection.value = entity.productSelectionQuery;
    }
    if (entity.rules && entity.rules.length) {
      const firstRuleMargin = entity.rules[0]?.margin;
      pricelistRulesMode.value =
        firstRuleMargin !== undefined && firstRuleMargin !== 0
          ? 'margin'
          : 'discount';
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
    products: getPricelistProducts(selectedProducts.value),
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
// PRODUCT TABLE STATE
// =====================================================================================
const selectedProducts = ref<PricelistProductList[]>([]);
const productQueryParams = ref<ProductQueryParams>({
  fields: 'localizations,media,defaultprice',
  defaultChannel: entityData.value?.channel,
  defaultCurrency: entityData.value?.currency,
  defaultCountry: accountStore.getDefaultCountryByChannelId(
    entityData.value?.channel,
  ),
});

const vatDescription = computed(() => {
  return entityData.value?.exVat ? t('ex_vat') : t('inc_vat');
});

let columns: ColumnDef<PricelistProductList>[] = [];
const pinnedState = ref(getPinnedState());

// =====================================================================================
// QUANTITY LEVELS MANAGEMENT
// =====================================================================================
const rulesToEdit = ref<PricelistRule[]>([]);
const rulesPanelOpen = ref(false);
const rulesId = ref<string>('');

const handleSaveRules = (rules: PricelistRule[]) => {
  selectedProducts.value = selectedProducts.value.map((p) =>
    p._id === rulesId.value ? { ...p, quantityLevels: rules } : p,
  );
  rulesId.value = '';
};

// =====================================================================================
// COLUMN SETUP FUNCTIONS
// =====================================================================================
const setupColumns = () => {
  columns = setupPricelistColumns(
    selectedProducts.value,
    vatDescription.value,
    (id: string) => {
      const rules = selectedProducts.value.find(
        (p) => p._id === id,
      )?.quantityLevels;
      rulesToEdit.value = rules ? [...rules] : [];
      rulesId.value = id;
      rulesPanelOpen.value = true;
    },
    (id: string) => productSelector.value.removeFromManuallySelected(id),
    (value: string | number, row: Row<PricelistProductList>) => {
      updatePricelistProductsPrice(
        selectedProducts.value,
        row.original._id,
        String(value),
      );
    },
  );
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

watch(
  () => productSelector.value?.selectedEntities || [],
  (newSelection: Product[]) => {
    if (newSelection.length) {
      selectedProducts.value = transformProductsForList(
        newSelection,
        entityData.value,
      );
      setupColumns();
    }
  },
);

// =====================================================================================
// ENTITY ACTIONS
// =====================================================================================
const copyEntity = async () => {
  if (!entityId.value) return;
  loading.value = true;

  try {
    const result = await productApi.pricelist.id(entityId.value).copy();
    if (result?._id) {
      const currentPath = route.path;
      const newPath = currentPath.replace(entityId.value, result._id);
      await parseAndSaveData(result);
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
// UTILITY FUNCTIONS
// =====================================================================================
const updatePricelistMode = (mode: string | number) => {
  pricelistRulesMode.value = mode as PricelistRuleMode;
};

// =====================================================================================
// DATA LOADING FOR EDIT MODE
// =====================================================================================
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<ProductPricelist>(() =>
    productApi.pricelist.get(entityId.value, {
      fields: 'all',
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
    await parseAndSaveData(data.value);
  }

  productsStore.init();

  watch(
    productSelection,
    (newSelection) => {
      entityDataUpdate.value.productSelectionQuery = newSelection;
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
  <PricelistQtyLevelsPanel
    v-model:open="rulesPanelOpen"
    :product-id="rulesId"
    :rules="rulesToEdit"
    :currency="entityData.currency"
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
            @click="
              updateEntity(undefined, {
                fields: 'all',
              })
            "
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
                    <FormItem v-auto-animate>
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
                    <FormItem v-auto-animate>
                      <FormLabel>
                        {{ $t('wholesale.pricelist_channel') }}
                      </FormLabel>
                      <FormControl>
                        <Select
                          v-bind="componentField"
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
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="default.currency"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>
                        {{ $t('wholesale.pricelist_currency') }}
                      </FormLabel>
                      <FormControl>
                        <Select v-bind="componentField">
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
                <FormGrid design="1">
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
                </FormGrid>
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
            <ContentEditCard
              :title="$t('wholesale.pricelist_full_range_adjustments_title')"
              :description="
                $t('wholesale.pricelist_full_range_adjustments_description')
              "
              :create-mode="createMode"
              :step-valid="true"
            >
              <Tabs
                :default-value="pricelistRulesMode"
                @update:model-value="updatePricelistMode"
              >
                <TabsList>
                  <TabsTrigger value="margin">
                    {{ $t('wholesale.pricelist_margin') }}
                  </TabsTrigger>
                  <TabsTrigger value="discount">
                    {{ $t('wholesale.pricelist_discount') }}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <PricelistRules
                v-if="!createMode"
                :rules="entityDataUpdate.rules || []"
                :mode="pricelistRulesMode"
                @update="entityDataUpdate.rules = $event"
              />
            </ContentEditCard>
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
              :product-query-params="productQueryParams"
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
