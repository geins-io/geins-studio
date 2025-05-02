<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import { useRoute } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useDebounceFn } from '@vueuse/core';
import * as z from 'zod';

// EDIT PAGE OPTIONS
const tabs = ['Account details', 'Buyers'];

// GLOBALS
const { wholesaleApi, deleteAccount } = useWholesale();
const { t } = useI18n();
const route = useRoute();
const { newEntityUrlAlias, getEntityName, getNewEntityUrl } = useEntity(
  route.fullPath,
);
const entityName = getEntityName();
const newEntityUrl = getNewEntityUrl();
const currentTab = ref(0);
const loading = ref(false);
const accountStore = useAccountStore();
const useShippingAddress = ref(false);

// COMPUTED GLOBALS
const createMode = ref(route.params.id === newEntityUrlAlias);
const title = computed(() =>
  createMode.value
    ? t('new_entity', { entityName }) +
      (wholesaleAccount.value.name ? ': ' + wholesaleAccount.value.name : '')
    : wholesaleAccount.value.name || t('edit_entity', { entityName }),
);

// STEPS SETUP
const currentStep = ref(1);
const totalSteps = ref(2);

// WHOLESALE ACCOUNT
const wholesaleAccount = ref<Partial<WholesaleAccountInput>>({
  name: '',
  active: true,
  orgNr: '',
  externalId: '',
  channels: [],
  tags: [],
  salesReps: [],
  addresses: [],
});

