<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { useToast } from '@/components/ui/toast/use-toast';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
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
const selectedCompany = ref<CustomerCompany | undefined>();

// Filtered sales reps based on selected company
const availableSalesReps = computed(() => {
  if (!selectedCompany.value?.salesReps) return [];
  return users.value.filter((user) =>
    selectedCompany.value?.salesReps?.some((rep) => {
      const repId = typeof rep === 'string' ? rep : rep._id;
      return repId === user._id;
    }),
  );
});

const availableBuyers = computed(() => {
  return selectedCompany.value?.buyers || [];
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
      currency: entityData.currency || '',
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
// DELETE FUNCTIONALITY
// =====================================================================================
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, entityListUrl);

// =====================================================================================
// DATA FETCHING
// =====================================================================================
const { useGeinsFetch } = useGeinsApi();

// Fetch companies
const fetchCompanies = async () => {
  companies.value = await customerApi.company.list({
    fields: ['buyers', 'salesreps'],
  });
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

// Watch for company selection changes
watch(
  () => form.values.details?.accountId,
  async (newCompanyId) => {
    if (newCompanyId) {
      selectedCompanyId.value = newCompanyId;
      const company = companies.value.find((c) => c._id === newCompanyId);
      selectedCompany.value = company;
      selectedAccountName.value = company?.name || '';

      // Clear sales rep and buyer when company changes
      if (createMode.value) {
        form.setFieldValue('details.createdBy', '');
        form.setFieldValue('details.buyerId', '');

        // Set currency to first available from company's channels
        if (availableCurrencies.value.length > 0) {
          form.setFieldValue(
            'details.currency',
            availableCurrencies.value[0]?._id,
          );
        }
      }
    } else {
      selectedCompany.value = undefined;
      selectedAccountName.value = '';
      buyers.value = [];
    }
  },
);

// Initialize data
onMounted(async () => {
  await Promise.all([fetchCompanies(), fetchUsers()]);
});

// =====================================================================================
// SUMMARY DATA
// =====================================================================================

// Computed properties for summary
const summary = computed(() => {
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

const settingsSummary = ref<DataItem[]>([]);

const { summaryProps } = useEntityEditSummary({
  createMode,
  formTouched,
  summary,
  settingsSummary,
  entityName,
  entityLiveStatus,
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
  <ContentEditWrap
    v-if="!loading"
    :entity-name="entityName"
    :entity-id="entityId"
    :create-mode="createMode"
    :show-sidebar="showSidebar"
  >
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            :disabled="!hasUnsavedChanges || loading"
            >{{ $t('save_entity', { entityName }) }}</ButtonIcon
          >
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
    <form @submit.prevent>
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
                </FormGrid>
                <FormGrid design="1">
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
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1+1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="details.createdBy"
                  >
                    <FormItem>
                      <FormLabel>Quotation owner</FormLabel>
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
                              v-for="user in availableSalesReps"
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
                              {{ buyer.firstName }} {{ buyer.lastName }}
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
                                $t('select_entity', { entityName: 'currency' })
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
                      <FormControl>
                        <FormInputDate
                          v-bind="componentField"
                          :placeholder="$t('expiration_date')"
                        />
                      </FormControl>
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

        <template #sidebar>
          <ContentEditSummary v-bind="summaryProps" />
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
