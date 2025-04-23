<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import { useRoute } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useDebounceFn } from '@vueuse/core';
import * as z from 'zod';
import { parse } from 'vue/compiler-sfc';

// EDIT PAGE OPTIONS
const tabs = ['Account details', 'Buyers', 'Pricing', 'Orders'];

// GLOBALS
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
const wholesaleAccount = ref<Partial<WholesaleAccountCreate>>({
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
const addressObj: WholesaleAccountAddress = {
  email: '',
  phone: '',
  company: '',
  firstName: '',
  lastName: '',
  careOf: '',
  addressLine1: '',
  addressLine2: '',
  addressLine3: '',
  zip: '',
  city: '',
  region: '',
  country: 'HK',
};

const billingAddress = ref(addressObj);
const shippingAddress = ref(addressObj);

const getAddresses = (
  billing: WholesaleAccountAddress,
  shipping?: WholesaleAccountAddress,
) => {
  const addresses = [];
  const billingType = shipping ? 'billing' : 'billingAndShipping';

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
const parseAndSaveData = (account: WholesaleAccount): void => {
  const wholesaleAccountCreate: WholesaleAccountCreate = {
    ...wholesaleAccount.value,
    ...account,
    salesReps: account.salesReps?.map((salesRep) => salesRep._id || ''),
  };
  wholesaleAccount.value = wholesaleAccountCreate;
  billingAddress.value = {
    ...account.addresses?.find(
      (address) =>
        address.addressType === 'billing' ||
        address.addressType === 'billingAndShipping',
    ),
  };
  const shipping = account.addresses?.find(
    (address) => address.addressType === 'shipping',
  );
  useShippingAddress.value = !!shipping;
  shippingAddress.value = {
    ...shipping,
  };
};
// GET DATA IF NOT CREATE MODE
if (!createMode.value) {
  const { data, error } = await useAPI(
    `/wholesale/account/${route.params.id}`,
    {
      method: 'GET',
    },
  );
  if (error.value) {
    console.error('Error fetching wholesale account:', error.value);
  } else if (data.value) {
    parseAndSaveData(data.value as WholesaleAccount);
  }
}

/* Sales reps data source */
const users = ref<User[]>([]);
const usersResult = await useAPI('/user/list');
if (!usersResult.error.value) {
  users.value = usersResult.data.value as User[];
  users.value = users.value.map((user) => ({
    ...user,
    name: user.firstName + ' ' + user.lastName,
  }));
}

// FORMS SETTINGS
const addressSchema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    zip: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    country: z.string().optional(),
  })
  .optional();

/* Account details */
const formSchema = toTypedSchema(
  z.object({
    details: z
      .object({
        name: z.string().min(1, { message: 'Account name is required' }),
        orgNr: z
          .string()
          .min(1, { message: 'Organization number is required' }),
        externalId: z.string().optional(),
        channels: z.array(z.string()).min(1, {
          message: 'At least one channel is required',
        }),
        salesReps: z.array(z.string()).optional(),
      })
      .required(),
    addresses: z.object({
      billing: addressSchema,
      shipping: addressSchema,
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

const formValid = computed(() => form.meta.value.valid);
const formTouched = computed(() => form.meta.value.touched);

watch(
  form.values,
  useDebounceFn(async (values) => {
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
    // TODO: solve before launch, need to trigger validation here if channel is last
    if (wholesaleAccount.value.channels?.length) {
      await form.validate();
    }
  }, 500),
  { deep: true },
);

const saveAccountDetails = async (changeStep: boolean = true) => {
  form.setValues({
    addresses: {
      billing: {
        company: wholesaleAccount.value.name,
      },
    },
  });
  if (changeStep) currentStep.value++;
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
    const result: GeinsEntity = await useNuxtApp().$geinsApi(
      '/wholesale/account',
      {
        method: 'POST',
        body: JSON.stringify(wholesaleAccount.value),
      },
    );
    const id = result._id || '';

    const newUrl = newEntityUrl.replace(newEntityUrlAlias, id);
    await useRouter().replace(newUrl);

    parseAndSaveData(result as WholesaleAccount);

    toast({
      title: t('entity_created', { entityName }),
      variant: 'positive',
    });

    loading.value = false;
  } catch (error) {
    toast({
      title: t('error_creating_entity', { entityName }),
      description: error as string,
      variant: 'negative',
    });
    console.error('Error creating account:', error);
    loading.value = false;
    return;
  }
};
</script>

<template>
  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="title">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="new"
            variant="secondary"
            :href="newEntityUrl"
          >
            {{ $t('new') }}
          </ButtonIcon>
          <ButtonIcon v-if="!createMode" icon="copy" variant="secondary"
            >{{ $t('copy') }}
          </ButtonIcon>
          <!-- <Button v-if="createMode" variant="secondary">Cancel</Button> -->
          <ButtonIcon v-if="!createMode" icon="save">{{
            $t('save_entity', { entityName })
          }}</ButtonIcon>
        </ContentActionBar>
        <template v-if="!createMode" #tabs>
          <ContentTabs
            v-model:current-tab="currentTab"
            :tabs="tabs"
            class="mt-5"
          />
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
                    <FormLabel>{{ $t('wholesale.external_id') }}</FormLabel>
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
                    <FormLabel>{{ $t('wholesale.sales_reps') }}</FormLabel>
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
            description="Optional step, this information can be added later on"
            @previous="previousStep"
          >
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
                    <FormLabel>{{ $t('address.addressLine2') }}</FormLabel>
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
                  <FormItem v-auto-animate>
                    <FormLabel>{{ $t('address.region') }}</FormLabel>
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
                    <FormLabel>{{ $t('address.phone') }}</FormLabel>
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
                      <FormLabel>{{ $t('address.addressLine2') }}</FormLabel>
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
                      <FormLabel>{{ $t('address.region') }}</FormLabel>
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
                        <FormLabel>{{ $t('address.phone') }}</FormLabel>
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
          </ContentEditCard>
          <div v-if="createMode" class="flex flex-row justify-end gap-4">
            <Button variant="secondary">Cancel</Button>
            <Button
              :disabled="!formValid"
              :loading="loading"
              @click="createAccount"
              >{{ $t('create_entity', { entityName }) }}</Button
            >
          </div>
          <template #sidebar>
            <ContentEditSummary
              v-model:active="wholesaleAccount.active"
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
