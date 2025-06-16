<script setup lang="ts">
// IMPORTS
import { toTypedSchema } from '@vee-validate/zod';
import { useI18n } from '#imports';
import * as z from 'zod';
import type { AcceptableValue } from 'reka-ui';
import { useToast } from '@/components/ui/toast/use-toast';
import type { ColumnDef } from '@tanstack/vue-table';
import {
  SelectorSelectionStrategy,
  type PricelistProductList,
  type Product,
} from '#shared/types';

// COMPOSABLES
const route = useRoute();
const { t } = useI18n();
const { $geinsApi } = useNuxtApp();
const accountStore = useAccountStore();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog('pages/wholesale/pricelist/[id].vue');

// GLOBALS
const productApi = repo.product($geinsApi);
const { channels, currentCurrencies, currentChannelId, currentCurrency } =
  storeToRefs(accountStore);
const productSelector = ref();

// FORM VALIDATION SCHEMA
const formSchema = toTypedSchema(
  z.object({
    vat: z.object({
      exVat: z.boolean().optional(),
    }),
    default: z.object({
      name: z.string().min(1, 'Name is required'),
      channel: z.string().min(1, 'Channel is required'),
      currency: z.string().min(1, 'Currency is required'),
      forced: z.boolean().optional(),
      autoAddProducts: z.boolean().optional(),
    }),
  }),
);

// ENTITY DATA SETUP
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

const selectableCurrencies = ref(currentCurrencies.value.map((i) => i._id));

const { getEmptyQuerySelectionBase } = useSelector();
const productSelection = ref<SelectorSelectionQueryBase>(
  getEmptyQuerySelectionBase(),
);

// TABS MANAGEMENT
const currentTab = ref(0);
const tabs = ['General', 'Products & Pricing'];
const showSidebar = computed(() => {
  return true;
});

// STEP MANAGEMENT
const totalCreateSteps = 2;
const { currentStep, nextStep, previousStep } =
  useStepManagement(totalCreateSteps);

const stepValidationMap: Record<number, string> = {
  1: 'vat',
  2: 'default',
};

