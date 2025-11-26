<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/toast/use-toast';
import { DataItemDisplayType } from '#shared/types';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const { t } = useI18n();
const { toast } = useToast();
const { geinsLogError } = useGeinsLog('pages/account/user/[id].vue');

// =====================================================================================
// API & REPOSITORY SETUP
// =====================================================================================
const { userApi } = useGeinsRepository();

// =====================================================================================
// FORM VALIDATION SCHEMA
// =====================================================================================
const formSchema = toTypedSchema(
  z.object({
    details: z.object({
      firstName: z.string().min(1, { message: t('form.field_required') }),
      lastName: z.string().min(1, { message: t('form.field_required') }),
      email: z
        .email({ message: t('form.invalid_email') })
        .min(1, { message: t('form.field_required') }),
      phoneNumber: z.string().optional(),
    }),
  }),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
const entityBase: UserCreate = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
};

// =====================================================================================
// UI STATE MANAGEMENT
// =====================================================================================
// Tabs
const tabs = [t('general')];

// =====================================================================================
// ENTITY EDIT COMPOSABLE
// =====================================================================================
const {
  entityName,
  entityId,
  createMode,
  loading,
  newEntityUrl,
  entityListUrl,
  showSidebar,
  currentTab,
  entityDataCreate,
  entityDataUpdate,
  entityData,
  entityPageTitle,
  entityLiveStatus,
  refreshEntityData,
  form,
  formValid,
  formTouched,
  validateOnChange,
  hasUnsavedChanges,
  unsavedChangesDialogOpen,
  confirmLeave,
  createEntity,
  updateEntity,
  deleteEntity,
  parseAndSaveData,
} = useEntityEdit<UserBase, User, UserCreate, UserUpdate>({
  repository: userApi,
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  getInitialFormValues: (entityData) => ({
    details: {
      firstName: entityData.firstName || '',
      lastName: entityData.lastName || '',
      email: entityData.email || '',
      phoneNumber: entityData.phoneNumber || '',
    },
  }),
  reshapeEntityData: (entity) => ({
    name: entity.name,
    firstName: entity.firstName,
    lastName: entity.lastName,
    email: entity.email,
    phoneNumber: entity.phoneNumber,
  }),
  parseEntityData: (entity) => {
    form.setValues({
      details: {
        firstName: entity.firstName || '',
        lastName: entity.lastName || '',
        email: entity.email || '',
        phoneNumber: entity.phoneNumber || '',
      },
    });
  },
  prepareCreateData: (formData) => ({
    name: `${formData.details.firstName} ${formData.details.lastName}`,
    firstName: formData.details.firstName,
    lastName: formData.details.lastName,
    email: formData.details.email,
    phoneNumber: formData.details.phoneNumber,
  }),
  prepareUpdateData: (formData, entity) => ({
    ...entity,
    name: `${formData.details.firstName} ${formData.details.lastName}`,
    firstName: formData.details.firstName,
    lastName: formData.details.lastName,
    email: formData.details.email,
    phoneNumber: formData.details.phoneNumber,
  }),
  onFormValuesChange: (values) => {
    const targetEntity = createMode.value ? entityDataCreate : entityDataUpdate;
    targetEntity.value = {
      ...targetEntity.value,
      name: `${values.details.firstName} ${values.details.lastName}`,
      firstName: values.details.firstName,
      lastName: values.details.lastName,
      email: values.details.email,
      phoneNumber: values.details.phoneNumber,
    };
  },
});

// =====================================================================================
// ENTITY ACTIONS
// =====================================================================================
const handleSave = async () => {
  if (createMode.value) {
    await createEntity(undefined, undefined);
  } else {
    await updateEntity(undefined, undefined, true);
  }
};

