<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { useToast } from '@/components/ui/toast/use-toast';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { CalendarIcon } from 'lucide-vue-next';
import { DateFormatter, getLocalTimeZone } from '@internationalized/date';
import type {
  QuotationBase,
  Quotation,
  QuotationCreate,
  QuotationUpdate,
  QuotationApiOptions,
  QuotationStatus,
} from '#shared/types';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const scope = 'pages/orders/quotation/[id].vue';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog(scope);
const accountStore = useAccountStore();
const breadcrumbsStore = useBreadcrumbsStore();

// =====================================================================================
// API & REPOSITORY SETUP
// =====================================================================================
const { orderApi, customerApi, globalApi } = useGeinsRepository();
const { currentCurrencies, channels } = storeToRefs(accountStore);
const currentChannels = computed(() => channels.value);

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
      createdBy: z
        .string()
        .min(1, t('entity_required', { entityName: 'sales_rep' })),
      buyerId: z.string().optional(),
      currency: z
        .string()
        .min(1, t('entity_required', { entityName: 'currency' })),
      channel: z.string().optional(),
      expirationDate: z.string().optional(),
      notes: z.string().optional(),
    }),
  }),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
const entityBase: QuotationCreate = {
  name: '',
  status: 'draft',
  accountId: '',
  accountName: '',
  dateCreated: '',
  dateModified: '',
  sum: {
    price: '0',
    currency: currentCurrencies.value[0]?._id || 'SEK',
  },
  expirationDate: '',
  itemCount: 0,
  createdBy: '',
  currency: currentCurrencies.value[0]?._id || 'SEK',
  channel: currentChannels.value[0]?._id || '',
  items: [],
};

// =====================================================================================
// UI STATE MANAGEMENT
// =====================================================================================
// Tabs & Steps
const tabs = [t('general'), t('item', 2), t('summary')];

const totalCreateSteps = 1;
const { currentStep, nextStep, previousStep } =
  useStepManagement(totalCreateSteps);

const stepValidationMap: Record<number, string> = {
  1: 'details',
};

// Company & User selection
const companies = ref<CustomerCompany[]>([]);
const users = ref<User[]>([]);
const buyers = ref<CompanyBuyer[]>([]);
const selectedCompanyId = ref<string>('');
const selectedAccountName = ref<string>('');

// Date formatter
const df = new DateFormatter('en-US', {
  dateStyle: 'long',
});

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
  validateSteps,
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
  initialUpdateData: entityBase,
  stepValidationMap,
  reshapeEntityData: (entityData) => ({
    ...entityData,
    items: undefined,
  }),
  getInitialFormValues: (entityData) => ({
    details: {
      name: entityData.name || '',
      accountId: entityData.accountId || '',
      createdBy: entityData.createdBy || '',
      buyerId: '',
      currency: entityData.currency || currentCurrencies.value[0]?._id || 'SEK',
      channel: entityData.channel || currentChannels.value[0]?._id || '',
      expirationDate: entityData.expirationDate || '',
      notes: entityData.notes || '',
    },
  }),
  parseEntityData: (quotation: Quotation) => {
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
    entityLiveStatus.value =
      quotation.status === 'sent' || quotation.status === 'accepted';
    selectedCompanyId.value = quotation.accountId;
    selectedAccountName.value = quotation.accountName || '';

    form.setValues({
      details: {
        name: quotation.name || '',
        accountId: quotation.accountId || '',
        createdBy: quotation.createdBy || '',
        buyerId: '',
        currency: quotation.currency || 'SEK',
        channel: quotation.channel || '',
        expirationDate: quotation.expirationDate || '',
        notes: quotation.notes || '',
      },
    });
  },
  prepareCreateData: (formData) => {
    const expirationDate =
      formData.details.expirationDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return {
      ...entityBase,
      name: formData.details.name,
      accountId: formData.details.accountId,
      accountName: selectedAccountName.value,
      createdBy: formData.details.createdBy,
      currency: formData.details.currency,
      channel: formData.details.channel,
      expirationDate,
      notes: formData.details.notes,
      status: 'draft' as QuotationStatus,
      sum: {
        price: '0',
        currency: formData.details.currency,
      },
    };
  },
  prepareUpdateData: (formData, entity) => ({
    ...entity,
    name: formData.details.name,
    accountId: formData.details.accountId,
    accountName: selectedAccountName.value,
    createdBy: formData.details.createdBy,
    currency: formData.details.currency,
    channel: formData.details.channel,
    expirationDate: formData.details.expirationDate,
    notes: formData.details.notes,
  }),
  onFormValuesChange: (values) => {
    const targetEntity = createMode.value ? entityDataCreate : entityDataUpdate;
    targetEntity.value = {
      ...entityData.value,
      name: values.details.name,
      accountId: values.details.accountId,
      accountName: selectedAccountName.value,
      createdBy: values.details.createdBy,
      currency: values.details.currency,
      channel: values.details.channel,
      expirationDate: values.details.expirationDate,
      notes: values.details.notes,
    };
  },
});

