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
const { geinsLogWarn, geinsLogError } = useGeinsLog(
  'components/WholesaleBuyerPanel.vue',
);
const { $geinsApi } = useNuxtApp();
const userApi = repo.user($geinsApi);

const open = ref(false);
const validateOnChange = ref(false);
const loading = ref(false);
const entityName = ref('buyer');
const buyerExists = ref(false);
const existingUser = ref<User>();

const initValues = {
  ...props.buyer,
  active: props.mode === 'add' ? true : props.buyer?.active,
};

watch(open, (value) => {
  if (value) {
    form.setValues({
      ...initValues,
    });
  }
});

const formSchema = toTypedSchema(
  z.object({
    active: z.boolean(),
    email: z.string().min(1, { message: t('form.field_required') }),
    phone: z.string().optional(),
    firstName: z.string().min(1, { message: t('form.field_required') }),
    lastName: z.string().min(1, { message: t('form.field_required') }),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    ...initValues,
  },
});

watch(
  form.values,
  useDebounceFn(async () => {
    if (validateOnChange.value) {
      await form.validate();
    }
  }, 500),
  { deep: true },
);

const handleSuccess = () => {
  open.value = false;
  emit('added');
  toast({
    title: t('entity_added', { entityName: entityName.value }),
    variant: 'positive',
  });
};

const handleSave = async () => {
  const validation = await form.validate();
  if (!validation.valid) {
    validateOnChange.value = true;
    return;
  }
  validateOnChange.value = false;
  const newBuyer: WholesaleBuyer = {
    ...props.buyer,
    ...form.values,
    _id: form.values.email || '',
    accountId: props.accountId,
  };
  loading.value = true;

  if (buyerExists.value) {
    try {
      await wholesaleApi.account.id(props.accountId).buyer.assign(newBuyer._id);
      await wholesaleApi.account.id(props.accountId).buyer.update(newBuyer);
      handleSuccess();
      return;
    } catch (error) {
      const message = getErrorMessage(error);
      geinsLogError('error assigning buyer:', message);
      return;
    } finally {
      loading.value = false;
    }
  }

  try {
    if (!newBuyer._id) {
      throw new Error('Buyer ID is required');
    }
    await wholesaleApi.account.id(props.accountId).buyer.create(newBuyer);
    handleSuccess();
  } catch (error) {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);

    if (status === 409) {
      existingUser.value = await userApi.get(newBuyer._id);
      buyerExists.value = true;

      geinsLogWarn('buyer email already in use');
    } else {
      geinsLogError(message);
    }
  } finally {
    loading.value = false;
  }
};

const handleDelete = () => {};

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
                  <FormLabel>{{ t('address.first_name') }}</FormLabel>
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
                  <FormLabel>{{ t('address.last_name') }}</FormLabel>
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
                The provided email address is already associated with this
                existing customer account:
              </AlertDescription>
              <div>
                <div
                  v-if="existingUser"
                  class="mt-3 inline-flex w-auto items-center gap-4 rounded-md border bg-background p-3 px-5"
                >
                  <LucideUser class="size-8 text-muted-foreground" />
                  <div>
                    <p
                      v-if="existingUser.firstName || existingUser.lastName"
                      class="font-medium"
                    >
                      {{ existingUser.firstName }} {{ existingUser.lastName }}
                    </p>
                    <p v-else class="italic">(No name)</p>
                    <p class="text-muted-foreground">
                      {{ existingUser.email }}
                    </p>
                  </div>
                </div>
              </div>
            </Alert>
            <ContentSwitch
              v-model:checked="buyerExists"
              class="mt-4"
              :label="`Assign ${existingUserName} as buyer`"
              description="Toggle this if you want to assign this existing user as a buyer and update it with the information above"
            />
          </div>
        </div>
      </div>
      <SheetFooter>
        <Button variant="outline" @click="handleCancel">
          {{ t('cancel') }}
        </Button>
        <Button :loading="loading" @click.stop="handleSave">
          {{ t(`${mode === 'add' ? mode : 'update'}_entity`, { entityName }) }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
