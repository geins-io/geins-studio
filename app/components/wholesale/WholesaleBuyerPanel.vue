<script setup lang="ts">
import * as z from 'zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useDebounceFn } from '@vueuse/core';
import { VisuallyHidden } from 'reka-ui';
import { useToast } from '@/components/ui/toast/use-toast';

const props = withDefaults(
  defineProps<{
    buyer?: WholesaleBuyer;
    accountId: string;
    accountName: string;
    mode: 'edit' | 'add';
  }>(),
  {
    mode: 'add',
  },
);

const emit = defineEmits<{
  (event: 'save', address: Address): void;
  (event: 'delete', id: string): void;
  (event: 'added'): void;
}>();

const { t } = useI18n();
const { wholesaleApi } = useWholesale();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog('components/WholesaleBuyerPanel.vue');
const { $geinsApi } = useNuxtApp();
const userApi = repo.user($geinsApi);

const open = ref(false);
const loading = ref(false);
const entityName = ref('buyer');
const buyerExists = ref(false);
const existingUser = ref<User>();
const updateUser = ref(false);
const buyerCreated = ref('');
const buyerSaved = ref(false);
const newBuyer = ref<WholesaleBuyer>();
const creatingUser = ref(false);

const initValues = {
  ...props.buyer,
  active: props.mode === 'add' ? true : props.buyer?.active,
};

watch(open, (value) => {
  if (value) {
    form.setValues({
      ...initValues,
    });
  } else {
    if (buyerCreated.value && !buyerSaved.value) {
      handleDelete(buyerId.value, false);
    }
    buyerExists.value = false;
    existingUser.value = undefined;
    updateUser.value = false;
    buyerCreated.value = '';
    buyerSaved.value = false;
  }
});

const formSchema = toTypedSchema(
  z.object({
    active: z.boolean(),
    email: z.string().email({ message: t('form.invalid_email') }),
    phone: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    ...initValues,
  },
});

const createNewBuyer = async () => {
  if (!form.values.email) {
    return;
  }
  newBuyer.value = markRaw({
    ...props.buyer,
    ...form.values,
    _id: form.values.email,
    accountId: props.accountId,
  });
  creatingUser.value = true;
  try {
    if (newBuyer.value._id === buyerCreated.value) {
      return;
    }

    if (buyerCreated.value !== '') {
      await handleDelete(buyerCreated.value, false);
      buyerCreated.value = '';
    }
    await wholesaleApi.account.id(props.accountId).buyer.create(newBuyer.value);
    buyerCreated.value = newBuyer.value._id;
    buyerExists.value = false;
    existingUser.value = undefined;
  } catch (error) {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);

    if (status === 409) {
      buyerExists.value = true;
      try {
        existingUser.value = await userApi.get(newBuyer.value._id);
      } catch (error) {
        const message = getErrorMessage(error);
        geinsLogError('error fetching existing user:', message);
        existingUser.value = newBuyer.value;
      }
    } else {
      geinsLogError(message);
    }
  } finally {
    creatingUser.value = false;
  }
};

watch(
  form.values,
  useDebounceFn(async () => {
    if (!form.values.email) {
      return;
    }
    const validation = await form.validate();
    if (!validation.valid) {
      return;
    }
    await createNewBuyer();
  }, 500),
  { deep: true },
);

const saveDisabled = computed(() => {
  if (buyerCreated.value || (buyerExists.value && updateUser.value)) {
    return false;
  }
  return true;
});

const handleSuccess = () => {
  open.value = false;
  emit('added');
  toast({
    title: t('entity_added', { entityName: entityName.value }),
    variant: 'positive',
  });
};

const buyerId = computed(() => {
  return newBuyer.value?._id || props.buyer?._id || '';
});

const handleSave = async () => {
  const validation = await form.validate();
  if (!validation.valid) {
    return;
  }
  loading.value = true;

  newBuyer.value = markRaw({
    ...props.buyer,
    ...form.values,
    _id: form.values.email || '',
    accountId: props.accountId,
  });

  if (buyerCreated.value !== newBuyer.value._id) {
    await createNewBuyer();
  }

  if (buyerExists.value && updateUser.value) {
    try {
      await wholesaleApi.account
        .id(props.accountId)
        .buyer.assign(newBuyer.value._id);
      await wholesaleApi.account
        .id(props.accountId)
        .buyer.update(newBuyer.value);
      buyerSaved.value = true;
      handleSuccess();
    } catch (error) {
      const message = getErrorMessage(error);
      geinsLogError('error updating buyer:', message);
      return;
    }
  }

  if (buyerCreated.value === newBuyer.value._id) {
    try {
      await wholesaleApi.account
        .id(props.accountId)
        .buyer.update(newBuyer.value);
      buyerSaved.value = true;
      handleSuccess();
    } catch (error) {
      const message = getErrorMessage(error);
      geinsLogError('error updating buyer:', message);
      return;
    } finally {
      loading.value = false;
    }
  }
};

const handleDelete = async (
  id: string = buyerId.value,
  showToast: boolean = true,
) => {
  await wholesaleApi.account.id(props.accountId).buyer.delete(id);
  if (showToast) {
    toast({
      title: t('entity_deleted', { entityName: entityName.value }),
      variant: 'positive',
    });
  }
};

const handleCancel = () => {
  open.value = false;
};

const existingUserName = computed(() =>
  existingUser.value?.firstName || existingUser.value?.lastName
    ? `${existingUser.value.firstName} ${existingUser.value.lastName}`
    : existingUser.value?.email,
);
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
      <div class="p-6">
        <form @submit.prevent>
          <FormGridWrap>
            <FormGrid design="1+1">
              <FormField v-slot="{ componentField }" name="firstName">
                <FormItem v-auto-animate>
                  <FormLabel :optional="true">{{
                    t('address.first_name')
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
                <FormItem v-auto-animate>
                  <FormLabel :optional="true">{{
                    t('address.last_name')
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
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.email') }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="email"
                      autocomplete="email"
                      :loading="creatingUser"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem v-auto-animate>
                  <FormLabel :optional="true">{{
                    t('address.phone')
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
                  description="Toggle active state"
                  :model-value="value"
                  @update:model-value="handleChange"
                />
              </FormField>
            </FormGrid>
          </FormGridWrap>
        </form>
        <div
          v-auto-animate
          class="mt-8 flex items-center justify-between border-t pt-8"
        >
          <div v-if="mode === 'edit'">
            <ContentCardHeader
              size="md"
              heading-level="h3"
              :title="
                t('delete_entity', {
                  entityName,
                })
              "
              description="This will delete the buyer and anonymize the customer account connected to it"
            />
            <Button
              size="sm"
              variant="destructive"
              :loading="loading"
              @click.stop="handleDelete"
            >
              {{ t('delete') }}
            </Button>
          </div>
          <div v-else-if="buyerExists" class="w-full space-y-6">
            <Alert variant="info">
              <LucideInfo class="size-4" />
              <AlertTitle>Email already in use!</AlertTitle>
              <AlertDescription>
                The provided email address (<span class="font-bold">{{
                  existingUser?._id
                }}</span
                >) is already associated with this existing customer account.
              </AlertDescription>
              <div class="mt-2">
                <ContentSwitch
                  v-model:checked="updateUser"
                  :label="`Assign ${existingUserName} as buyer for ${accountName}`"
                  description="Toggle this if you want to assign this existing user as a buyer and update it with the information above"
                />
              </div>
            </Alert>
          </div>
        </div>
      </div>
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
