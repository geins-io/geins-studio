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
const { updateUser } = useUserStore();
const breadcrumbsStore = useBreadcrumbsStore();

// =====================================================================================
// API & REPOSITORY SETUP
// =====================================================================================
const { userApi } = useGeinsRepository();

const userProfileApi = {
  ...userApi,
  update: userApi.me.update,
};

// =====================================================================================
// FORM VALIDATION SCHEMA
// =====================================================================================
const formSchema = toTypedSchema(
  z
    .object({
      details: z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z
          .email({ message: t('form.invalid_email') })
          .min(1, { message: t('form.field_required') }),
        phoneNumber: z.string().optional(),
      }),
      password: z.object({
        currentPassword: z.string().optional(),
        newPassword: z.string().optional(),
        confirmNewPassword: z.string().optional(),
      }),
    })
    .check(
      z.superRefine((data, ctx) => {
        const { currentPassword, newPassword, confirmNewPassword } =
          data.password;

        // If newPassword or confirmNewPassword is filled, validate all password fields
        if (newPassword || confirmNewPassword) {
          // Validate currentPassword is required
          if (!currentPassword) {
            ctx.addIssue({
              code: 'custom',
              message: t('form.field_required'),
              path: ['password', 'currentPassword'],
            });
          }

          // Validate newPassword requirements
          if (!newPassword) {
            ctx.addIssue({
              code: 'custom',
              message: t('form.field_required'),
              path: ['password', 'newPassword'],
            });
          } else {
            // Check minimum length
            if (newPassword.length < 8) {
              ctx.addIssue({
                code: 'custom',
                message: t('form.password_min_length', { length: 8 }),
                path: ['password', 'newPassword'],
              });
            }

            // Check for at least one uppercase letter
            if (!/[A-Z]/.test(newPassword)) {
              ctx.addIssue({
                code: 'custom',
                message:
                  t('form.password_uppercase_required') ||
                  'Password must contain at least one uppercase letter',
                path: ['password', 'newPassword'],
              });
            }

            // Check for at least one number
            if (!/[0-9]/.test(newPassword)) {
              ctx.addIssue({
                code: 'custom',
                message:
                  t('form.password_number_required') ||
                  'Password must contain at least one number',
                path: ['password', 'newPassword'],
              });
            }
          }

          // Validate confirmNewPassword is required
          if (!confirmNewPassword) {
            ctx.addIssue({
              code: 'custom',
              message: t('form.field_required'),
              path: ['password', 'confirmNewPassword'],
            });
          }

          // Validate passwords match (only if both are provided)
          if (
            newPassword &&
            confirmNewPassword &&
            newPassword !== confirmNewPassword
          ) {
            ctx.addIssue({
              code: 'custom',
              message: t('form.passwords_must_match') || 'Passwords must match',
              path: ['password', 'confirmNewPassword'],
            });
          }
        }
      }),
    ),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
const entityBase: UserProfileCreate = {
  name: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
};

const userFullName = computed(() =>
  `${entityData.value.firstName || ''} ${entityData.value.lastName || ''}`.trim(),
);

const entityPageTitle = computed(() =>
  createMode.value
    ? t('new_entity', { entityName }) +
      (userFullName.value ? ': ' + userFullName.value : '')
    : userFullName.value || t('edit_entity', { entityName }),
);

const passwords = reactive({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
});

const passwordsMatch = computed(() => {
  return (
    passwords.newPassword === passwords.confirmNewPassword ||
    passwords.confirmNewPassword === ''
  );
});

// =====================================================================================
// UI STATE MANAGEMENT
// =====================================================================================
// Tabs
const tabs = [t('general')];

const stepValidationMap: Record<number, string> = {
  1: 'details',
  2: 'password',
};

