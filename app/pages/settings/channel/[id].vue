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
  ChannelLanguageAssignment,
  ChannelMarket,
  ChannelMarketAssignment,
  Language,
  Market,
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
const { accountApi } = useGeinsRepository();
const accountStore = useAccountStore();

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
const isResettingSchema = ref(false);

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

// Language state
const allLanguages = ref<Language[]>([]);
const channelLanguages = ref<ChannelLanguageAssignment[]>([]);
const defaultLanguageDialogOpen = ref(false);
const selectedDefaultLanguageId = ref('');

// Market state
const allMarkets = ref<Market[]>([]);
const channelMarkets = ref<ChannelMarket[]>([]);
const defaultMarketDialogOpen = ref(false);
const selectedDefaultMarketId = ref('');

const defaultLanguageId = ref('');
const defaultMarketId = ref('');

const defaultLanguage = computed(() => {
  if (!defaultLanguageId.value) return undefined;
  return allLanguages.value.find((l) => l._id === defaultLanguageId.value);
});

const openDefaultLanguageDialog = () => {
  selectedDefaultLanguageId.value = defaultLanguageId.value;
  defaultLanguageDialogOpen.value = true;
};

const confirmDefaultLanguageChange = () => {
  const newDefaultId = selectedDefaultLanguageId.value;
  if (!newDefaultId) return;

  defaultLanguageId.value = newDefaultId;

  const current = [...channelLanguages.value];
  const idx = current.findIndex((l) => l._id === newDefaultId);

  if (idx > 0) {
    // Move selected to index 0, keep others in order
    const [selected] = current.splice(idx, 1);
    current.unshift(selected!);
    channelLanguages.value = current;
  } else if (idx === -1) {
    // New language not in current list — add it at index 0
    const newAssignment: ChannelLanguageAssignment = {
      _id: newDefaultId,
      active: true,
    };
    channelLanguages.value = [newAssignment, ...current];
  }

  defaultLanguageDialogOpen.value = false;
};

const handleAddLanguages = (newLangs: ChannelLanguageAssignment[]) => {
  channelLanguages.value = [...channelLanguages.value, ...newLangs];
};

const handleUpdateLanguage = (updated: ChannelLanguageAssignment) => {
  channelLanguages.value = channelLanguages.value.map((l) =>
    l._id === updated._id ? { ...l, active: updated.active } : l,
  );
};

const handleRemoveLanguage = (languageId: string) => {
  channelLanguages.value = channelLanguages.value.filter(
    (l) => l._id !== languageId,
  );
};

// Market computed & handlers
const defaultMarket = computed(() => {
  return channelMarkets.value.find((m) => m._id === defaultMarketId.value);
});

const openDefaultMarketDialog = () => {
  selectedDefaultMarketId.value = defaultMarketId.value;
  defaultMarketDialogOpen.value = true;
};

const confirmDefaultMarketChange = () => {
  const newDefaultId = selectedDefaultMarketId.value;
  if (!newDefaultId) return;

  defaultMarketId.value = newDefaultId;

  const current = [...channelMarkets.value];
  const idx = current.findIndex((m) => m._id === newDefaultId);

  if (idx > 0) {
    const [selected] = current.splice(idx, 1);
    current.unshift(selected!);
    channelMarkets.value = current;
  }

  defaultMarketDialogOpen.value = false;
};

const handleAddMarkets = (newMarketAssignments: ChannelMarketAssignment[]) => {
  const newMarkets = newMarketAssignments
    .map((a) => allMarkets.value.find((m) => m._id === a._id))
    .filter((m): m is Market => !!m)
    .map(
      (m): ChannelMarket => ({
        ...m,
        active: true,
        channelId: 0,
        virtual: false,
        attributes: [],
        allowedLanguages: [],
        defaultLanguage: '',
      }),
    );
  channelMarkets.value = [...channelMarkets.value, ...newMarkets];
};

const handleUpdateMarket = (updated: ChannelMarketAssignment) => {
  channelMarkets.value = channelMarkets.value.map((m) =>
    m._id === updated._id ? { ...m, active: updated.active } : m,
  );
};

const handleRemoveMarket = (marketId: string) => {
  channelMarkets.value = channelMarkets.value.filter((m) => m._id !== marketId);
};

