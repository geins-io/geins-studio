<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useDebounceFn } from '@vueuse/core';
import * as z from 'zod';

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
  organizationNumber: '',
  externalId: '',
  channels: [],
  tags: [],
  salesReps: [],
  addresses: [],
});

/* Addresses */
const getAddressObj = (type: AddressType) =>
  ref<Partial<WholesaleAccountAddress>>({
    addressType: type,
    email: '',
    phone: '',
    companyName: '',
    firstName: '',
    lastName: '',
    careOf: '',
    address1: '',
    address2: '',
    address3: '',
    zip: '',
    city: '',
    region: '',
    country: '',
  });

const billingAddress = getAddressObj('billing');
const deliveryAddress = getAddressObj('delivery');

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
    const account = data.value as WholesaleAccount;
    const wholesaleAccountCreate: WholesaleAccountCreate = (data.value = {
      ...wholesaleAccount.value,
      ...account,
      salesReps: account.salesReps?.map((salesRep) => salesRep._id || ''),
    });
    wholesaleAccount.value = wholesaleAccountCreate;
    billingAddress.value = {
      ...account.addresses?.find(
        (address) => address.addressType === 'billing',
      ),
    };
    deliveryAddress.value = {
      ...account.addresses?.find(
        (address) => address.addressType === 'delivery',
      ),
    };
  }
}
/* Sales reps */
const salesReps = ref<WholesaleSalesRep[]>([]);
const salesRepsResult = await useAPI('/wholesale/salesrep/list');
if (!salesRepsResult.error.value) {
  salesReps.value = salesRepsResult.data.value as WholesaleSalesRep[];
  salesReps.value = salesReps.value.map((salesRep) => ({
    ...salesRep,
    name: salesRep.firstName + ' ' + salesRep.lastName,
  }));
}

// FORMS SETTINGS
const addressSchema = z
  .object({
    email: z.string().optional(),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
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
        organizationNumber: z
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
      delivery: addressSchema,
    }),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    details: wholesaleAccount.value,
    addresses: {
      billing: billingAddress.value,
      delivery: deliveryAddress.value,
    },
  },
});

const formValid = computed(() => form.meta.value.valid);
const formTouched = computed(() => form.meta.value.touched);

watch(
  form.values,
  useDebounceFn(async (values) => {
    wholesaleAccount.value = {
      ...wholesaleAccount.value,
      ...values.details,
      addresses: [
        {
          ...billingAddress.value,
          ...values.addresses?.billing,
        },
        {
          ...deliveryAddress.value,
          ...values.addresses?.delivery,
        },
      ],
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
        companyName: wholesaleAccount.value.name,
      },
    },
  });
  if (changeStep) currentStep.value++;
};

const previousStep = () => {
  currentStep.value--;
};

const useDeliveryAddress = ref(false);

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
  if (wholesaleAccount.value.organizationNumber) {
    dataList.push({
      label: t('wholesale.org_nr'),
      value: wholesaleAccount.value.organizationNumber,
    });
  }
  if (wholesaleAccount.value.salesReps?.length) {
    const displayValue = wholesaleAccount.value.salesReps
      .map((id) => getEntityNameById(id, salesReps.value))
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

const createAccount = async () => {
  loading.value = true;
  const result = await useAPI('/wholesale/account', {
    method: 'POST',
    body: JSON.stringify(wholesaleAccount.value),
  });
  console.log('🚀 ~ createAccount ~ result:', result);
  loading.value = false;
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
                <FormField
                  v-slot="{ componentField }"
                  name="details.organizationNumber"
                >
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
                        v-model="componentField.modelValue"
                        entity-name="sales_rep"
                        :data-set="salesReps"
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
                      <FormInputChannels v-model="componentField.modelValue" />
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
                  name="addresses.billing.companyName"
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
                  name="addresses.billing.address1"
                >
                  <FormItem v-auto-animate>
                    <FormLabel>{{ $t('address.address1') }}</FormLabel>
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
                  name="addresses.billing.address2"
                >
                  <FormItem v-auto-animate>
                    <FormLabel>{{ $t('address.address2') }}</FormLabel>
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
                        v-model="componentField.modelValue"
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
              v-model:checked="useDeliveryAddress"
              label="Add different shipping address"
              description="Activate to add a different shipping address"
            >
              <FormGridWrap>
                <FormGrid design="2+1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.delivery.companyName"
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
                    name="addresses.delivery.address1"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.address1') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.delivery.zip"
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
                    name="addresses.delivery.city"
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
                    name="addresses.delivery.address2"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.address2') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.delivery.country"
                  >
                    <FormItem v-auto-animate>
                      <FormLabel>{{ $t('address.country') }}</FormLabel>
                      <FormControl>
                        <FormInputCountrySelect
                          v-model="componentField.modelValue"
                        />
                        <Input v-bind="componentField" type="text" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="addresses.delivery.region"
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
                      name="addresses.delivery.firstName"
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
                      name="addresses.delivery.lastName"
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
                      name="addresses.delivery.email"
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
                      name="addresses.delivery.phone"
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