// =====================================================================================
// ERROR HANDLING SETUP
// =====================================================================================
const { handleFetchResult } = usePageError({
  entityName,
  entityId: entityId.value,
  scope,
});

// =====================================================================================
// DATA FETCHING
// =====================================================================================
const { useGeinsFetch } = useGeinsApi();

// Fetch companies
const fetchCompanies = async () => {
  const companiesResult = await useGeinsFetch<CustomerCompany[]>(
    '/wholesale/account/list',
  );
  if (!companiesResult.error.value) {
    companies.value = companiesResult.data.value as CustomerCompany[];
  }
};

// Fetch users (sales reps)
const fetchUsers = async () => {
  const usersResult = await useGeinsFetch<User[]>('/user/list');
  if (!usersResult.error.value) {
    users.value = usersResult.data.value as User[];
    users.value = users.value.map((user) => ({
      ...user,
      name: user.firstName + ' ' + user.lastName,
    }));
  }
};

// Fetch buyers for selected company
const fetchBuyersForCompany = async (companyId: string) => {
  if (!companyId) {
    buyers.value = [];
    return;
  }

  try {
    const company = await customerApi.company.get(companyId);
    buyers.value = company.buyers || [];
  } catch (error) {
    geinsLogError('Error fetching buyers for company', error);
    buyers.value = [];
  }
};

// Watch for company selection changes
watch(
  () => form.values.details?.accountId,
  async (newCompanyId) => {
    if (newCompanyId) {
      selectedCompanyId.value = newCompanyId;
      const selectedCompany = companies.value.find(
        (c) => c._id === newCompanyId,
      );
      selectedAccountName.value = selectedCompany?.name || '';
      await fetchBuyersForCompany(newCompanyId);
    }
  },
);

// Initialize data
onMounted(async () => {
  await Promise.all([fetchCompanies(), fetchUsers()]);

  // If editing, fetch buyers for the company
  if (!createMode.value && entityData.value?.accountId) {
    await fetchBuyersForCompany(entityData.value.accountId);
  }
});

// =====================================================================================
// SUMMARY SETUP
// =====================================================================================
const { summaryProps } = useEntityEditSummary({
  entityDataUpdate,
  entityPageTitle,
  entityName,
  entityListUrl,
  entityLiveStatus,
  loading,
  createMode,
  formValid,
  formTouched,
  hasUnsavedChanges,
  currentTab,
  tabs,
  onSave: parseAndSaveData,
  onDelete: deleteEntity,
});

// Computed properties for summary
const summaryData = computed(() => {
  if (!entityData.value) return [];
  return [
    {
      label: t('company'),
      value: entityData.value.accountName || '-',
    },
    {
      label: t('status'),
      value: entityData.value.status || '-',
    },
    {
      label: t('sum'),
      value: `${entityData.value.sum?.price || '0'} ${entityData.value.sum?.currency || ''}`,
    },
    {
      label: t('item', 2),
      value: entityData.value.itemCount?.toString() || '0',
    },
  ];
});

definePageMeta({
  layout: 'default',
});
</script>

