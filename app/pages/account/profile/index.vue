<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useToast } from '@/components/ui/toast/use-toast';
import { DataItemDisplayType } from '#shared/types';
import { createPasswordChangeSchema } from '@/utils/password-validation';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const { t } = useI18n();
const { toast } = useToast();
const { geinsLogWarn, geinsLogError } = useGeinsLog(
  'pages/account/user/[id].vue',
);
const userStore = useUserStore();
const { userInitials } = storeToRefs(userStore);
const { session, setSession } = useGeinsAuth();

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
  z.object({
    details: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z
        .email({ message: t('form.invalid_email') })
        .min(1, { message: t('form.field_required') }),
      phoneNumber: z.string().optional(),
    }),
    username: z.string().optional(),
    password: createPasswordChangeSchema(t),
  }),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
const entityName = 'profile';

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

// =====================================================================================
// PASSWORDS HANDLING
// =====================================================================================

const passwords = reactive({
  currentPassword: undefined,
  newPassword: undefined,
  confirmNewPassword: undefined,
});

const passwordsHasChanges = computed(() => {
  return !!passwords.newPassword || !!passwords.confirmNewPassword;
});

const emptyPasswords = () => {
  passwords.currentPassword = undefined;
  passwords.newPassword = undefined;
  passwords.confirmNewPassword = undefined;
  form.setFieldValue('password.currentPassword', undefined);
  form.setFieldValue('password.newPassword', undefined);
  form.setFieldValue('password.confirmNewPassword', undefined);
};

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
  createMode,
  loading,
  showSidebar,
  currentTab,
  entityDataCreate,
  entityDataUpdate,
  entityData,
  entityLiveStatus,
  entityFetchKey,
  refreshEntityData,
  form,
  formTouched,
  validateOnChange,
  hasUnsavedChanges,
  unsavedChangesDialogOpen,
  confirmLeave,
  updateEntity,
  parseAndSaveData,
  validateSteps,
} = useEntityEdit<
  UserBase,
  User,
  UserProfileCreate,
  UserProfileUpdate,
  UserProfileApiOptions
>({
  repository: userProfileApi,
  validationSchema: formSchema,
  initialEntityData: entityBase,
  initialUpdateData: entityBase,
  stepValidationMap,
  externalChanges: passwordsHasChanges,
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
// ERROR HANDLING SETUP
// =====================================================================================

const { handleFetchResult, showErrorToast } = usePageError({
  entityName,
});

// =====================================================================================
// ENTITY ACTIONS
// =====================================================================================
const handleSave = async () => {
  if (passwordsHasChanges.value) {
    const stepValid = await validateSteps([2]);
    if (!stepValid) {
      validateOnChange.value = true;
      return;
    }
    validateOnChange.value = false;
    try {
      await userApi.me.password.update(
        passwords.currentPassword || '',
        passwords.newPassword || '',
      );
      if (!hasUnsavedChanges.value) {
        toast({
          title: t('entity_updated', { entityName }),
          variant: 'positive',
        });
        emptyPasswords();
        return;
      }
    } catch (error) {
      geinsLogError('error updating password:', error);
      showErrorToast(t('error_updating_entity', { entityName }));
      return;
    }
  }
  const stepValid = await validateSteps([1]);
  if (!stepValid) {
    validateOnChange.value = true;
    return;
  }
  validateOnChange.value = false;
  await updateEntity(
    async () => {
      const stepsValid = await validateSteps([1]);
      if (!stepsValid) {
        validateOnChange.value = true;
        return false;
      }
      validateOnChange.value = false;
      return true;
    },
    undefined,
    true,
  );
  emptyPasswords();
  const newSession = {
    ...session.value,
    user: entityData.value,
  };
  try {
    await setSession(newSession);
    userStore.updateUser(entityData.value);
  } catch (error) {
    geinsLogWarn('error updating session:', error);
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
  const { data, error, refresh } = await useAsyncData<User>(
    entityFetchKey,
    () => userApi.me.get(),
  );

  refreshEntityData.value = refresh;

  onMounted(async () => {
    const user = handleFetchResult<User>(error.value, data.value);
    await parseAndSaveData(user);

    watch(
      () => data.value,
      async (newData) => {
        if (newData) {
          await parseAndSaveData(newData);
        }
      },
      { deep: true },
    );
  });
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
                    <FormDescription>
                      {{ $t('auth.password_requirements') }}
                    </FormDescription>
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
          <ContentEditSummary v-bind="summaryProps" :show-active-status="false">
            <template #before-active-switch>
              <div
                class="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm"
              >
                <Avatar class="mr-1 size-10 rounded-lg">
                  <AvatarFallback class="rounded-lg text-sm">
                    {{ userInitials }}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span v-if="entityPageTitle" class="truncate font-semibold">
                    {{ entityPageTitle }}
                  </span>
                  <span class="truncate text-xs">{{ entityData._id }}</span>
                </div>
              </div>
            </template>
          </ContentEditSummary>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
