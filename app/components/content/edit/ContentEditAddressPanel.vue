<script setup lang="ts">
import * as z from 'zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useDebounceFn } from '@vueuse/core';
import { VisuallyHidden } from 'reka-ui';

const props = defineProps<{
  address: Address;
}>();
const { t } = useI18n();
const emit = defineEmits<{
  (event: 'save', address: Address): void;
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
  const newAddress: Address = {
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
      <div class="p-6">
        <form @submit.prevent>
          <FormGridWrap>
            <FormGrid design="2+1+1">
              <FormField v-slot="{ componentField }" name="company">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.company_name') }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      :autocomplete="`${autocompleteGroup} organization`"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </FormGrid>
            <FormGrid design="2+1+1">
              <FormField v-slot="{ componentField }" name="addressLine1">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.addressLine1') }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      :autocomplete="`${autocompleteGroup} address-line1`"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="zip">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.zip') }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      :autocomplete="`${autocompleteGroup} postal-code`"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="city">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.city') }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      :autocomplete="`${autocompleteGroup} address-level2`"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </FormGrid>
            <FormGrid design="1+1">
              <FormField v-slot="{ componentField }" name="addressLine2">
                <FormItem v-auto-animate>
                  <FormLabel :optional="true">{{
                    t('address.addressLine2')
                  }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      :autocomplete="`${autocompleteGroup} address-line2`"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="country">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.country') }}</FormLabel>
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
              <FormField v-slot="{ componentField }" name="region">
                <FormItem v-auto-animate>
                  <FormLabel :optional="true">{{
                    t('address.region')
                  }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      :autocomplete="`${autocompleteGroup} address-level1`"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </FormGrid>
          </FormGridWrap>
          <FormGridWrap>
            <ContentCardHeader
              size="md"
              heading-level="h3"
              title="Contact person"
              description="Contact person related to the address"
            />

            <FormGrid design="1+1">
              <FormField v-slot="{ componentField }" name="firstName">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('person.first_name') }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      :autocomplete="`${autocompleteGroup} given-name`"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="lastName">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('person.last_name') }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      :autocomplete="`${autocompleteGroup} family-name`"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </FormGrid>
            <FormGrid design="1+1">
              <FormField v-slot="{ componentField }" name="email">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('person.email') }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="email"
                      :autocomplete="`${autocompleteGroup} email`"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="phone">
                <FormItem v-auto-animate>
                  <FormLabel :optional="true">{{
                    t('person.phone')
                  }}</FormLabel>
                  <FormControl>
                    <Input
                      v-bind="componentField"
                      type="text"
                      :autocomplete="`${autocompleteGroup} tel`"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </FormGrid>
          </FormGridWrap>
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
      </div>
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