// ENTITY EDIT COMPOSABLE
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
  reshapeEntityData: (entityData) => {
    return {
      ...entityData,
    };
  },
  parseEntityData: (entity) => {
    entityLiveStatus.value = entity.active;
    if (entity.productSelectionQuery) {
      productSelection.value = entity.productSelectionQuery;
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
    rules: undefined,
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

// FORM VALUE WATCHERS
watch(
  currentChannelId,
  (newChannelId) => {
    if (formTouched.value) {
      return;
    }
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
  if (newEntityData.channel === oldEntityData?.channel) {
    return;
  }
  selectableCurrencies.value = accountStore.getCurrenciesByChannelId(
    String(newEntityData.channel),
  );
});

const copyEntity = async () => {
  if (!entityId.value) {
    return;
  }

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
    geinsLogError('error validating VAT number:', error);
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

// DELETE FUNCTIONALITY
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, '/wholesale/pricelist/list');

// SUMMARY DATA
const summary = computed<DataItem[]>(() => {
  if (createMode.value && currentStep.value === 1) {
    return [];
  }
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
      label: 'Channel',
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
    value: entityData.value?.forced ? 'Yes' : 'No',
  });

  dataList.push({
    label: 'VAT config',
    value: entityData.value?.exVat ? 'Ex VAT' : 'Inc VAT',
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

const settingsSummary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];

  return dataList;
});

const { summaryProps } = useEntityEditSummary({
  createMode,
  formTouched,
  summary,
  settingsSummary,
  entityName,
  entityLiveStatus,
});

const productsStore = useProductsStore();
const { products } = storeToRefs(productsStore);
const selectedProducts = ref<PricelistProductList[]>([]);
const productQueryParams = ref<ProductQueryParams>({
  fields: 'localizations,media,defaultprice',
  defaultChannel: entityData.value?.channel,
  defaultCurrency: entityData.value?.currency,
  defaultCountry: accountStore.getDefaultCountryByChannelId(
    entityData.value?.channel,
  ),
});

const { getColumns, addActionsColumn } = useColumns<PricelistProductList>();
let columns: ColumnDef<PricelistProductList>[] = [];
const columnOptions: ColumnOptions<PricelistProductList> = {
  columnTypes: {
    listPrice: 'editable-currency',
    discount: 'editable-percentage',
    margin: 'editable-percentage',
  },
  excludeColumns: ['quantityLevels', 'manual'],
};

const setupColumns = () => {
  columns = getColumns(selectedProducts.value, columnOptions);
  addActionsColumn(
    columns,
    {
      onDelete: (entity: SelectorEntity) =>
        productSelector.value.removeFromManuallySelected(entity._id),
    },
    'delete',
  );
};

const pinnedState = ref({
  left: [],
  right: ['listPrice', 'discount', 'margin', 'actions'],
});

const { convertToPrice } = usePrice();

const transformProductsForList = (
  products: Product[],
): PricelistProductList[] => {
  return products.map((product) => ({
    _id: product._id,
    name: product.name,
    thumbnail: product.thumbnail || '',
    purchasePrice: convertToPrice(
      product.purchasePrice,
      product.purchasePriceCurrency,
    ),
    catalogPrice: convertToPrice(
      product.defaultPrice?.sellingPriceIncVat || 0,
      entityData.value?.currency,
    ),
    listPrice: convertToPrice(
      product.defaultPrice?.sellingPriceIncVat || 0,
      entityData.value?.currency,
    ),
    discount: 0,
    margin: 0,
    quantityLevels: [
      {
        quantity: 0,
        margin: 0,
        discountPercent: 0,
      },
    ],
    manual: false,
  }));
};

const selectedEntities = computed(() => {
  return productSelector.value?.selectedEntities || [];
});

watch(selectedEntities, (newSelection: Product[]) => {
  if (newSelection.length) {
    selectedProducts.value = transformProductsForList(newSelection);
    setupColumns();
  }
});

// LOAD DATA FOR EDIT MODE
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

  // PRODUCT SELECTOR
  productsStore.init();

  watch(
    productSelection,
    (newSelection) => {
      // Ensure we're not making the data reactive when assigning
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

  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            @click="updateEntity"
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
              title="Price VAT configuration"
              description="Set if the pricelist should be created with prices ex or inc VAT. Cannot be changed upon creation. Ex VAT prices are calculated from the VAT rate set on your default country set in Geins"
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
                      label="Enter prices ex VAT"
                      description="Create this pricelist with prices ex VAT. Cannot be changed upon creation."
                      :model-value="value"
                      @update:model-value="handleChange"
                    />
                  </FormField>
                </FormGrid>
              </FormGridWrap>
            </ContentEditCard>
            <ContentEditCard
              title="Pricelist details"
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
                  title="Product and prices options"
                  size="md"
                  heading-level="h3"
                />
                <FormGrid design="1">
                  <FormField
                    v-slot="{ value, handleChange }"
                    name="default.forced"
                  >
                    <FormItemSwitch
                      label="Override prices"
                      description="If enabled, the pricelist's prices will override lower available prices such as campaigns and sale prices."
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
                      label="Automatically add products"
                      description="If enabled, products of selected categories or brands will be automatically added to the pricelist."
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
              title="Full range adjustments"
              description="Calculates lists priced based on either margin or discount. Will apply value to all rows."
              :create-mode="createMode"
              :step-valid="true"
            >
              <Tabs default-value="margin">
                <TabsList>
                  <TabsTrigger value="margin"> Margin </TabsTrigger>
                  <TabsTrigger value="discount"> Discount </TabsTrigger>
                </TabsList>
                <TabsContent value="margin" class="pt-2">
                  <Label>Margin %</Label>
                  <div class="flex w-1/3 gap-2">
                    <Input />
                    <Button variant="outline" size="lg"> Apply</Button>
                  </div>
                </TabsContent>
                <TabsContent value="discount" class="pt-2">
                  <Label>Discount %</Label>
                  <div class="flex w-1/3 gap-2">
                    <Input />
                    <Button variant="outline" size="lg"> Apply</Button>
                  </div>
                </TabsContent>
              </Tabs>
              <Separator />
              <PricelistRules
                v-if="!createMode"
                :rules="entityDataUpdate.rules || []"
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
