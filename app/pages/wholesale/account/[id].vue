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
const currentStep = ref(1);

// WHOLESALE ACCOUNT
const wholesaleAccount = ref<Partial<WholesaleAccount>>({
  name: '',
  active: false,
  organizationNumber: '',
  externalId: '',
  channels: [],
  tags: [],
  salesReps: [],
});

// FORM SETTINGS
const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    organizationNumber: z
      .string()
      .min(1, { message: 'Organization number is required' }),
    externalId: z.string().optional(),
    active: z.boolean().optional(),
    channels: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: wholesaleAccount.value,
});

const formValid = computed(() => form.meta.value.valid);
const formTouched = computed(() => form.meta.value.touched);

watch(
  form.values,
  useDebounceFn(async () => {
    wholesaleAccount.value = form.values as Partial<WholesaleAccount>;
  }),
);

const onSubmit = form.handleSubmit((values) => {
  console.log('Form submitted!', values);
});
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
          <Button v-if="createMode" variant="secondary">Cancel</Button>
          <ButtonIcon icon="save">{{
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
    <ContentEditMain v-if="currentTab === 0">
      <ContentEditCard
        :create-mode="createMode"
        :step="1"
        :current-step="currentStep"
        title="Account details"
      >
        <form @submit.prevent="onSubmit">
          <FormGridWrap>
            <FormGrid design="2+1+1">
              <FormField v-slot="{ componentField }" name="name">
                <FormItem v-auto-animate>
                  <FormLabel>{{ $t('wholesale.account_name') }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" type="text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="organizationNumber">
                <FormItem v-auto-animate>
                  <FormLabel>{{ $t('wholesale.org_nr') }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" type="text" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="externalId">
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
              <FormField v-slot="{ componentField }" name="salesRep">
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

                      <TagsInputInput placeholder="Add Sales reps..." />
                    </TagsInput>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
              <FormField v-slot="{ componentField }" name="channels">
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

                      <TagsInputInput placeholder="Add Channels..." />
                    </TagsInput>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </FormGrid>
          </FormGridWrap>
        </form>
      </ContentEditCard>
      <ContentEditCard
        :create-mode="createMode"
        :step="2"
        :current-step="1"
        title="Billing and shipping addresses"
        description="Optional step, this information can be added later on"
      >
        Edit billing and shipping addresses
      </ContentEditCard>
      <div class="flex flex-row justify-end gap-4">
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
        <Button v-if="createMode" variant="secondary">Cancel</Button>
        <ButtonIcon icon="save">{{
          $t('save_entity', { entityName })
        }}</ButtonIcon>
      </div>
      <template #sidebar>
        <Card class="p-6">
          <h3 class="text-xl font-semibold">Summary</h3>
        </Card>
      </template>
    </ContentEditMain>
  </ContentEditWrap>
</template>