// =====================================================================================
// DELETE FUNCTIONALITY
// =====================================================================================
const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, entityListUrl);

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
const summary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];

  if (!createMode.value) {
    dataList.push({
      label: t('entity_id', { entityName: t(entityName) }),
      value: String(entityData.value?._id),
      displayType: DataItemDisplayType.Copy,
    });
  }

  if (entityData.value?.firstName || entityData.value?.lastName) {
    dataList.push({
      label: t('name'),
      value:
        `${entityData.value.firstName || ''} ${entityData.value.lastName || ''}`.trim(),
    });
  }

  if (entityData.value?.email) {
    dataList.push({
      label: t('email'),
      value: entityData.value.email,
    });
  }

  if (entityData.value?.phoneNumber) {
    dataList.push({
      label: t('phone'),
      value: entityData.value.phoneNumber,
    });
  }

  return dataList;
});

const settingsSummary = computed<DataItem[]>(() => []);

const { summaryProps } = useEntityEditSummary({
  createMode,
  formTouched,
  summary,
  settingsSummary,
  entityName,
  entityLiveStatus,
});

// =====================================================================================
// DATA LOADING FOR EDIT MODE
// =====================================================================================
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<User>(() =>
    userApi.get(String(entityId.value)),
  );

  if (error.value) {
    geinsLogError('error fetching user:', error.value);
    toast({
      title: t('error'),
      description: t('error_fetching_entity', { entityName: t(entityName) }),
      variant: 'negative',
    });
  }

  refreshEntityData.value = refresh;

  if (data.value) {
    await parseAndSaveData(data.value);
  }

  watch(
    () => data.value,
    async (newData) => {
      if (newData) {
        await parseAndSaveData(newData);
      }
    },
    { deep: true },
  );
}

// =====================================================================================
// BREADCRUMBS DATA
// =====================================================================================
const breadcrumbsStore = useBreadcrumbsStore();
breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
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
      <ContentHeader :title="entityPageTitle" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            :disabled="!hasUnsavedChanges || loading"
            @click="handleSave"
            >{{ $t('save_entity', { entityName }) }}</ButtonIcon
          >
          <DropdownMenu v-if="!createMode">
            <DropdownMenuTrigger as-child>
              <Button size="icon" variant="secondary">
                <LucideMoreHorizontal class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem as-child>
                <NuxtLink :to="newEntityUrl">
                  <LucidePlus class="mr-2 size-4" />
                  <span>{{ $t('new_entity', { entityName }) }}</span>
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="openDeleteDialog">
                <LucideTrash class="mr-2 size-4" />
                <span>{{ $t('delete_entity', { entityName }) }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ContentActionBar>
        <template v-if="!createMode" #tabs>
          <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
        </template>
        <template v-if="!createMode" #changes>
          <ContentEditHasChanges :changes="hasUnsavedChanges" />
        </template>
      </ContentHeader>
    </template>
    <form @submit.prevent>
      <ContentEditMain :show-sidebar="showSidebar">
        <ContentEditMainContent>
          <ContentEditCard
            :title="$t('user_details')"
            :description="$t('user_details_description')"
          >
            <FormGridWrap>
              <FormGrid design="1+1">
                <FormField v-slot="{ componentField }" name="details.firstName">
                  <FormItem>
                    <FormLabel>{{ $t('first_name') }}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        :placeholder="$t('first_name')"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="details.lastName">
                  <FormItem>
                    <FormLabel>{{ $t('last_name') }}</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        :placeholder="$t('last_name')"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </FormGrid>

              <FormGrid design="1+1">
                <FormField v-slot="{ componentField }" name="details.email">
                  <FormItem>
                    <FormLabel>{{ $t('email') }}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        :placeholder="$t('email')"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField
                  v-slot="{ componentField }"
                  name="details.phoneNumber"
                >
                  <FormItem>
                    <FormLabel>{{ $t('phone') }}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        :placeholder="$t('phone')"
                        v-bind="componentField"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </FormGrid>
            </FormGridWrap>
          </ContentEditCard>
        </ContentEditMainContent>

        <template #sidebar>
          <ContentEditSummary v-bind="summaryProps" />
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
