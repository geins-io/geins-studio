<script setup lang="ts">
import * as z from 'zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useDebounceFn } from '@vueuse/core';
import { VisuallyHidden } from 'reka-ui';

const props = defineProps<{
  address: AddressUpdate;
}>();
const { t } = useI18n();
const emit = defineEmits<{
  (event: 'save', address: AddressUpdate): void;
  (event: 'delete', id: string): void;
}>();

const open = ref(false);
const validateOnChange = ref(false);
const loading = ref(false);
const addressHasValues = ref(false);

onMounted(() => {
  addressHasValues.value = !!(props.address.addressLine1 && props.address.zip);
});

watch(open, (value) => {
  if (value) {
    form.setValues({
      ...props.address,
    });
  }
});

const formSchema = toTypedSchema(
  z.object({
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
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    ...props.address,
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

const autocompleteGroup = computed(() => {
  return props.address.addressType === 'shipping' ? 'shipping' : 'billing';
});
const entityName = computed(() => {
  return `${autocompleteGroup.value}_address`;
});

const handleSave = async () => {
  const validation = await form.validate();
  if (!validation.valid) {
    validateOnChange.value = true;
    return;
  }
  validateOnChange.value = false;
  const newAddress: AddressUpdate = {
    ...props.address,
    ...form.values,
  };

  emit('save', newAddress);
  open.value = false;
};

const handleDelete = () => {
  const id = props.address._id || 'new';
  loading.value = true;
  emit('delete', id);
  open.value = false;
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};

const handleCancel = () => {
  open.value = false;
};
</script>
<template>
  <Sheet v-model:open="open">
    <SheetTrigger as-child>
      <slot />
    </SheetTrigger>
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>{{ $t('edit_entity', { entityName }) }}</SheetTitle>
        <VisuallyHidden>
          <SheetDescription>
            {{ $t('edit_entity', { entityName }) }}
          </SheetDescription>
        </VisuallyHidden>
      </SheetHeader>
      <SheetBody>
        <form @submit.prevent>
          <ContentAddressForm />
        </form>
        <div
          v-if="autocompleteGroup === 'shipping' && addressHasValues"
          class="mt-8 flex items-center justify-between border-t pt-8"
        >
          <ContentCardHeader
            size="md"
            heading-level="h3"
            :title="
              t('delete_entity', {
                entityName,
              })
            "
            description="Delete this shipping address from your account"
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
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="handleCancel">
          {{ t('cancel') }}
        </Button>
        <Button @click.stop="handleSave">
          {{ t('update_entity', { entityName }) }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