// =====================================================================================
// ENTITY EDIT COMPOSABLE
// =====================================================================================
const {
  entityName,
  createMode,
  loading,
  showSidebar,
  currentTab,
  entityDataCreate,
  entityDataUpdate,
  entityData,
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
  validateSteps,
} = useEntityEdit<UserBase, User, UserProfileCreate, UserProfileUpdate>({
  repository: userProfileApi,
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  stepValidationMap,
  getInitialFormValues: (entityData) => ({
    details: {
      firstName: entityData.firstName || '',
      lastName: entityData.lastName || '',
      email: entityData.email || '',
      phoneNumber: entityData.phoneNumber || '',
    },
  }),
  reshapeEntityData: (entity) => ({
    ...entity,
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
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
  },
  prepareCreateData: (formData) => ({
    name: `${formData.details.firstName || ''} ${
      formData.details.lastName || ''
    }`.trim(),
    firstName: formData.details.firstName,
    lastName: formData.details.lastName,
    email: formData.details.email,
    phoneNumber: formData.details.phoneNumber,
  }),
  prepareUpdateData: (formData, entity) => ({
    ...entity,
    name: undefined,
    firstName: formData.details.firstName,
    lastName: formData.details.lastName,
    email: formData.details.email,
    phoneNumber: formData.details.phoneNumber,
  }),
  onFormValuesChange: async (values) => {
    const targetEntity = createMode.value ? entityDataCreate : entityDataUpdate;
    targetEntity.value = {
      ...targetEntity.value,
      firstName: values.details.firstName,
      lastName: values.details.lastName,
      email: values.details.email,
      phoneNumber: values.details.phoneNumber,
    };
    passwords.currentPassword = values.password.currentPassword;
    passwords.newPassword = values.password.newPassword;
    passwords.confirmNewPassword = values.password.confirmNewPassword;
    if (validateOnChange.value) {
      await validateSteps([1, 2]);
    }
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
    updateUser(entityData.value);
  }
};

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
const summary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];

  if (!createMode.value) {
    dataList.push({
      label: t('account_profile.username'),
      value: String(entityData.value?._id),
      displayType: DataItemDisplayType.Copy,
    });
  }

  if (entityData.value?.firstName || entityData.value?.lastName) {
    dataList.push({
      label: t('name'),
      value: userFullName.value,
    });
  }

  if (entityData.value?.email) {
    dataList.push({
      label: t('person.email'),
      value: entityData.value.email,
    });
  }

  if (entityData.value?.phoneNumber) {
    dataList.push({
      label: t('person.phone'),
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
    userApi.me.get(),
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
</script>

<template>
  <DialogUnsavedChanges
    v-model:open="unsavedChangesDialogOpen"
    :entity-name="entityName"
    :loading="loading"
    @confirm="confirmLeave"
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
            :title="$t('entity_details', { entityName })"
            description="Contact information and personal details"
          >
            <FormGridWrap>
              <FormGrid design="1+1">
                <FormField v-slot="{ componentField }" name="details.firstName">
                  <FormItem>
                    <FormLabel>{{ $t('person.first_name') }}</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField v-slot="{ componentField }" name="details.lastName">
                  <FormItem>
                    <FormLabel>{{ $t('person.last_name') }}</FormLabel>
                    <FormControl>
                      <Input type="text" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </FormGrid>

              <FormGrid design="1+1">
                <FormField v-slot="{ componentField }" name="details.email">
                  <FormItem>
                    <FormLabel>{{ $t('person.email') }}</FormLabel>
                    <FormControl>
                      <Input type="email" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField
                  v-slot="{ componentField }"
                  name="details.phoneNumber"
                >
                  <FormItem>
                    <FormLabel>{{ $t('person.phone') }}</FormLabel>
                    <FormControl>
                      <Input type="tel" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </FormGrid>
            </FormGridWrap>
          </ContentEditCard>
          <ContentEditCard title="Login credentials">
            <FormGridWrap>
              <FormGrid design="2+1">
                <FormField v-slot="{ componentField }" name="username">
                  <FormItem>
                    <FormLabel>{{ $t('account_profile.username') }}</FormLabel>
                    <FormControl>
                      <Input v-model="entityData._id" disabled />
                    </FormControl>
                    <FormDescription>
                      Contact your administrator to change your username
                    </FormDescription>
                  </FormItem>
                </FormField>
              </FormGrid>
              <!-- <ContentCardHeader
                title="Update your password"
                size="md"
                class="mt-6 mb-4"
              /> -->
              <FormGrid design="1+1+1">
                <FormField
                  v-slot="{ componentField }"
                  name="password.currentPassword"
                  :validate-on-blur="true"
                >
                  <FormItem>
                    <FormLabel>{{
                      $t('account_profile.current_password')
                    }}</FormLabel>
                    <FormControl>
                      <Input type="password" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField
                  v-slot="{ componentField }"
                  name="password.newPassword"
                  :validate-on-blur="true"
                >
                  <FormItem>
                    <FormLabel>{{
                      $t('account_profile.new_password')
                    }}</FormLabel>
                    <FormControl>
                      <Input type="password" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>

                <FormField
                  v-slot="{ componentField }"
                  name="password.confirmNewPassword"
                  :validate-on-blur="true"
                >
                  <FormItem>
                    <FormLabel>{{
                      $t('account_profile.confirm_new_password')
                    }}</FormLabel>
                    <FormControl>
                      <Input type="password" v-bind="componentField" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </FormField>
              </FormGrid>
            </FormGridWrap>
          </ContentEditCard>
        </ContentEditMainContent>

        <template #sidebar>
          <ContentEditSummary
            v-bind="summaryProps"
            :show-active-status="false"
          />
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