<template>
  <ContentEditWrap
    v-if="!loading"
    :entity-name="entityName"
    :entity-id="entityId"
    :create-mode="createMode"
    :show-sidebar="showSidebar"
  >
    <form class="contents" @submit.prevent>
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
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 0"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard
              :create-mode="createMode"
              :title="$t('entity_details', { entityName })"
              :description="
                createMode
                  ? $t('orders.quotation_create_description')
                  : $t('orders.quotation_edit_description')
              "
            >
              <FormGridWrap>
                <ContentCardHeader
                  :title="$t('orders.quotation_basic_info')"
                  size="md"
                  heading-level="h3"
                />
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
                    name="details.accountId"
                  >
                    <FormItem>
                      <FormLabel>{{ $t('company') }}</FormLabel>
                      <FormControl>
                        <Select v-bind="componentField" :disabled="!createMode">
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
                      <FormDescription v-if="createMode">
                        {{ $t('form.cannot_be_changed') }}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1+1+1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="details.createdBy"
                  >
                    <FormItem>
                      <FormLabel>{{ $t('sales_rep') }}</FormLabel>
                      <FormControl>
                        <Select v-bind="componentField">
                          <SelectTrigger>
                            <SelectValue
                              :placeholder="
                                $t('select_entity', { entityName: 'sales_rep' })
                              "
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              v-for="user in users"
                              :key="user._id"
                              :value="user.name || user._id"
                            >
                              {{ user.name }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>

                  <FormField v-slot="{ componentField }" name="details.buyerId">
                    <FormItem>
                      <FormLabel>{{ $t('buyer') }}</FormLabel>
                      <FormControl>
                        <Select
                          v-bind="componentField"
                          :disabled="!selectedCompanyId || buyers.length === 0"
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
                              v-for="buyer in buyers"
                              :key="buyer._id"
                              :value="buyer._id"
                            >
                              {{ buyer.firstName }} {{ buyer.lastName }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        {{ $t('orders.buyer_optional_description') }}
                      </FormDescription>
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
                        <Select v-bind="componentField" :disabled="!createMode">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              v-for="currency in currentCurrencies"
                              :key="currency._id"
                              :value="currency._id"
                            >
                              {{ currency._id }}
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

                  <FormField v-slot="{ componentField }" name="details.channel">
                    <FormItem>
                      <FormLabel>{{ $t('channel') }}</FormLabel>
                      <FormControl>
                        <Select v-bind="componentField">
                          <SelectTrigger>
                            <SelectValue
                              :placeholder="
                                $t('select_entity', { entityName: 'channel' })
                              "
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              v-for="channel in currentChannels"
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
                </FormGrid>
              </FormGridWrap>

              <FormGridWrap class="border-t pt-6">
                <ContentCardHeader
                  :title="$t('orders.quotation_additional_info')"
                  size="md"
                  heading-level="h3"
                />
                <FormGrid design="1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="details.expirationDate"
                  >
                    <FormItem>
                      <FormLabel>{{ $t('expiration_date') }}</FormLabel>
                      <Popover>
                        <PopoverTrigger as-child>
                          <FormControl>
                            <Button
                              variant="outline"
                              :class="
                                cn(
                                  'w-full pl-3 text-left font-normal',
                                  !componentField.modelValue &&
                                    'text-muted-foreground',
                                )
                              "
                            >
                              <span>
                                {{
                                  componentField.modelValue
                                    ? df.format(
                                        new Date(componentField.modelValue),
                                      )
                                    : $t('expiration_date')
                                }}
                              </span>
                              <CalendarIcon class="ml-auto size-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent class="w-auto p-0">
                          <Calendar
                            v-model="componentField.modelValue"
                            @update:model-value="
                              (v) => {
                                if (v) {
                                  componentField.modelValue = new Date(
                                    v.toString(),
                                  ).toISOString();
                                }
                              }
                            "
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        {{ $t('orders.expiration_date_optional') }}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>

                <FormGrid design="1">
                  <FormField v-slot="{ componentField }" name="details.notes">
                    <FormItem>
                      <FormLabel>{{ $t('orders.notes') }}</FormLabel>
                      <FormControl>
                        <Textarea
                          v-bind="componentField"
                          :placeholder="$t('orders.notes_placeholder')"
                          rows="4"
                        />
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
          </ContentEditMainContent>
        </KeepAlive>

        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1 && !createMode"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard
              :create-mode="false"
              :title="$t('item', 2)"
              :description="$t('orders.quotation_items_description')"
            >
              <div class="text-muted-foreground text-sm italic">
                {{ $t('orders.quotation_items_coming_soon') }}
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>

        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 2 && !createMode"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard
              :create-mode="false"
              :title="$t('summary')"
              :description="$t('orders.quotation_summary_description')"
            >
              <ContentDataList :data-list="summaryData" />
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>

        <template #sidebar>
          <ContentEditSummary v-bind="summaryProps" />
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
  <DialogUnsavedChanges
    v-model:open="unsavedChangesDialogOpen"
    :entity-name="entityName"
    :loading="loading"
    @confirm="confirmLeave"
  />
</template>