/* Addresses */
const addressObj: Address = {
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

const billingAddress = ref(addressObj);
const shippingAddress = ref(addressObj);

const getAddresses = (billing: Address, shipping?: Address) => {
  const addresses = [];
  const billingType = shipping ? 'billing' : 'billingandshipping';

  addresses.push({
    ...billing,
    addressType: billingType,
  });

  if (shipping) {
    addresses.push({
      ...shipping,
      addressType: 'shipping',
    });
  }
  return addresses;
};
const originalAccountData = ref<string>('');

const parseAndSaveData = (account: WholesaleAccount): void => {
  const wholesaleAccountInput: WholesaleAccountInput = {
    ...wholesaleAccount.value,
    ...account,
    salesReps: account.salesReps?.map((salesRep) => salesRep._id || ''),
  };
  wholesaleAccount.value = wholesaleAccountInput;
  originalAccountData.value = JSON.stringify(wholesaleAccountInput);

  billingAddress.value = {
    ...account.addresses?.find(
      (address) =>
        address.addressType === 'billing' ||
        address.addressType === 'billingandshipping',
    ),
  };
  const shipping = account.addresses?.find(
    (address) => address.addressType === 'shipping',
  );
  if (shipping) {
    shippingAddress.value = {
      ...shipping,
    };
  }
  useShippingAddress.value = !!shipping;
};

const hasUnsavedChanges = computed(() => {
  if (createMode.value) return false;

  // Deep compare the current account data with the original data
  const currentData = JSON.stringify(wholesaleAccount.value);

  return currentData !== originalAccountData.value;
});

// GET DATA IF NOT CREATE MODE
if (!createMode.value) {
  const id = ref<string>(String(route.params.id));
  const { data, error } = await useAsyncData<WholesaleAccount>(() =>
    wholesaleApi.account.get(id.value),
  );
  if (error.value) {
    console.error('Error fetching wholesale account:', error.value);
  } else if (data.value) {
    parseAndSaveData(data.value as WholesaleAccount);
  }
}

/* Sales reps data source */
const users = ref<User[]>([]);
const { useGeinsFetch } = useGeinsApi();
const usersResult = await useGeinsFetch<User[]>('/user/list');
if (!usersResult.error.value) {
  users.value = usersResult.data.value as User[];
  users.value = users.value.map((user) => ({
    ...user,
    name: user.firstName + ' ' + user.lastName,
  }));
}
// FORMS SETTINGS
const addressSchema = z.object({
  email: z.string().min(1, { message: t('form.field_required') }),
  phone: z.string().optional(),
  company: z.string().min(1, { message: t('form.field_required') }),
  firstName: z.string().min(1, { message: t('form.field_required') }),
  lastName: z.string().min(1, { message: t('form.field_required') }),
  addressLine1: z.string().min(1, { message: t('form.field_required') }),
  addressLine2: z.string().optional(),
  zip: z.string().min(1, { message: t('form.field_required') }),
  city: z.string().min(1, { message: t('form.field_required') }),
  region: z.string().optional(),
  country: z.string().min(1, { message: t('form.field_required') }),
});

/* Account details */
const formSchema = toTypedSchema(
  z.object({
    details: z
      .object({
        name: z.string().min(1, { message: t('form.field_required') }),
        orgNr: z.string().min(1, { message: t('form.field_required') }),
        externalId: z.string().optional(),
        channels: z.array(z.string()).min(1, {
          message: t('form.field_required'),
        }),
        salesReps: z.array(z.string()).optional(),
      })
      .required(),
    addresses: z.object({
      billing: addressSchema,
      shipping: addressSchema.optional(),
    }),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    details: wholesaleAccount.value,
    addresses: {
      billing: billingAddress.value,
      shipping: shippingAddress.value,
    },
  },
});

const validateOnChange = ref(false);
const stepValidationMap: Record<number, string> = {
  1: 'details',
  2: useShippingAddress.value ? 'addresses' : 'billing',
};

const validateSteps = async (steps: number[]) => {
  const validation = await form.validate();
  const errors = Object.keys(validation.errors);
  const stepKeys = steps.map((step) => stepValidationMap[step]);
  const stepErrors = errors.filter((error) =>
    stepKeys.some((stepKey) => stepKey && error.includes(stepKey)),
  );
  if (stepErrors.length > 0) {
    return false;
  }
  return true;
};

const formValid = computed(() => form.meta.value.valid);
const formTouched = computed(() => form.meta.value.touched);

watch(
  form.values,
  useDebounceFn(async (values) => {
    if (validateOnChange.value) {
      await form.validate();
    }
    const addresses = getAddresses(
      {
        ...billingAddress.value,
        ...values.addresses?.billing,
      },
      useShippingAddress.value
        ? {
            ...shippingAddress.value,
            ...values.addresses?.shipping,
          }
        : undefined,
    );
    wholesaleAccount.value = {
      ...wholesaleAccount.value,
      ...values.details,
      addresses,
    };
  }, 500),
  { deep: true },
);

const saveAccountDetails = async () => {
  const stepValid = await validateSteps([1]);

  if (stepValid) {
    validateOnChange.value = false;
    form.resetForm();
    form.setValues({
      details: {
        ...wholesaleAccount.value,
      },
      addresses: {
        billing: {
          company: wholesaleAccount.value.name,
        },
      },
    });

    currentStep.value++;
  } else {
    validateOnChange.value = true;
  }
};

const previousStep = () => {
  currentStep.value--;
};

const getEntityNameById = (id: string, dataList: GeinsEntity[]) => {
  const entity = dataList?.find((entity) => entity._id === id);
  return entity ? entity.name : '';
};

// SUMMMARY
const summary = computed<DataList>(() => {
  const dataList: DataList = [];
  if (wholesaleAccount.value.name) {
    dataList.push({
      label: t('wholesale.account_name'),
      value: wholesaleAccount.value.name,
    });
  }
  if (wholesaleAccount.value.orgNr) {
    dataList.push({
      label: t('wholesale.org_nr'),
      value: wholesaleAccount.value.orgNr,
    });
  }
  if (wholesaleAccount.value.salesReps?.length) {
    const displayValue = wholesaleAccount.value.salesReps
      .map((id) => getEntityNameById(id, users.value))
      .join(', ');
    dataList.push({
      label: t('wholesale.sales_reps'),
      value: displayValue,
    });
  }
  if (wholesaleAccount.value.channels?.length) {
    const displayValue = wholesaleAccount.value.channels
      .map((id) => accountStore.getChannelNameById(id))
      .join(', ');
    dataList.push({
      label: t('wholesale.channels'),
      value: displayValue,
    });
  }
  return dataList;
});

// CREATE ACCOUNT
const { toast } = useToast();
const createAccount = async () => {
  loading.value = true;

  try {
    const stepsValid = await validateSteps([1, 2]);

    if (!stepsValid) {
      validateOnChange.value = true;
      loading.value = false;
      return;
    }
    validateOnChange.value = false;
    const result: GeinsEntity = await wholesaleApi.account.create(
      wholesaleAccount.value as WholesaleAccountInput,
    );
    const id = result._id || '';

    const newUrl = newEntityUrl.replace(newEntityUrlAlias, id);
    await useRouter().replace(newUrl);

    toast({
      title: t('entity_created', { entityName }),
      variant: 'positive',
    });
  } catch (error) {
    const _errorMessage = getErrorMessage(error);
    toast({
      title: t('error_creating_entity', { entityName }),
      variant: 'negative',
    });

    return;
  } finally {
    loading.value = false;
  }
};

const deleteAcc = async (id?: string) => {
  const deleted = await deleteAccount(id);
  if (deleted) {
    toast({
      title: t('entity_deleted', { entityName }),
      variant: 'positive',
    });
    navigateTo('/wholesale/account/list');
  } else {
    toast({
      title: t('entity_delete_failed', { entityName }),
      variant: 'negative',
    });
  }
};

const saveAddress = async (address: Address) => {
  console.log('🚀 ~ saveAddress ~ address:', address);
  // update the address in wholesaleaAccount.addresses with the same _id to the new address
  const updatedAddresses = wholesaleAccount.value.addresses?.map((addr) => {
    if (addr._id === address._id) {
      return { ...addr, ...address };
    }
    return addr;
  });
  wholesaleAccount.value.addresses = updatedAddresses;
  billingAddress.value = address;
};
</script>

<template>
  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="title">
        <ContentActionBar>
          <ButtonIcon v-if="!createMode" icon="save">{{
            $t('save_entity', { entityName })
          }}</ButtonIcon>
          <DropdownMenu v-if="!createMode">
            <DropdownMenuTrigger as-child>
              <Button class="size-9 p-1" size="sm" variant="outline">
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
              <DropdownMenuItem @click="deleteAcc(wholesaleAccount._id)">
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
      <KeepAlive>
        <ContentEditMain v-if="currentTab === 0">
          <ContentEditCard
            :create-mode="createMode"
            :step="1"
            :total-steps="totalSteps"
            :current-step="currentStep"
            :step-valid="formValid"
            title="Account details"
            @next="saveAccountDetails"
          >
            <FormGridWrap>
              <FormGrid design="2+1+1">
                <FormField v-slot="{ componentField }" name="details.name">
                  <FormItem v-auto-animate>
                    <FormLabel>{{ $t('wholesale.account_name') }}</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField v-slot="{ componentField }" name="details.orgNr">
                  <FormItem v-auto-animate>
                    <FormLabel>{{ $t('wholesale.org_nr') }}</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField
                  v-slot="{ componentField }"
                  name="details.externalId"
                >
                  <FormItem v-auto-animate>
                    <FormLabel :optional="true">{{
                      $t('wholesale.external_id')
                    }}</FormLabel>
                    <FormControl>
                      <Input v-bind="componentField" type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </FormGrid>
              <FormGrid design="1">
                <FormField v-slot="{ componentField }" name="details.salesReps">
                  <FormItem v-auto-animate>
                    <FormLabel :optional="true">{{
                      $t('wholesale.sales_reps')
                    }}</FormLabel>
                    <FormControl>
                      <FormInputTagsSearch
                        :model-value="componentField.modelValue"
                        entity-name="sales_rep"
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
                <FormField v-slot="{ componentField }" name="details.channels">
                  <FormItem v-auto-animate>
                    <FormLabel>{{ $t('wholesale.channels') }}</FormLabel>
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
            </FormGridWrap>
          </ContentEditCard>
          <ContentEditCard
            :create-mode="createMode"
            :step="2"
            :total-steps="totalSteps"
            :current-step="currentStep"
            title="Billing and shipping addresses"
            @previous="previousStep"
          >
            <Tabs default-value="billing">
              <TabsList class="grid w-full grid-cols-2">
                <TabsTrigger value="billing"> Billing address </TabsTrigger>
                <TabsTrigger value="shipping"> Shipping address </TabsTrigger>
              </TabsList>
              <TabsContent value="billing">
                <ContentAddressDisplay
                  :address="billingAddress"
                  @save="saveAddress"
                />
                <ContentEditAddressPanel :address="billingAddress">
                  <Button>Edit</Button>
                </ContentEditAddressPanel>
              </TabsContent>
              <TabsContent value="shipping">SHIPPING</TabsContent>
            </Tabs>

            <template #create>
              <FormGridWrap>
                <FormGrid design="2+1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.company"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.company_name') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="2+1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.addressLine1"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.addressLine1') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.zip"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.zip') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.city"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.city') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.addressLine2"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel :optional="true">{{
                        $t('address.addressLine2')
                      }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.country"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.country') }}</FormLabel>
                      <FormControl>
                        <FormInputCountrySelect
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
                <FormGrid design="1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.region"
                  >
                    <FormItem>
                      <FormLabel :optional="true">{{
                        $t('address.region')
                      }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
              </FormGridWrap>
              <ContentCardHeader
                size="md"
                heading-level="h3"
                title="Contact person"
                description="Contact person related to the address"
              />
              <FormGridWrap>
                <FormGrid design="1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.firstName"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.first_name') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.lastName"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.last_name') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.email"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.email') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.billing.phone"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel :optional="true">{{
                        $t('address.phone')
                      }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
              </FormGridWrap>
              <ContentCardHeader
                size="md"
                heading-level="h3"
                title="Shipping address"
              />
              <ContentSwitch
                v-model:checked="useShippingAddress"
                label="Add different shipping address"
                description="Activate to add a different shipping address"
              >
                <FormGridWrap>
                  <FormGrid design="2+1+1">
                    <FormField
                      v-slot="{ componentField }"
                      name="addresses.shipping.company"
                    >
                      <FormItem v-auto-animate>
                        <FormLabel>{{ $t('address.company_name') }}</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                  <FormGrid design="2+1+1">
                    <FormField
                      v-slot="{ componentField }"
                      name="addresses.shipping.addressLine1"
                    >
                      <FormItem v-auto-animate>
                        <FormLabel>{{ $t('address.addressLine1') }}</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField
                      v-slot="{ componentField }"
                      name="addresses.shipping.zip"
                    >
                      <FormItem v-auto-animate>
                        <FormLabel>{{ $t('address.zip') }}</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField
                      v-slot="{ componentField }"
                      name="addresses.shipping.city"
                    >
                      <FormItem v-auto-animate>
                        <FormLabel>{{ $t('address.city') }}</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                  <FormGrid design="1+1">
                    <FormField
                      v-slot="{ componentField }"
                      name="addresses.shipping.addressLine2"
                    >
                      <FormItem v-auto-animate>
                        <FormLabel :optional="true">{{
                          $t('address.addressLine2')
                        }}</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField
                      v-slot="{ componentField }"
                      name="addresses.shipping.country"
                    >
                      <FormItem v-auto-animate>
                        <FormLabel>{{ $t('address.country') }}</FormLabel>
                        <FormControl>
                          <FormInputCountrySelect
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
                  <FormGrid design="1+1">
                    <FormField
                      v-slot="{ componentField }"
                      name="addresses.shipping.region"
                    >
                      <FormItem v-auto-animate>
                        <FormLabel :optional="true">{{
                          $t('address.region')
                        }}</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" type="text" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                  <ContentCardHeader
                    size="md"
                    heading-level="h3"
                    title="Contact person"
                    description="Contact person related to the address"
                  />
                  <FormGridWrap>
                    <FormGrid design="1+1">
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.firstName"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel>{{ $t('address.first_name') }}</FormLabel>
                          <FormControl>
                            <Input v-bind="componentField" type="text" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.lastName"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel>{{ $t('address.last_name') }}</FormLabel>
                          <FormControl>
                            <Input v-bind="componentField" type="text" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </FormGrid>
                    <FormGrid design="1+1">
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.email"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel>{{ $t('address.email') }}</FormLabel>
                          <FormControl>
                            <Input v-bind="componentField" type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                      <FormField
                        v-slot="{ componentField }"
                        name="addresses.shipping.phone"
                      >
                        <FormItem v-auto-animate>
                          <FormLabel :optional="true">
                            {{ $t('address.phone') }}
                          </FormLabel>
                          <FormControl>
                            <Input v-bind="componentField" type="text" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </FormGrid>
                  </FormGridWrap>
                </FormGridWrap>
              </ContentSwitch>
            </template>
          </ContentEditCard>
          <div v-if="createMode" class="flex flex-row justify-end gap-4">
            <Button variant="secondary">Cancel</Button>
            <Button :loading="loading" @click="createAccount">{{
              $t('create_entity', { entityName })
            }}</Button>
          </div>
          <template #sidebar>
            <ContentEditSummary
              v-model:active="wholesaleAccount.active"
              :entity-name="entityName"
              :create-mode="createMode"
              :form-touched="formTouched"
              :summary="summary"
            />
          </template>
        </ContentEditMain>
      </KeepAlive>
      <KeepAlive>
        <ContentEditMain v-if="currentTab === 1">
          <ContentEditCard
            :create-mode="createMode"
            title="Buyers"
            description="Add buyers to the account"
          >
            LALALA...
          </ContentEditCard>
        </ContentEditMain>
      </KeepAlive>
    </form>
  </ContentEditWrap>
</template>