// =====================================================================================
// ENTITY EDIT COMPOSABLE
// =====================================================================================
const {
  entityName,
  entityId,
  createMode,
  loading,
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
    get: accountApi.channel.get,
    create: accountApi.channel.create,
    update: accountApi.channel.update,
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
    // Set explicit default IDs from the API response
    defaultLanguageId.value = entity.defaultLanguage ?? '';
    defaultMarketId.value = entity.defaultMarket ?? '';
    // Populate channel languages from the entity's ordered array
    channelLanguages.value = (entity.languages || []).map((l) => ({
      _id: l._id,
      active: l.active,
    }));
    // Populate channel markets from the entity's ordered array
    channelMarkets.value = entity.markets || [];
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
    languages: channelLanguages.value.map((l) => ({
      _id: l._id,
      active: l.active,
    })),
    markets: channelMarkets.value
      .filter((m) => !m.virtual)
      .map((m) => ({
        _id: m._id,
        active: m.active,
      })),
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

async function handleResetToDefault() {
  if (!entityId.value) return;
  isResettingSchema.value = true;
  try {
    await accountApi.channel.id(entityId.value).resetStorefrontSchema();
    await refreshEntityData.value?.();
    toast({ title: t('channels.reset_schema_success') });
  } catch {
    toast({ title: t('channels.reset_schema_error'), variant: 'negative' });
  } finally {
    isResettingSchema.value = false;
  }
}

// Sync storefrontSettings into entityDataUpdate so useUnsavedChanges detects changes
// (prepareUpdateData also reads storefrontSettings.value at save time)
watch(
  storefrontSettings,
  (val) => {
    if (!createMode.value) {
      entityDataUpdate.value.storefrontSettings = val;
    }
  },
  { deep: true },
);

// Sync channelLanguages into entityDataUpdate so useUnsavedChanges detects changes
watch(
  channelLanguages,
  (val) => {
    if (!createMode.value) {
      entityDataUpdate.value.languages = val.map((l) => ({
        _id: l._id,
        active: l.active,
      }));
    }
  },
  { deep: true },
);

// Sync channelMarkets into entityDataUpdate so useUnsavedChanges detects changes
watch(
  channelMarkets,
  (val) => {
    if (!createMode.value) {
      entityDataUpdate.value.markets = val.map((m) => ({
        _id: m._id,
        active: m.active,
      }));
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
  const result = await updateEntity(
    async () => {
      validateOnChange.value = true;
      return true;
    },
    {
      fields: [
        'languages',
        'markets',
        'storefrontSettings',
        'storefrontSchema',
      ],
    },
  );

  // Show locked toast if the response indicates background processing
  if (result && result.locked) {
    isLocked.value = true;
    toast({
      title: t('channels.locked_toast'),
      variant: 'default',
    });
  }

  // Refresh the store so sidebar / list page reflect changes
  if (result) {
    await accountStore.refreshChannels();
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
      label: t('name'),
      value: entityData.value.name,
    });
  }
  if (!createMode.value) {
    const channelData: Channel = entityData.value;
    if (channelData?.languages?.length) {
      const displayValue = channelData.languages
        .map(
          (l) =>
            allLanguages.value.find((al) => al._id === l._id)?.name ?? l._id,
        )
        .join(', ');
      dataList.push({
        label: t('language', 2),
        value: channelData.languages.map((l) => l._id),
        displayValue,
        displayType: DataItemDisplayType.Array,
        entityName: 'language',
      });
    }
    if (channelData?.markets?.length) {
      const displayValue = channelData.markets
        .map((m) => {
          const full = allMarkets.value.find((am) => am._id === m._id);
          return full
            ? `${full.country?.name ?? m._id} (${full.currency?._id ?? ''})`
            : m._id;
        })
        .join(', ');
      dataList.push({
        label: t('market', 2),
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
      accountApi.channel.get(entityId.value, {
        fields: [
          'languages',
          'markets',
          'storefrontSettings',
          'storefrontSchema',
        ],
      }),
  );
  refreshEntityData.value = refresh;
  onMounted(async () => {
    const entity = handleFetchResult<Channel>(error.value, data.value);
    allLanguages.value = accountStore.languages;
    allMarkets.value = await accountStore.ensureMarkets();
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
            :disabled="!hasUnsavedChanges || loading"
            @click="handleSave"
          >
            {{ $t('save_entity', { entityName }) }}
          </ButtonIcon>
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
                      <FormLabel>{{ $t('name') }}</FormLabel>
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

            <!-- Languages card -->
            <ContentEditCard v-if="!createMode" :title="$t('language', 2)">
              <!-- Default language sub-section -->
              <div>
                <Item class="px-0">
                  <ItemContent>
                    <ItemTitle class="text-base font-bold">
                      {{ $t('channels.default_language') }}
                    </ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant="outline"
                      size="sm"
                      @click="openDefaultLanguageDialog"
                    >
                      {{ $t('change') }}
                    </Button>
                  </ItemActions>
                </Item>

                <!-- Default language display row -->
                <div class="border-b">
                  <div class="border-b px-4 py-2 text-xs font-semibold">
                    {{ $t('language') }}
                  </div>
                  <div class="flex items-center gap-2.5 px-4 py-5">
                    <ChannelLanguageIcon
                      v-if="defaultLanguage"
                      :language-id="defaultLanguage._id"
                      :name="defaultLanguage.name"
                    />
                    <span v-else class="text-muted-foreground text-sm"
                      >&mdash;</span
                    >
                  </div>
                </div>
              </div>
              <div>
                <!-- Additional languages -->
                <ChannelAdditionalLanguages
                  :all-languages="allLanguages"
                  :channel-languages="channelLanguages"
                  :default-language-id="defaultLanguageId"
                  @add="handleAddLanguages"
                  @update="handleUpdateLanguage"
                  @remove="handleRemoveLanguage"
                />
              </div>
            </ContentEditCard>

            <!-- Change default language dialog -->
            <Dialog v-model:open="defaultLanguageDialogOpen">
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {{ $t('channels.change_default_language') }}
                  </DialogTitle>
                  <DialogDescription class="sr-only">
                    {{ $t('channels.change_default_language') }}
                  </DialogDescription>
                </DialogHeader>
                <FormInputLanguageSelect
                  v-model="selectedDefaultLanguageId"
                  :data-set="allLanguages"
                  show-flags
                  disable-teleport
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    @click="defaultLanguageDialogOpen = false"
                  >
                    {{ $t('cancel') }}
                  </Button>
                  <Button @click="confirmDefaultLanguageChange">
                    {{ $t('continue') }}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </ContentEditMainContent>
        </KeepAlive>
        <!-- Tab 1: Markets -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 1"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard :title="$t('channels.tab_markets')">
              <!-- Default market sub-section -->
              <ChannelDefaultMarket
                :default-market="defaultMarket"
                :can-change="channelMarkets.length > 1"
                @change="openDefaultMarketDialog"
              />

              <!-- Additional markets -->
              <ChannelAdditionalMarkets
                :all-markets="allMarkets"
                :channel-markets="channelMarkets"
                :default-market-id="defaultMarketId"
                @add="handleAddMarkets"
                @update="handleUpdateMarket"
                @remove="handleRemoveMarket"
              />
            </ContentEditCard>

            <!-- Change default market dialog -->
            <Dialog v-model:open="defaultMarketDialogOpen">
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {{ $t('channels.change_default_market') }}
                  </DialogTitle>
                  <DialogDescription class="sr-only">
                    {{ $t('channels.change_default_market') }}
                  </DialogDescription>
                </DialogHeader>
                <FormInputMarketSelect
                  v-model="selectedDefaultMarketId"
                  :data-set="channelMarkets"
                  disable-teleport
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    @click="defaultMarketDialogOpen = false"
                  >
                    {{ $t('cancel') }}
                  </Button>
                  <Button @click="confirmDefaultMarketChange">
                    {{ $t('continue') }}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
              :resetting="isResettingSchema"
              @open-schema-editor="schemaEditorOpen = true"
              @reset-to-default="handleResetToDefault"
            />
            <ChannelSchemaEditorSheet
              v-model:open="schemaEditorOpen"
              :schema="activeSchema"
              @apply="handleSchemaApply"
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
