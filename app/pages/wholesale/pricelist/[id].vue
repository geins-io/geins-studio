<script setup lang="ts">
// IMPORTS
import { toTypedSchema } from '@vee-validate/zod';
import { useI18n } from '#imports';
import * as z from 'zod';
import type { AcceptableValue } from 'reka-ui';

// GLOBALS
const route = useRoute();
const { t } = useI18n();
const totalSteps = 2; // Total number of steps in the create form
const { currentStep, nextStep, previousStep } = useStepManagement(totalSteps);
const { $geinsApi } = useNuxtApp();
const productApi = repo.product($geinsApi);
const accountStore = useAccountStore();

const { channels, currentCurrencies, currentChannelId, currentCurrency } =
  storeToRefs(accountStore);
const selectableCurrencies = ref(currentCurrencies.value.map((i) => i._id));

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
    }),
  }),
);

// BASE DATA STRUCTURE
const entityBase: WholesalePricelistCreate = {
  name: '',
  active: true,
  channel: currentChannelId.value || '',
  currency: currentCurrency.value || '',
  identifier: '',
  dateCreated: '',
  exVat: true,
  products: [],
};

// SETUP EDIT ENTITY COMPOSABLE
const {
  entityName,
  createMode,
  loading,
  newEntityUrl,
  entityListUrl,
  entityDataCreate,
  entityDataUpdate,
  entityData,
  form,
  formValid,
  formTouched,
  hasUnsavedChanges,
  unsavedChangesDialogOpen,
  confirmLeave,
  createEntity,
  updateEntity,
  deleteEntity,
  parseAndSaveData,
} = useEntityEdit<
  WholesalePricelistBase,
  WholesalePricelist,
  WholesalePricelistCreate,
  WholesalePricelistUpdate
>({
  repository: productApi.pricelist,
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  getInitialFormValues: (entityData) => ({
    vat: {
      exVat: entityData.exVat || false,
    },
    default: {
      name: entityData.name || '',
      channel: entityData.channel || '',
      currency: entityData.currency || '',
    },
  }),
  parseEntityData: (entity) => {
    form.setValues({
      vat: {
        exVat: entity.exVat || false,
      },
      default: {
        name: entity.name || '',
        channel: entity.channel || '',
        currency: entity.currency || '',
      },
    });
  },
  prepareCreateData: (formData) => {
    return {
      ...entityBase,
      ...formData.vat,
      ...formData.default,
    };
  },
  prepareUpdateData: (formData, entity) => {
    return {
      ...entity,
      ...formData.vat,
      ...formData.default,
    };
  },
  reshapeEntityData: (entityData) => {
    return {
      ...entityData,
    };
  },
  onFormValuesChange: async (values) => {
    if (createMode.value) {
      entityDataCreate.value = {
        ...entityData.value,
        ...values.vat,
        ...values.default,
      };
    } else {
      entityDataUpdate.value = {
        ...entityData.value,
        ...values.vat,
        ...values.default,
      };
    }
  },
});

watch(
  currentChannelId,
  (newChannelId) => {
    if (formTouched.value) {
      return;
    }
    console.log('🚀 ~ newChannelId:', newChannelId);
    const id = String(newChannelId);
    selectableCurrencies.value = accountStore.getCurrenciesByChannelId(id);
    console.log('🚀 ~ selectableCurrencies.value:', selectableCurrencies.value);

    form.setValues({
      ...form.values,
      default: {
        ...form.values.default,
        channel: id,
      },
    });
    console.log('set to form: ', form.values.default.channel);
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
  }
};

const title = computed(() =>
  createMode.value
    ? t('new_entity', { entityName }) +
      (entityData.value?.name ? ': ' + entityData.value.name : '')
    : entityData.value?.name || t('edit_entity', { entityName }),
);

// Delete functionality
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, '/wholesale/pricelist/list');

// Tabs
const liveStatus = ref(true);
const currentTab = ref(0);
const tabs = ['General', 'Products & Pricing'];

// Load data for edit mode
if (!createMode.value) {
  const { data, error } = await useAsyncData<WholesalePricelist>(() =>
    productApi.pricelist.get(String(route.params.id)),
  );

  if (error.value) {
    console.error('Error fetching pricelist:', error.value);
  }

  if (data.value) {
    await parseAndSaveData(data.value);
  }
}

// Form submission
const handleSave = () => {
  if (createMode.value) {
    createEntity();
  } else {
    updateEntity();
  }
};

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
      label: t('wholesale.pricelist_name'),
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
    label: 'VAT',
    value: entityData.value?.exVat ? 'Ex VAT' : 'Inc VAT',
  });
  return dataList;
});

const settingsSummary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];

  return dataList;
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

  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="title" :entity-name="entityName">
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

    <form @submit.prevent="handleSave">
      <KeepAlive>
        <ContentEditMain v-if="currentTab === 0">
          <ContentEditCard
            v-if="createMode"
            title="Pricelist VAT"
            description="Set if the pricelist should be created with prices ex or inc VAT. Cannot be changed upon creation. Ex VAT prices are calculated from the VAT rate set on your default country set in Geins"
            :step="1"
            :total-steps="totalSteps"
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
            :total-steps="totalSteps"
            :create-mode="createMode"
            :current-step="currentStep"
            :step-valid="formValid"
            @previous="previousStep"
          >
            <FormGridWrap>
              <FormGrid design="1+1+1">
                <FormField v-slot="{ componentField }" name="default.name">
                  <FormItem v-auto-animate>
                    <FormLabel>{{ $t('wholesale.pricelist_name') }}</FormLabel>
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
                <FormField v-slot="{ componentField }" name="default.currency">
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
          <template #sidebar>
            <ContentEditSummary
              v-model:active="entityDataUpdate.active"
              :entity-name="entityName"
              :create-mode="createMode"
              :form-touched="formTouched"
              :live-status="liveStatus"
              :summary="summary"
              :settings-summary="settingsSummary"
            />
          </template>
        </ContentEditMain>
      </KeepAlive>
      <!-- Add more tabs as needed -->
    </form>
  </ContentEditWrap>
</template>
