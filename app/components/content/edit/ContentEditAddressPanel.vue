<script setup lang="ts">
import * as z from 'zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';

const props = defineProps<{
  address: Address;
}>();
const { t } = useI18n();
const emit = defineEmits<{
  (event: 'save', address: Address): void;
}>();

const open = ref(false);

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

const entityName = computed(() => {
  const entity =
    props.address.addressType === 'shipping' ? 'shipping' : 'billing';
  return `${entity}_address`;
});

const handleSave = async () => {
  const validation = await form.validate();
  if (!validation.valid) {
    return;
  }
  console.log('🚀 ~ handleSave ~ form.values:', form.values);
  emit('save', form.values);
  open.value = false;
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
      </SheetHeader>
      <div class="p-6">
        <form @submit.prevent>
          <FormGridWrap>
            <FormGrid design="2+1+1">
              <FormField v-slot="{ componentField }" name="company">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.company_name') }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" type="text" />
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
                    <Input v-bind="componentField" type="text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="zip">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.zip') }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" type="text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="city">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.city') }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" type="text" />
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
                    <Input v-bind="componentField" type="text" />
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

            <FormGrid design="1+1">
              <FormField v-slot="{ componentField }" name="firstName">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.first_name') }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" type="text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="lastName">
                <FormItem v-auto-animate>
                  <FormLabel>{{ t('address.last_name') }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" type="text" />
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
                    <Input v-bind="componentField" type="email" />
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
                    <Input v-bind="componentField" type="text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </FormGrid>
          </FormGridWrap>
        </form>
      </div>
      <SheetFooter>
        <Button variant="outline" @click="handleCancel">
          {{ t('cancel') }}
        </Button>
        <Button @click="handleSave">
          {{ t('update_entity', { entityName }) }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
