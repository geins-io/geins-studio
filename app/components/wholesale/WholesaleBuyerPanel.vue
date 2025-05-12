<script setup lang="ts">
import * as z from 'zod';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useDebounceFn } from '@vueuse/core';
import { VisuallyHidden } from 'reka-ui';

const props = withDefaults(
  defineProps<{
    buyer?: WholesaleBuyer;
    mode: 'edit' | 'add';
  }>(),
  {
    mode: 'add',
  },
);
const { t } = useI18n();
const emit = defineEmits<{
  (event: 'save', address: Address): void;
  (event: 'delete', id: string): void;
}>();

const open = ref(false);
const validateOnChange = ref(false);
const loading = ref(false);
const entityName = ref('buyer');

watch(open, (value) => {
  if (value) {
    form.setValues({
      ...props.buyer,
    });
  }
});

const formSchema = toTypedSchema(
  z.object({
    active: z.boolean().optional(),
    email: z.string().min(1, { message: t('form.field_required') }),
    phone: z.string().optional(),
    firstName: z.string().min(1, { message: t('form.field_required') }),
    lastName: z.string().min(1, { message: t('form.field_required') }),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    ...props.buyer,
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

const handleSave = async () => {
  //   const validation = await form.validate();
  //   if (!validation.valid) {
  //     validateOnChange.value = true;
  //     return;
  //   }
  //   validateOnChange.value = false;
  //   const newAddress: Address = {
  //     ...props.address,
  //     ...form.values,
  //   };
  //   emit('save', newAddress);
  //   open.value = false;
};

const handleDelete = () => {};

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
                <FormItem
                  class="flex flex-row items-center justify-between rounded-lg border p-4"
                >
                  <div class="space-y-0.5">
                    <FormLabel class="text-base">Active</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      :model-value="value"
                      @update:model-value="handleChange"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
            </FormGrid>
          </FormGridWrap>
        </form>
        <div class="mt-8 flex items-center justify-between border-t pt-8">
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
      </div>
      <SheetFooter>
        <Button variant="outline" @click="handleCancel">
          {{ t('cancel') }}
        </Button>
        <Button @click.stop="handleSave">
          {{ t(`${mode === 'add' ? mode : 'update'}_entity`, { entityName }) }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
