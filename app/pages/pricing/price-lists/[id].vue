<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
// Intent: Explicit imports for types, schemas, and components not auto-imported by Nuxt.
// Only add imports here that Nuxt auto-import does not cover (e.g. zod, shared types, specific components).
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import type { ProductPriceListApiOptions } from '#shared/types';
import { ENTITIES, entityEditUrl } from '#shared/utils/entities';
import { priceListForceOptions } from '#shared/utils/price-list';
import { useToast } from '@/components/ui/toast/use-toast';
import type { AcceptableValue } from 'reka-ui';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
// Intent: Initialize all composables and Pinia stores used across this page.
// Order matters — some composables depend on values from earlier ones (e.g. useGeinsRepository before API calls).
// Add new composables here; do not scatter initialization throughout the file.
const scope = 'pages/pricing/price-lists/[id].vue';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog(scope);
const { formatDate } = useDate();
const accountStore = useAccountStore();
const breadcrumbsStore = useBreadcrumbsStore();

// =====================================================================================
// API & REPOSITORY SETUP
// =====================================================================================
// Intent: Create typed API repository instances and extract reactive store refs.
// Uses the repository factory pattern — see app/utils/repositories/ for implementation.
const { productApi, customerApi } = useGeinsRepository();
const { channels, currentCurrencies, currentChannelId, currentCurrency } =
  storeToRefs(accountStore);

