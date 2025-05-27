<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useRoute } from 'vue-router';

// Types (you'll need to define these)
interface PricelistCreate {
  name: string;
  description?: string;
  active: boolean;
  channels: string[];
}

interface PricelistUpdate extends PricelistCreate {
  _id?: string;
}

interface Pricelist extends PricelistUpdate {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// Initial entity data
const initialPricelistData: PricelistCreate = {
  name: '',
  description: '',
  active: true,
  channels: [],
};

// Validation schema
const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    description: z.string().optional(),
    channels: z
      .array(z.string())
      .min(1, { message: 'At least one channel is required' }),
  }),
);

// Repository (you'll need to implement this)
const { wholesaleApi } = useWholesale();
const pricelistRepo = {
  get: (id: string) => wholesaleApi.pricelist.get(id),
  create: (data: PricelistCreate) => wholesaleApi.pricelist.create(data),
  update: (id: string, data: PricelistUpdate) =>
    wholesaleApi.pricelist.update(id, data),
  delete: (id: string) => wholesaleApi.pricelist.delete(id),
};

// Main entity edit composable
const {
  entityName,
  createMode,
  loading,
  title,
  newEntityUrl,
  entityListUrl,
  entityDataCreate,
  entityDataUpdate,
  entityData,
  form,
  formValid,
  formTouched,
  hasUnsavedChanges,
  unsavedChangesDialogOpen,
  confirmLeave,
  createEntity,
  updateEntity,
  deleteEntity,
  parseAndSaveData,
} = useEntityEdit<Pricelist, PricelistCreate, PricelistUpdate>({
  entityName: 'pricelist',
  repository: pricelistRepo,
  validationSchema: formSchema,
  initialEntityData: initialPricelistData,
  getInitialFormValues: (entityData, createMode) => ({
    name: entityData.name || '',
    description: entityData.description || '',
    channels: entityData.channels || [],
  }),
  prepareCreateData: (formData) => ({
    name: formData.name,
    description: formData.description,
    active: true,
    channels: formData.channels,
  }),
  prepareUpdateData: (formData, entity) => ({
    ...entity,
    name: formData.name,
    description: formData.description,
    channels: formData.channels,
  }),
  onFormValuesChange: async (values) => {
    // Update entity data with form values
    const newValues = {
      ...entityData.value,
      ...values,
    };

    if (createMode.value) {
      entityDataCreate.value = newValues;
    } else {
      entityDataUpdate.value = newValues;
    }
  },
});

// Delete functionality
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, '/wholesale/pricelist/list');

// Tabs
const currentTab = ref(0);
const tabs = ['Main', 'Products'];

// Load data for edit mode
if (!createMode.value) {
  const { data, error } = await useAsyncData<Pricelist>(() =>
    pricelistRepo.get(String(route.params.id)),
  );

  if (error.value) {
    console.error('Error fetching pricelist:', error.value);
  }

  if (data.value) {
    await parseAndSaveData(data.value);
    // Update form values after data is loaded
    form?.setValues({
      name: data.value.name,
      description: data.value.description || '',
      channels: data.value.channels,
    });
  }
}

// Form submission
const handleSave = () => {
  if (createMode.value) {
    createEntity();
  } else {
    updateEntity();
  }
};
</script>

<template>
  <DialogUnsavedChanges
    v-model:open="unsavedChangesDialogOpen"
    :entity-name="entityName"
    :loading="loading"
    @confirm="confirmLeave"
  />
  <DialogDelete
    v-model:open="deleteDialogOpen"
    :entity-name="entityName"
    :loading="deleting"
    @confirm="confirmDelete"
  />

  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="title" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon icon="save" :loading="loading" @click="handleSave">
            {{ $t('save_entity', { entityName }) }}
          </ButtonIcon>
          <!-- ...other buttons... -->
        </ContentActionBar>
        <template v-if="!createMode" #tabs>
          <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
        </template>
        <template v-if="!createMode" #changes>
          <ContentEditHasChanges :changes="hasUnsavedChanges" />
        </template>
      </ContentHeader>
    </template>

    <form @submit.prevent="handleSave">
      <ContentEditMain v-if="currentTab === 0">
        <ContentEditCard :create-mode="createMode" title="General">
          <FormGridWrap>
            <FormGrid design="1+1">
              <FormField v-slot="{ componentField }" name="name">
                <FormItem>
                  <FormLabel>{{ $t('name') }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>

              <FormField v-slot="{ componentField }" name="description">
                <FormItem>
                  <FormLabel :optional="true">{{
                    $t('description')
                  }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </FormGrid>

            <FormGrid design="1">
              <FormField v-slot="{ componentField }" name="channels">
                <FormItem>
                  <FormLabel>{{ $t('channels') }}</FormLabel>
                  <FormControl>
                    <FormInputChannels
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
          </FormGridWrap>
        </ContentEditCard>
      </ContentEditMain>

      <!-- Add more tabs as needed -->
    </form>
  </ContentEditWrap>
</template>
