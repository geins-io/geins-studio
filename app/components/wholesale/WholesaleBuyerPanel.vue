<script setup lang="ts">
import * as z from 'zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useDebounceFn } from '@vueuse/core';
import { VisuallyHidden } from 'reka-ui';
import { useToast } from '@/components/ui/toast/use-toast';

const props = withDefaults(
  defineProps<{
    buyer?: WholesaleBuyerUpdate;
    accountId: string;
    accountName: string;
    mode: 'edit' | 'add';
    priceLists: WholesalePriceList[];
  }>(),
  {
    mode: 'add',
  },
);

const emit = defineEmits<{
  (event: 'added' | 'removed'): void;
}>();

const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog('components/WholesaleBuyerPanel.vue');
const { wholesaleApi, customerApi } = useGeinsRepository();

const entityName = 'buyer';

const open = defineModel<boolean>('open');
const loading = ref(false);
const buyerExistsAsCustomer = ref(false);
const existingCustomer = ref<Customer>();
const updateCustomer = ref(false);
const newBuyer = ref<WholesaleBuyerCreate>();
const isChecking = ref(false);
const isDeleting = ref(false);
const formValid = ref(false);
const buyer = toRef(props, 'buyer');
const priceLists = toRef(props, 'priceLists');
const buyerActive = computed(() =>
  props.mode === 'edit' ? props.buyer?.active : true,
);

watch(open, (value) => {
  if (value) {
    form.setValues({
      ...buyer.value,
      email: buyer.value?._id,
      active: buyerActive.value,
    });
  } else {
    buyerExistsAsCustomer.value = false;
    existingCustomer.value = undefined;
    updateCustomer.value = false;
    loading.value = false;
  }
});

