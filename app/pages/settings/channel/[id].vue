<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import type {
  ChannelBase,
  Channel,
  ChannelCreate,
  ChannelUpdate,
  ChannelType,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

// =====================================================================================
// COMPOSABLES & STORES
// =====================================================================================
const scope = 'pages/settings/channel/[id].vue';
const { t } = useI18n();
const { toast } = useToast();
const breadcrumbsStore = useBreadcrumbsStore();

// =====================================================================================
// API & REPOSITORY SETUP
// =====================================================================================
const { channelApi } = useGeinsRepository();

// =====================================================================================
// PAGE META
// =====================================================================================
definePageMeta({
  pageType: 'edit',
});

// =====================================================================================
// FORM VALIDATION SCHEMA
// =====================================================================================
const formSchema = toTypedSchema(
  z.object({
    displayName: z
      .string()
      .min(1, t('entity_required', { entityName: 'displayName' })),
    url: z.url(t('channels.invalid_url')),
    channelType: z.enum(['webshop', 'physical', 'other'] as const),
    active: z.boolean(),
  }),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
const initialCreateData: ChannelCreate = {
  displayName: '',
  url: '',
  channelType: 'webshop',
  active: false,
};

const initialUpdateData: ChannelUpdate = {
  displayName: '',
  url: '',
  channelType: 'webshop',
  active: false,
};

// =====================================================================================
// UI STATE MANAGEMENT
// =====================================================================================
const tabs = [
  t('channels.tab_general'),
  t('channels.tab_markets'),
  t('channels.tab_payments'),
  t('channels.tab_mails'),
  t('channels.tab_storefront_settings'),
];

// Locked state — background processing guard for active toggle
const isLocked = ref(false);

const internalName = ref(''); // For displaying the non-editable internal name field

// Channel type options for select
const channelTypeOptions: { value: ChannelType; label: string }[] = [
  { value: 'webshop', label: t('channels.type_webshop') },
  { value: 'physical', label: t('channels.type_physical') },
  { value: 'other', label: t('channels.type_other') },
];

// =====================================================================================
// ENTITY EDIT COMPOSABLE
// =====================================================================================
const {
  entityName,
  entityId,
  createMode,
  loading,
  newEntityUrl,
  showSidebar,
  currentTab,
  entityDataCreate,
  entityDataUpdate,
  entityData,
  entityPageTitle,
  entityLiveStatus,
  entityFetchKey,
  refreshEntityData,
  form,
  formTouched,
  hasUnsavedChanges,
  validateOnChange,
  createEntity,
  updateEntity,
  parseAndSaveData,
} = useEntityEdit<ChannelBase, Channel, ChannelCreate, ChannelUpdate>({
  repository: {
    get: channelApi.channel.get,
    create: channelApi.channel.create,
    update: channelApi.channel.update,
  },
  validationSchema: formSchema,
  initialEntityData: initialCreateData,
  initialUpdateData,
  getInitialFormValues: (entityData) => ({
    displayName: entityData.displayName || '',
    url: entityData.url || '',
    channelType: entityData.channelType || 'webshop',
    active: entityData.active ?? false,
  }),
  reshapeEntityData: (entityData) => ({
    ...entityData,
  }),
  parseEntityData: (entity) => {
    entityLiveStatus.value = entity.active;
    isLocked.value = entity.locked;
    internalName.value = entity.name;
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
    form.setValues({
      displayName: entity.displayName,
      url: entity.url,
      channelType: entity.channelType,
      active: entity.active,
    });
  },
  prepareCreateData: (formData) => ({
    displayName: formData.displayName,
    url: formData.url,
    channelType: formData.channelType,
    active: formData.active,
  }),
  prepareUpdateData: (formData) => ({
    displayName: formData.displayName,
    url: formData.url,
    channelType: formData.channelType,
    active: formData.active,
  }),
  onFormValuesChange: (values) => {
    const targetEntity = createMode.value ? entityDataCreate : entityDataUpdate;
    targetEntity.value = {
      ...entityData.value,
      displayName: values.displayName,
      url: values.url,
      channelType: values.channelType,
      active: values.active,
    };
  },
});

// =====================================================================================
// ERROR HANDLING SETUP
// =====================================================================================
const { handleFetchResult } = usePageError({
  entityName,
  entityId: entityId.value,
  scope,
});

// =====================================================================================
// SAVE HANDLERS
// =====================================================================================
const handleCreateChannel = async () => {
  await createEntity(async () => {
    validateOnChange.value = true;
    return true;
  });
};

const handleSave = async () => {
  const result = await updateEntity(async () => {
    validateOnChange.value = true;
    return true;
  });

  // Show locked toast if the response indicates background processing
  if (result && result.locked) {
    isLocked.value = true;
    toast({
      title: t('channels.locked_toast'),
      variant: 'default',
    });
  }
};

// =====================================================================================
// SUMMARY DATA
// =====================================================================================
const summary = computed<DataItem[]>(() => {
  const dataList: DataItem[] = [];
  if (!createMode.value) {
    dataList.push({
      label: t('entity_id', { entityName }),
      value: entityId.value ?? '',
      displayType: DataItemDisplayType.Copy,
    });
  }
  if (entityData.value?.displayName) {
    dataList.push({
      label: t('channels.display_name'),
      value: entityData.value.displayName,
    });
  }
  if (!createMode.value) {
    const channelData = entityData.value as Channel;
    dataList.push({
      label: t('channels.languages_count'),
      value: String(channelData?.languages?.length ?? 0),
    });
    dataList.push({
      label: t('channels.markets_count'),
      value: String(channelData?.markets?.length ?? 0),
    });
    // First active payment method
    const firstPayment = channelData?.paymentMethods?.find((p) => p.active);
    dataList.push({
      label: t('channels.tab_payments'),
      value: firstPayment?.name ?? '-',
    });
    // Mail settings status
    dataList.push({
      label: t('channels.transaction_mails'),
      value: channelData?.mailSettings ? t('active') : t('inactive'),
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
  const { data, error, refresh } = await useAsyncData<Channel>(
    entityFetchKey.value,
    () => channelApi.channel.get(entityId.value),
  );
  refreshEntityData.value = refresh;
  onMounted(async () => {
    const entity = handleFetchResult<Channel>(error.value, data.value);
    await parseAndSaveData(entity);
  });
}
</script>

<template>
  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="entityPageTitle" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
            v-if="createMode"
            icon="save"
            :loading="loading"
            @click="handleCreateChannel"
          >
            {{ $t('save_entity', { entityName }) }}
          </ButtonIcon>
          <ButtonIcon
            v-if="!createMode"
            icon="save"
            :loading="loading"
            :disabled="!hasUnsavedChanges"
            @click="handleSave"
          >
            {{ $t('save_entity', { entityName }) }}
          </ButtonIcon>
          <DropdownMenu v-if="!createMode">
            <DropdownMenuTrigger as-child>
              <Button class="p-1" size="icon" variant="secondary">
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
        <!-- Tab 0: General -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 0"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard :title="$t('channels.card_details')">
              <FormGridWrap>
                <FormGrid design="1+1">
                  <FormField v-slot="{ componentField }" name="displayName">
                    <FormItem>
                      <FormLabel>{{ $t('channels.display_name') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <div v-if="!createMode" class="space-y-2">
                    <Label>{{ $t('channels.name') }}</Label>
                    <Input :model-value="internalName" disabled />
                    <p class="text-muted-foreground text-sm">
                      {{ $t('channels.name_helper') }}
                    </p>
                  </div>
                </FormGrid>
                <FormGrid design="1">
                  <FormField v-slot="{ componentField }" name="url">
                    <FormItem>
                      <FormLabel>{{ $t('channels.url') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="url" />
                      </FormControl>
                      <FormDescription>
                        {{ $t('channels.url_helper') }}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1">
                  <FormField v-slot="{ componentField }" name="channelType">
                    <FormItem>
                      <FormLabel>{{ $t('channels.type') }}</FormLabel>
                      <Select v-bind="componentField">
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem
                            v-for="option in channelTypeOptions"
                            :key="option.value"
                            :value="option.value"
                          >
                            {{ option.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
              </FormGridWrap>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>
        <!-- Tab 1: Markets -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1"
            :key="`tab-${currentTab}`"
          >
            <!-- TODO: M3 -->
            <ContentEditCard :title="$t('channels.tab_markets')">
              <div class="text-muted-foreground text-sm">
                {{ $t('channels.tab_placeholder') }}
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>
        <!-- Tab 2: Payments -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 2"
            :key="`tab-${currentTab}`"
          >
            <!-- TODO: M4 -->
            <ContentEditCard :title="$t('channels.tab_payments')">
              <div class="text-muted-foreground text-sm">
                {{ $t('channels.tab_placeholder') }}
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>
        <!-- Tab 3: Mails -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 3"
            :key="`tab-${currentTab}`"
          >
            <!-- TODO: M5 -->
            <ContentEditCard :title="$t('channels.tab_mails')">
              <div class="text-muted-foreground text-sm">
                {{ $t('channels.tab_placeholder') }}
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>
        <!-- Tab 4: Storefront settings -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 4"
            :key="`tab-${currentTab}`"
          >
            <!-- TODO: M2 -->
            <ContentEditCard :title="$t('channels.tab_storefront_settings')">
              <div class="text-muted-foreground text-sm">
                {{ $t('channels.tab_placeholder') }}
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>

        <template #sidebar>
          <ContentEditSummary
            v-model:active="entityDataUpdate.active"
            v-bind="summaryProps"
            :disabled="isLocked"
          />
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>
</template>
