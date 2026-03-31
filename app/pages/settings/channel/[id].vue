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
  ChannelApiOptions,
  StorefrontSchema,
  StorefrontSettings,
} from '#shared/types';
import defaultStorefrontSchema from '@/assets/schemas/storefront-settings-default.json';
import { useToast } from '@/components/ui/toast/use-toast';
import { getDefaultSettings } from '@/utils/storefront';

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
    name: z.string().min(1, t('entity_required', { entityName: 'name' })),
    url: z.url(t('channels.invalid_url')),
    active: z.boolean(),
  }),
);

// =====================================================================================
// ENTITY DATA SETUP
// =====================================================================================
const initialCreateData: ChannelCreate = {
  name: '',
  url: '',
  active: false,
};

const initialUpdateData: ChannelUpdate = {
  name: '',
  url: '',
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

// Storefront settings state
const activeSchema = ref<StorefrontSchema>(
  defaultStorefrontSchema as StorefrontSchema,
);
const storefrontSettings = ref<StorefrontSettings>(
  getDefaultSettings(defaultStorefrontSchema as StorefrontSchema),
);
const schemaEditorOpen = ref(false);
const schemaChanged = ref(false);

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
  unsavedChangesDialogOpen,
  confirmLeave,
  validateOnChange,
  createEntity,
  updateEntity,
  parseAndSaveData,
} = useEntityEdit<
  ChannelBase,
  Channel,
  ChannelCreate,
  ChannelUpdate,
  ChannelApiOptions
>({
  repository: {
    get: channelApi.channel.get,
    create: channelApi.channel.create,
    update: channelApi.channel.update,
  },
  validationSchema: formSchema,
  initialEntityData: initialCreateData,
  initialUpdateData,
  getInitialFormValues: (entityData) => ({
    name: entityData.name || '',
    url: entityData.url || '',
    active: entityData.active ?? false,
  }),
  reshapeEntityData: (entityData) => ({
    ...entityData,
  }),
  parseEntityData: (entity) => {
    entityLiveStatus.value = entity.active;
    isLocked.value = entity.locked;
    internalName.value = entity.identifier;
    activeSchema.value =
      entity.storefrontSchema && Object.keys(entity.storefrontSchema).length > 0
        ? entity.storefrontSchema
        : (defaultStorefrontSchema as StorefrontSchema);
    storefrontSettings.value = entity.storefrontSettings
      ? { ...entity.storefrontSettings }
      : getDefaultSettings(activeSchema.value);
    schemaChanged.value = false;
    breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
    form.setValues({
      name: entity.name,
      url: entity.url,
      active: entity.active,
    });
  },
  prepareCreateData: (formData) => ({
    name: formData.name,
    url: formData.url,
    active: formData.active,
    storefrontSchema: activeSchema.value,
    storefrontSettings: storefrontSettings.value,
  }),
  prepareUpdateData: (formData) => ({
    name: formData.name,
    url: formData.url,
    active: formData.active,
    storefrontSettings: storefrontSettings.value,
    ...(schemaChanged.value ? { storefrontSchema: activeSchema.value } : {}),
  }),
  onFormValuesChange: (values) => {
    const targetEntity = createMode.value ? entityDataCreate : entityDataUpdate;
    targetEntity.value = {
      ...entityData.value,
      name: values.name,
      url: values.url,
      active: values.active,
    };
  },
});

// =====================================================================================
// STOREFRONT SETTINGS HANDLERS
// =====================================================================================
function handleSchemaApply(schema: StorefrontSchema) {
  activeSchema.value = schema;
  schemaChanged.value = true;
}

function handleSchemaReset() {
  activeSchema.value = defaultStorefrontSchema as StorefrontSchema;
  storefrontSettings.value = getDefaultSettings(activeSchema.value);
  schemaChanged.value = true;
}

watch(
  storefrontSettings,
  (val) => {
    if (!createMode.value) {
      entityDataUpdate.value.storefrontSettings = val;
    }
  },
  { deep: true },
);

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
  if (entityData.value?.name) {
    dataList.push({
      label: t('channels.name'),
      value: entityData.value.name,
    });
  }
  if (!createMode.value) {
    const channelData = entityData.value as Channel;
    if (channelData?.languages?.length) {
      const displayValue = channelData.languages.map((l) => l.name).join(', ');
      dataList.push({
        label: t('channels.languages_count'),
        value: channelData.languages.map((l) => l._id),
        displayValue,
        displayType: DataItemDisplayType.Array,
        entityName: 'language',
      });
    }
    if (channelData?.markets?.length) {
      const displayValue = channelData.markets
        .map((m) => `${m.country.name} (${m.currency._id})`)
        .join(', ');
      dataList.push({
        label: t('channels.markets_count'),
        value: channelData.markets.map((m) => m._id),
        displayValue,
        displayType: DataItemDisplayType.Array,
        entityName: 'market',
      });
    }
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
    () =>
      channelApi.channel.get(entityId.value, {
        fields: ['languages', 'markets'],
      }),
  );
  refreshEntityData.value = refresh;
  onMounted(async () => {
    const entity = handleFetchResult<Channel>(error.value, data.value);
    await parseAndSaveData(entity);
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
                  <FormField v-slot="{ componentField }" name="name">
                    <FormItem>
                      <FormLabel>{{ $t('channels.name') }}</FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-if="!createMode" name="identifier">
                    <FormItem>
                      <FormLabel>{{ $t('channels.identifier') }}</FormLabel>
                      <FormControl>
                        <Input :model-value="internalName" disabled />
                      </FormControl>
                      <FormDescription>
                        {{ $t('channels.identifier_helper') }}
                      </FormDescription>
                    </FormItem>
                  </FormField>
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
            <ChannelStorefrontSettings
              v-model="storefrontSettings"
              :schema="activeSchema"
              @open-schema-editor="schemaEditorOpen = true"
            />
            <ChannelSchemaEditorSheet
              v-model:open="schemaEditorOpen"
              :schema="activeSchema"
              @apply="handleSchemaApply"
              @reset="handleSchemaReset"
            />
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