// =====================================================================================
// FORM VALIDATION SCHEMA
// =====================================================================================
// Intent: Define Zod validation schemas converted via toTypedSchema for vee-validate.
// stepValidationMap ties form steps to their schema segments for step-by-step validation.
// Keep schema in sync with the form fields in the <template>.
const formSchema = toTypedSchema(
  z.object({
    vat: z.object({
      exVat: z.boolean().optional(),
    }),
    default: z.object({
      name: z.string().min(1, t('entity_required', { entityKey: 'name' })),
      channel: z
        .string()
        .min(1, t('entity_required', { entityKey: 'channel' })),
      currency: z
        .string()
        .min(1, t('entity_required', { entityKey: 'currency' })),
      identifier: z.string().optional(),
      forced: z.boolean().optional(),
      autoAddProducts: z.boolean().optional(),
    }),
  }),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
// Intent: Define default/template objects used as initial state for create and update modes.
// entityBase is passed to useEntityEdit as initialEntityData and initialUpdateData.
// Ensure every field has a sensible default — this shapes the form's starting values.
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
// Intent: Local reactive state for UI concerns — tabs, steps, selections, toggles.
// This is NOT entity data; it's presentation state that drives the template.
// Keep UI state separate from entity/form data to avoid unintended side effects.
// Tabs & Steps
const tabs = [t('general'), t('pricing.price_list_products_pricing')];

const totalCreateSteps = 2;
const { currentStep, nextStep, previousStep } =
  useStepManagement(totalCreateSteps);
const stepValidationMap: Record<number, string> = {
  1: 'vat',
  2: 'default',
};

// Currency selection
const selectableCurrencies = ref(currentCurrencies.value.map((i) => i._id));

// An ERP import maintains read-only lists: PATCH and DELETE answer 422 without `force`.
const savedReadOnly = ref(false);
// "Edit anyway" unlocks a read-only list until the page reloads.
const forceEdit = ref(false);
const forceEditDialogOpen = ref(false);
const readOnly = computed(() => savedReadOnly.value && !forceEdit.value);
const forceOptions = computed(() =>
  priceListForceOptions({ readOnly: savedReadOnly.value }),
);
// Owning company of an account list
const ownerAccountId = ref<string>();

// =====================================================================================
// ENTITY EDIT COMPOSABLE
// =====================================================================================
// Intent: Central CRUD orchestrator — provides create/update/delete, form binding, unsaved changes.
// Destructures a large set of refs and methods. Configuration callbacks (reshapeEntityData,
// parseEntityData, prepareCreateData, prepareUpdateData) transform data between API and form shapes.
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
  entityFetchKey,
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
  entity: ENTITIES.price_list,
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
      identifier: entityData.identifier || '',
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
    savedReadOnly.value = entity.readOnly;
    ownerAccountId.value = entity.accountSpecific
      ? entity.wholesaleAccountId
      : undefined;
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
    editor.seed(entity);
    form.setValues({
      vat: {
        exVat: entity.exVat,
      },
      default: {
        name: entity.name || '',
        identifier: entity.identifier || '',
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
// ERROR HANDLING SETUP
// =====================================================================================
// Intent: Page-level error handling for API fetch failures and user-facing error toasts.
// handleFetchResult validates the initial data load; showErrorToast wraps toast() for errors.

const { handleFetchResult } = usePageError({
  entity: ENTITIES.price_list,
  entityId: entityId.value,
  scope,
});

// =====================================================================================
// PRODUCTS & PRICING EDITOR
// =====================================================================================
// Intent: The rules, product selection and editable grid of tab 2, rendered by <PriceListEditor>.
// Created here rather than inside the lazily mounted tab: its first preview sets the page's baseline.

const editor = usePriceListEditor({
  priceListId: entityId,
  draft: entityDataUpdate,
  readOnly,
  onSynced: setOriginalSavedData,
});
const saveInProgress = editor.saving;

// =====================================================================================
// OWNER COMPANY
// =====================================================================================
// Intent: An account list's owning company is fetched for the summary.

const { data: ownerCompany } = useAsyncData(
  `price-list-owner-${entityId.value}`,
  async () =>
    ownerAccountId.value
      ? await customerApi.company.get(ownerAccountId.value)
      : null,
  { watch: [ownerAccountId], immediate: false },
);

// =====================================================================================
// FORM VALUE WATCHERS
// =====================================================================================
// Intent: Reactive watchers that sync form values with dependent state (e.g. channel → currencies).
// These keep derived UI state in sync when the user or programmatic changes update form fields.
// Be careful adding watchers — they can trigger cascading updates. Prefer computed where possible.
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

// =====================================================================================
// ENTITY ACTIONS
// =====================================================================================
// Intent: High-level user actions — save, copy, channel change handlers.
// These orchestrate multiple operations (e.g. save = updateEntity + previewPriceList).
// Error handling and loading state management happen here.
const handleSave = async () => {
  saveInProgress.value = true;
  try {
    await updateEntity(
      undefined,
      {
        fields: ['rules', 'selectionquery'],
        ...forceOptions.value,
      },
      !editor.hasProductSelection.value,
    );
    await editor.afterSave();
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
      await router.replace(newPath);
      toast({
        title: t('entity_copied', { entityKey }),
        variant: 'positive',
      });
    }
  } catch (error) {
    geinsLogError('error copying entity:', error);
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
// Intent: Delete confirmation dialog wired to useDeleteDialog composable.
// Redirects to the list page after successful deletion.
// deleteEntity can't send `force`, which a read-only list needs.
const deletePriceList = async (): Promise<boolean> => {
  if (!savedReadOnly.value) return await deleteEntity();
  try {
    await productApi.priceList.id(entityId.value).delete(forceOptions.value);
    toast({
      title: t('entity_deleted', { entityKey }),
      variant: 'positive',
    });
    return true;
  } catch {
    // Error toast shown globally by $geinsApi; just signal failure here.
    return false;
  }
};

const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deletePriceList, entityListUrl);

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
// Intent: Computed data items displayed in the sidebar summary panel (ContentEditSummary).
// Builds an array of DataItem objects from entity state for quick-glance information.
// Includes entityEditSummary composable for standardized summary props.
const summary = computed<DataItem[]>(() => {
  if (createMode.value && currentStep.value === 1) return [];

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

  dataList.push({
    label: t('entity_identifier', { entityKey }),
    value: entityData.value?.identifier || '–',
    displayType: entityData.value?.identifier
      ? DataItemDisplayType.Copy
      : undefined,
  });

  if (ownerAccountId.value) {
    dataList.push({
      label: t('owner'),
      value: ownerCompany.value?.name || ownerAccountId.value,
      displayType: DataItemDisplayType.Link,
      href: entityEditUrl('company', ownerAccountId.value),
      target: '_blank',
    });
  }

  if (entityData.value?.channel) {
    const channelId = entityData.value.channel;
    const displayValue = accountStore.getChannelNameById(channelId);
    dataList.push({
      label: t('pricing.price_list_channel'),
      value: displayValue,
      displayType: DataItemDisplayType.Link,
      href: entityEditUrl('channel', channelId),
      target: '_blank',
    });
  }

  if (entityData.value?.currency) {
    dataList.push({
      label: t('pricing.price_list_currency'),
      value: entityData.value.currency,
    });
  }

  dataList.push({
    label: t('pricing.price_list_forced'),
    value: entityData.value?.forced ? t('yes') : t('no'),
  });

  dataList.push({
    label: t('pricing.price_list_vat_config_label'),
    value: entityData.value?.exVat
      ? t('pricing.price_list_ex_vat')
      : t('pricing.price_list_inc_vat'),
  });

  if (!createMode.value && entityData.value?.dateCreated) {
    dataList.push({
      label: t('created'),
      value: formatDate(entityData.value.dateCreated),
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
  entityKey,
  entityLiveStatus,
});

// =====================================================================================
// DATA LOADING FOR EDIT MODE
// =====================================================================================
// Intent: Initial data fetch when editing an existing entity (not in create mode).
// Uses useAsyncData for SSR-compatible fetching, then parseAndSaveData to hydrate form state.
// onMounted sets up watchers that depend on the loaded data — keep watcher setup inside onMounted
// to avoid triggering them before data is available.
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<ProductPriceList>(
    entityFetchKey.value,
    () =>
      productApi.priceList.get(entityId.value, {
        fields: ['rules', 'selectionquery'],
      }),
  );

  refreshEntityData.value = refresh;

  onMounted(async () => {
    // Validate data exists and assign
    const priceList = handleFetchResult<ProductPriceList>(
      error.value,
      data.value,
    );

    // A list with a selection gets its baseline from the editor's first preview.
    const previews = !priceList.readOnly && !!priceList.productSelectionQuery;
    await parseAndSaveData(priceList, !previews);
    await editor.load();
  });
}
</script>

<template>
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
    :description="
      savedReadOnly
        ? $t('pricing.price_list_read_only_delete_description')
        : undefined
    "
    @confirm="confirmDelete"
  />
  <PriceListForceEditDialog
    v-model:open="forceEditDialogOpen"
    @confirm="forceEdit = true"
  />

  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-key="entityKey">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            :disabled="readOnly || !hasUnsavedChanges || saveInProgress"
            @click="handleSave"
          >
            {{ $t('save_entity', { entityKey }) }}
          </ButtonIcon>
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
                  <span>{{ $t('new_entity', { entityKey }) }}</span>
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <button type="button" class="w-full" @click="copyEntity">
                  <LucideCopy class="mr-2 size-4" />
                  <span>{{ $t('copy_entity', { entityKey }) }}</span>
                </button>
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
              :title="$t('pricing.price_list_vat_config_title')"
              :description="$t('pricing.price_list_vat_config_description')"
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
                      :label="$t('pricing.price_list_enter_prices_ex_vat')"
                      :description="
                        $t('pricing.price_list_enter_prices_ex_vat_description')
                      "
                      :model-value="value"
                      @update:model-value="handleChange"
                    />
                  </FormField>
                </FormGrid>
              </FormGridWrap>
            </ContentEditCard>
            <ContentEditCard
              :title="$t('pricing.price_list_details_title')"
              :step="2"
              :total-steps="totalCreateSteps"
              :create-mode="createMode"
              :current-step="currentStep"
              :step-valid="formValid"
              @previous="previousStep"
            >
              <FormGridWrap>
                <FormGrid design="1+1">
                  <FormField v-slot="{ componentField }" name="default.name">
                    <FormItem>
                      <FormLabel>
                        {{ $t('entity_name', { entityKey }) }}
                      </FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          :disabled="readOnly"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="default.identifier"
                  >
                    <FormItem>
                      <FormLabel>
                        {{ $t('entity_identifier', { entityKey }) }}
                      </FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="text"
                          :disabled="!createMode"
                        />
                      </FormControl>
                      <FormDescription v-if="createMode">
                        {{ $t('form.cannot_be_changed') }}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1+1">
                  <FormField v-slot="{ componentField }" name="default.channel">
                    <FormItem>
                      <FormLabel>
                        {{ $t('pricing.price_list_channel') }}
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
                              {{ channel.name || channel.identifier }}
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
                        {{ $t('pricing.price_list_currency') }}
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
                  :title="$t('pricing.price_list_product_prices_options_title')"
                  size="md"
                  heading-level="h3"
                />
                <FormGrid design="1">
                  <FormField
                    v-slot="{ value, handleChange }"
                    name="default.forced"
                  >
                    <FormItemSwitch
                      :label="$t('pricing.price_list_forced')"
                      :description="
                        $t('pricing.price_list_override_prices_description')
                      "
                      :disabled="readOnly"
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
                      :label="$t('pricing.price_list_auto_add_products')"
                      :description="
                        $t('pricing.price_list_auto_add_products_description')
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
                {{ $t('create_entity', { entityKey }) }}
              </Button>
            </div>
          </ContentEditMainContent>
        </KeepAlive>
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1 && !createMode"
            :key="`tab-${currentTab}`"
          >
            <PriceListEditor :editor="editor" />
          </ContentEditMainContent>
        </KeepAlive>
        <template #sidebar>
          <ContentEditSummary
            v-model:active="entityDataUpdate.active"
            v-bind="summaryProps"
            :disabled="readOnly"
          >
            <template v-if="savedReadOnly" #before-active-switch>
              <Feedback v-if="forceEdit" type="warning">
                <template #title>
                  {{ $t('pricing.price_list_force_editing_title') }}
                </template>
                <template #description>
                  {{ $t('pricing.price_list_force_editing_description') }}
                </template>
              </Feedback>
              <Item v-else variant="outline">
                <ItemMedia variant="icon">
                  <LucideLock class="text-muted-foreground" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {{ $t('pricing.price_list_read_only_title') }}
                  </ItemTitle>
                  <ItemDescription>
                    {{ $t('pricing.managed_externally') }}
                  </ItemDescription>
                </ItemContent>
                <!-- A retired (inactive) ERP list's selection is stale, so it never goes editable. -->
                <ItemFooter v-if="entityLiveStatus">
                  <ButtonIcon
                    icon="SquarePen"
                    variant="secondary"
                    size="sm"
                    @click="forceEditDialogOpen = true"
                  >
                    {{ $t('edit_anyway') }}
                  </ButtonIcon>
                </ItemFooter>
              </Item>
            </template>
          </ContentEditSummary>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