const formSchema = toTypedSchema(
  z.object({
    active: z.boolean().optional(),
    email: z.email({ message: t('form.invalid_email') }),
    phone: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    restrictToDedicatedPriceLists: z.boolean().optional(),
    priceLists: z.array(z.string()).optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
});

// Check if customer exists without creating a buyer
const checkCustomerExists = async (email: string) => {
  if (!email) return;

  // Skip check if we're in edit mode and email hasn't changed
  if (props.mode === 'edit' && buyer.value?._id === email) {
    buyerExistsAsCustomer.value = false;
    return;
  }

  isChecking.value = true;
  try {
    existingCustomer.value = await customerApi.get(email);
    buyerExistsAsCustomer.value = true;
  } catch (error) {
    const status = getErrorStatus(error);
    if (status === 404) {
      buyerExistsAsCustomer.value = false;
      existingCustomer.value = undefined;
    } else {
      const message = getErrorMessage(error);
      geinsLogError('error checking existing customer:', message);
    }
  } finally {
    isChecking.value = false;
  }
};

watch(
  () => form.values.email,
  useDebounceFn(async (email) => {
    if (!email) return;

    const validation = await form.validate();
    formValid.value = validation.valid;
    if (!formValid.value) return;

    await checkCustomerExists(email);
  }, 500),
);

const saveDisabled = computed(() => {
  if (
    (buyerExistsAsCustomer.value && !updateCustomer.value) ||
    isChecking.value ||
    !formValid.value
  ) {
    return true;
  }
  return false;
});

const handleSuccess = () => {
  open.value = false;
  newBuyer.value = undefined;
  emit('added');
  const feedbackWord = props.mode === 'edit' ? 'updated' : 'added';
  toast({
    title: t(`entity_${feedbackWord}`, { entityName }),
    variant: 'positive',
  });
};

const buyerId = computed(() => {
  return newBuyer.value?._id || props.buyer?._id || '';
});

const hasPricelistsAssigned = computed(() => {
  return (
    form.values.priceLists !== undefined && form.values.priceLists.length > 0
  );
});
const assignPriceLists = ref(false);

watch(
  hasPricelistsAssigned,
  (newValue) => {
    if (newValue) {
      assignPriceLists.value = true;
    } else {
      form.setFieldValue('restrictToDedicatedPriceLists', false);
    }
  },
  { immediate: true },
);

const handleSave = async () => {
  const validation = await form.validate();
  if (!validation.valid) {
    return;
  }
  loading.value = true;

  try {
    newBuyer.value = markRaw({
      ...form.values,
      _id: form.values.email || '',
      accountId: props.accountId,
      priceLists: assignPriceLists.value ? form.values.priceLists : [],
      restrictToDedicatedPriceLists: assignPriceLists.value
        ? form.values.restrictToDedicatedPriceLists
        : false,
    });

    const id = props.buyer?._id || newBuyer.value._id;

    if (props.mode === 'edit') {
      // Just updating an existing buyer
      await wholesaleApi.account
        .id(props.accountId)
        .buyer.update(id, newBuyer.value);
    } else if (buyerExistsAsCustomer.value) {
      // Customer exists, so assign and update
      await wholesaleApi.account
        .id(props.accountId)
        .buyer.assign(newBuyer.value._id);
      await wholesaleApi.account
        .id(props.accountId)
        .buyer.update(id, newBuyer.value);
    } else {
      // Create a new buyer
      await wholesaleApi.account
        .id(props.accountId)
        .buyer.create(newBuyer.value);
    }

    handleSuccess();
  } catch (error) {
    const feedbackWord = props.mode === 'edit' ? 'updating' : 'adding';
    toast({
      title: t(`error_${feedbackWord}_entity`, { entityName }),
      description: t('feedback_error_description'),
      variant: 'negative',
    });
    const message = getErrorMessage(error);
    geinsLogError('error saving buyer:', message);
  } finally {
    loading.value = false;
  }
};

const handleRemoveClick = async () => {
  await removeBuyer();
  toast({
    title: t('entity_removed', { entityName }),
    variant: 'positive',
  });
  open.value = false;
  emit('removed');
};

const removeBuyer = async (id: string = buyerId.value) => {
  isDeleting.value = true;
  try {
    await wholesaleApi.account.id(props.accountId).buyer.delete(id);
  } catch (error) {
    const message = getErrorMessage(error);
    geinsLogError('error removing buyer:', message);
  } finally {
    isDeleting.value = false;
  }
};

const handleCancel = () => {
  open.value = false;
  if (!hasPricelistsAssigned.value) {
    assignPriceLists.value = false;
  }
};

const existingCustomerName = computed(() => {
  // First try to get name from existing customer
  if (existingCustomer.value?.firstName || existingCustomer.value?.lastName) {
    return `${existingCustomer.value.firstName} ${existingCustomer.value.lastName}`.trim();
  }

  return existingCustomer.value?._id || 'customer';
});
</script>
<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <slot />
    </SheetTrigger>
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>{{ $t(`${mode}_entity`, { entityName }) }}</SheetTitle>
        <VisuallyHidden>
          <SheetDescription>
            {{ $t(`${mode}_entity`, { entityName }) }}
          </SheetDescription>
        </VisuallyHidden>
      </SheetHeader>
      <SheetBody>
        <form @submit.prevent>
          <FormGridWrap>
            <FormGrid design="1+1">
              <FormField v-slot="{ componentField }" name="firstName">
                <FormItem>
                  <FormLabel :optional="true">{{
                    t('person.first_name')
                  }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      autocomplete="given-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="lastName">
                <FormItem>
                  <FormLabel :optional="true">{{
                    t('person.last_name')
                  }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      autocomplete="family-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </FormGrid>
            <FormGrid design="1+1">
              <FormField v-slot="{ componentField }" name="email">
                <FormItem>
                  <FormLabel>{{ t('person.email') }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="email"
                      autocomplete="email"
                      :loading="isChecking"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem>
                  <FormLabel :optional="true">{{
                    t('person.phone')
                  }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      autocomplete="tel"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </FormGrid>
            <FormGrid design="1">
              <FormField v-slot="{ value, handleChange }" name="active">
                <FormItemSwitch
                  :label="t('active')"
                  :description="t('toggle_active_state')"
                  :model-value="value"
                  @update:model-value="handleChange"
                />
              </FormField>
            </FormGrid>
          </FormGridWrap>
        </form>
        <div class="my-8">
          <ContentCardHeader
            size="md"
            heading-level="h3"
            :title="$t('price_list', 2)"
            class="mb-4"
            description="A price list assigned to a buyer will get the highest priority, meaning that enforced price lists on the account level will be overridden."
          />
          <ContentSwitch
            v-model:checked="assignPriceLists"
            label="Assign price lists to buyer"
            description="Chosen price lists will be applied when this buyer logs in"
          >
            <FormGridWrap>
              <FormGrid design="1">
                <FormField
                  v-slot="{ componentField }"
                  name="priceLists"
                  class="mb-4"
                >
                  <FormItem>
                    <FormLabel>{{ $t('price_list', 2) }}</FormLabel>
                    <FormControl>
                      <FormInputTagsSearch
                        :model-value="componentField.modelValue"
                        entity-name="price_list"
                        :data-set="priceLists"
                        @update:model-value="
                          componentField['onUpdate:modelValue']
                        "
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
                <FormField
                  v-slot="{ value, handleChange }"
                  name="restrictToDedicatedPriceLists"
                >
                  <FormItem>
                    <FormLabel>Product access</FormLabel>
                    <FormControl>
                      <FormItemSwitch
                        label="Restrict to assigned price lists"
                        description="If disabled, this buyer can access all products available to the account"
                        :disabled="!hasPricelistsAssigned"
                        :model-value="value"
                        @update:model-value="handleChange"
                      />
                    </FormControl>
                  </FormItem>
                </FormField>
              </FormGrid>
            </FormGridWrap>
          </ContentSwitch>
        </div>
        <div class="mt-4 border-t pt-4 sm:mt-8 sm:pt-8">
          <div
            v-if="mode === 'edit'"
            class="mb-8 flex items-center justify-between"
          >
            <ContentCardHeader
              size="md"
              heading-level="h3"
              :title="
                t('remove_entity', {
                  entityName,
                })
              "
              :description="t('wholesale.buyers_remove_description')"
            />
            <Button
              size="sm"
              variant="destructive"
              :loading="isDeleting"
              @click.stop="handleRemoveClick"
            >
              {{ t('remove') }}
            </Button>
          </div>
          <div v-if="buyerExistsAsCustomer" class="w-full space-y-6">
            <Feedback type="info">
              <template #title>
                {{ t('wholesale.buyers_feedback_existing_title') }}
              </template>
              <template #description>
                <i18n-t
                  keypath="wholesale.buyers_feedback_existing_description"
                  scope="global"
                  tag="span"
                >
                  <template #email>
                    <span class="font-bold">{{ existingCustomer?._id }}</span>
                  </template>
                </i18n-t>
              </template>
              <template #actions>
                <ContentSwitch
                  v-model:checked="updateCustomer"
                  :label="
                    t('wholesale.buyers_assign_existing', {
                      customerName: existingCustomerName,
                      accountName: accountName,
                    })
                  "
                  :description="t('wholesale.buyers_assign_description')"
                />
              </template>
            </Feedback>
          </div>
        </div>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="handleCancel">
          {{ t('cancel') }}
        </Button>
        <Button
          :loading="loading"
          :disabled="saveDisabled"
          @click.stop="handleSave"
        >
          {{ t(`${mode === 'add' ? mode : 'update'}_entity`, { entityName }) }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
