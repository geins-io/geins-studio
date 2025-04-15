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

// COMPUTED GLOBALS
const createMode = ref(route.params.id === newEntityUrlAlias);
const title = computed(() =>
  createMode.value
    ? t('new_entity', { entityName }) +
      (wholesaleAccount.value.name ? ': ' + wholesaleAccount.value.name : '')
    : t('edit_entity', { entityName }),
);

// STEPS SETUP
const currentStep = ref(1);
const totalSteps = ref(2);

// WHOLESALE ACCOUNT
const wholesaleAccount = ref<Partial<WholesaleAccountCreate>>({
  name: '',
  active: false,
  organizationNumber: '',
  externalId: '',
  channels: [],
  tags: [],
  salesReps: [],
  addresses: [],
});

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
        name: z.string().min(1, { message: 'Name is required' }),
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

const saveAccountDetails = async (changeStep: boolean = true) => {
  wholesaleAccount.value = {
    ...wholesaleAccount.value,
    ...form.values.details,
  };
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
  form.setValues({
    details: wholesaleAccount.value,
    addresses: {
      billing: billingAddress.value,
      delivery: deliveryAddress.value,
    },
  });
};

const useDeliveryAddress = ref(false);

/* Sales reps */
const admins = await useAPI('/wholesale/salesrep/list');
console.log('🚀 ~ admins:', admins);
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
              <FormField v-slot="{ componentField }" name="details.externalId">
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
                    <TagsInput
                      :model-value="componentField.modelValue"
                      @update:model-value="
                        componentField['onUpdate:modelValue']
                      "
                    >
                      <TagsInputItem
                        v-for="item in componentField.modelValue"
                        :key="item"
                        :value="item"
                      >
                        <TagsInputItemText />
                        <TagsInputItemDelete />
                      </TagsInputItem>

                      <TagsInputInput placeholder="Choose..." />
                    </TagsInput>
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
                    <TagsInput
                      :model-value="componentField.modelValue"
                      @update:model-value="
                        componentField['onUpdate:modelValue']
                      "
                    >
                      <TagsInputItem
                        v-for="item in componentField.modelValue"
                        :key="item"
                        :value="item"
                      >
                        <TagsInputItemText />
                        <TagsInputItemDelete />
                      </TagsInputItem>

                      <TagsInputInput placeholder="Choose..." />
                    </TagsInput>
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
                    <Input v-bind="componentField" type="text" />
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
          <Button>{{ $t('create_entity', { entityName }) }}</Button>
        </div>
        <template #sidebar>
          <Card class="p-6">
            <h3 class="text-xl font-semibold">Summary</h3>
          </Card>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
