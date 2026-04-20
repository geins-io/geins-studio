<script setup lang="ts">
// =====================================================================================
// IMPORTS & TYPES
// =====================================================================================
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import {
  DataItemDisplayType,
  type ChannelBase,
  type Channel,
  type ChannelCreate,
  type ChannelUpdate,
  type ChannelApiOptions,
  type ChannelLanguageAssignment,
  type ChannelMarket,
  type ChannelMarketAssignment,
  type ChannelPaymentMethod,
  type ChannelMailSettings,
  type ChannelMailType,
  type Language,
  type Market,
  type StorefrontSchema,
  type StorefrontSettings,
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
    name: z
      .string()
      .min(1, t('entity_required', { entityName: 'name' }))
      .max(50, t('channels.validation_name_max_length')),
    url: z.url(t('channels.invalid_url')).optional().or(z.literal('')),
    active: z.boolean(),
    mail: z
      .object({
        disabled: z.boolean(),
        displayName: z.string(),
        orderConfirmationBCCEmail: z
          .email(t('channels.validation_email_format'))
          .or(z.literal('')),
        loginUrl: z.string(),
        passwordResetUrl: z.string(),
      })
      .refine((d) => d.disabled === true || d.displayName.trim().length > 0, {
        message: t('channels.validation_mail_display_name_required'),
        path: ['displayName'],
      }),
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
// Per-tab error indicators (STU-125). Derived from VeeValidate form errors —
// show a red dot on the tab that owns the invalid field. Tabs not covered by
// the schema (Markets, Payments, Storefront settings) never show a dot.
const tabs = computed(() => {
  const errors = form.errors.value;
  const mailHasError = Object.keys(errors).some((k) => k.startsWith('mail.'));
  return [
    {
      label: t('channels.tab_general'),
      error: !!(errors.name || errors.url),
    },
    { label: t('channels.tab_markets') },
    { label: t('channels.tab_payments') },
    { label: t('channels.tab_mails'), error: mailHasError },
    { label: t('channels.tab_storefront_settings') },
  ];
});

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

// Payment state
const channelPayments = ref<ChannelPaymentMethod[]>([]);

// Mails state
const channelMailSettings = ref<ChannelMailSettings | null>(null);
const channelMailTypes = ref<ChannelMailType[]>([]);

// Keys owned by the Layout sub-tab (STU-118). General-tab editable fields live
// in the VeeValidate form state under `mail.*` (STU-125). Read-only mail
// metadata round-trips via `channelMailSettings`.
const MAIL_LAYOUT_KEYS = [
  'backgroundColor',
  'bodyColor',
  'secondBodyColor',
  'headerColor',
  'footerColor',
  'footerTextColor',
  'textColor',
  'saleTextColor',
  'notIncludedTextColor',
  'previouslyShippedTextColor',
  'backOrderedTextColor',
  'buttonColor',
  'buttonTextColor',
  'fontFamily',
  'fontUrl',
  'fontSizeSmall',
  'fontSizeMedium',
  'fontSizeLarge',
  'lineHeight',
  'borderRadius',
  'logoUrl',
  'headerImgUrl',
  'prodImgSize',
  'showBrand',
  'productParameters',
  'hideArticleNumber',
] as const satisfies readonly (keyof ChannelMailSettings)[];

const mailLayoutFields = ref<Partial<ChannelMailSettings>>({});
const mailLayoutFiles = ref<{ logoUrl?: File; headerImgUrl?: File }>({});

function pickMailKeys(
  settings: ChannelMailSettings | null,
  keys: readonly (keyof ChannelMailSettings)[],
): Partial<ChannelMailSettings> {
  if (!settings) return {};
  const picked: Partial<ChannelMailSettings> = {};
  for (const key of keys) {
    const value = settings[key];
    if (value !== undefined) {
      (picked as Record<string, unknown>)[key] = value;
    }
  }
  return picked;
}

async function handleMailSaved() {
  // A mail template text override was saved from the config sheet — refresh
  // the channel data so the `hasOverrides` indicator on rows stays in sync.
  await refreshEntityData.value?.();
}

const defaultLanguage = computed(() => {
  if (!defaultLanguageId.value) return undefined;
  return allLanguages.value.find((l) => l._id === defaultLanguageId.value);
});

// Languages that are both assigned to this channel and active — the mail
// template editor only supports editing texts for these.
const channelActiveLanguages = computed<Language[]>(() => {
  const activeIds = new Set(
    channelLanguages.value.filter((l) => l.active).map((l) => l._id),
  );
  return allLanguages.value.filter((l) => activeIds.has(l._id));
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
  getInitialFormValues: (entityData) => {
    const existing =
      'mailSettings' in entityData ? entityData.mailSettings : undefined;
    return {
      name: entityData.name || '',
      url: entityData.url || '',
      active: entityData.active ?? false,
      mail: {
        disabled: existing?.disabled ?? false,
        displayName: existing?.displayName ?? '',
        orderConfirmationBCCEmail: existing?.orderConfirmationBCCEmail ?? '',
        loginUrl: existing?.loginUrl ?? '',
        passwordResetUrl: existing?.passwordResetUrl ?? '',
      },
    };
  },
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
    // Populate channel payment methods
    channelPayments.value = entity.paymentMethods ?? [];
    // Populate channel mail settings and mail types
    channelMailSettings.value = entity.mailSettings ?? null;
    channelMailTypes.value = entity.mailTypes ?? [];
    mailLayoutFields.value = pickMailKeys(
      entity.mailSettings ?? null,
      MAIL_LAYOUT_KEYS,
    );
    mailLayoutFiles.value = {};
    form.setValues({
      name: entity.name,
      url: entity.url,
      active: entity.active,
      mail: {
        disabled: entity.mailSettings?.disabled ?? false,
        displayName: entity.mailSettings?.displayName ?? '',
        orderConfirmationBCCEmail:
          entity.mailSettings?.orderConfirmationBCCEmail ?? '',
        loginUrl: entity.mailSettings?.loginUrl ?? '',
        passwordResetUrl: entity.mailSettings?.passwordResetUrl ?? '',
      },
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
    paymentMethods: channelPayments.value.map((p) => ({
      _id: p._id,
      active: p.active,
    })),
    storefrontSettings: storefrontSettings.value,
    mailSettings: {
      // Round-trip read-only mail metadata (fromEmailAddress, locale, etc.)
      // — the BE sends these on GET and expects them preserved on PATCH.
      ...(channelMailSettings.value ?? {}),
      // Editable general-tab fields — source of truth is the VeeValidate form.
      disabled: formData.mail?.disabled ?? false,
      displayName: formData.mail?.displayName ?? '',
      orderConfirmationBCCEmail: formData.mail?.orderConfirmationBCCEmail ?? '',
      loginUrl: formData.mail?.loginUrl ?? '',
      passwordResetUrl: formData.mail?.passwordResetUrl ?? '',
      // Layout-tab fields (STU-118).
      ...mailLayoutFields.value,
      ...(mailLayoutFiles.value.logoUrl
        ? { logoUrl: mailLayoutFiles.value.logoUrl }
        : {}),
      ...(mailLayoutFiles.value.headerImgUrl
        ? { headerImgUrl: mailLayoutFiles.value.headerImgUrl }
        : {}),
    },
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

// Reflect the entity page title into the breadcrumb store for both create and
// edit modes (STU-109). `entityPageTitle` derives "New channel" in create mode
// and the channel `name` in edit mode — a `watchEffect` keeps both in sync
// without needing separate hooks per mode.
watchEffect(() => {
  breadcrumbsStore.setCurrentTitle(entityPageTitle.value);
});

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

// Sync channelPayments into entityDataUpdate so useUnsavedChanges detects changes
watch(
  channelPayments,
  (val) => {
    if (!createMode.value) {
      entityDataUpdate.value.paymentMethods = val.map((p) => ({
        _id: p._id,
        active: p.active,
      }));
    }
  },
  { deep: true },
);

// Merge General-tab mail form fields (mail.*) into entityDataUpdate.mailSettings
// so useUnsavedChanges detects changes. Spread pattern — must not clobber
// Layout-tab fields (STU-118).
watch(
  () => form.values.mail,
  (mail) => {
    if (createMode.value || !mail) return;
    entityDataUpdate.value.mailSettings = {
      ...entityDataUpdate.value.mailSettings,
      disabled: mail.disabled ?? false,
      displayName: mail.displayName ?? '',
      orderConfirmationBCCEmail: mail.orderConfirmationBCCEmail ?? '',
      loginUrl: mail.loginUrl ?? '',
      passwordResetUrl: mail.passwordResetUrl ?? '',
    };
  },
  { deep: true },
);

// Merge Layout-tab mail fields into entityDataUpdate.mailSettings.
watch(
  mailLayoutFields,
  (fields) => {
    if (createMode.value) return;
    entityDataUpdate.value.mailSettings = {
      ...entityDataUpdate.value.mailSettings,
      ...fields,
    };
  },
  { deep: true },
);

// Staged files flip hasUnsavedChanges and end up in the multipart PATCH —
// `channel.update()` scans `mailSettings` for File values and turns them
// into multipart parts named `mailSettings.<key>`.
watch(
  mailLayoutFiles,
  (files) => {
    if (createMode.value) return;
    entityDataUpdate.value.mailSettings = {
      ...entityDataUpdate.value.mailSettings,
      ...(files.logoUrl ? { logoUrl: files.logoUrl } : {}),
      ...(files.headerImgUrl ? { headerImgUrl: files.headerImgUrl } : {}),
    };
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
    const { valid } = await form.validate();
    validateOnChange.value = true;
    return valid;
  });
};

const handleSave = async () => {
  const result = await updateEntity(
    async () => {
      const { valid } = await form.validate();
      validateOnChange.value = true;
      return valid;
    },
    {
      fields: [
        'languages',
        'markets',
        'paymentMethods',
        'storefrontSettings',
        'storefrontSchema',
        'mailSettings',
        'mailTypes',
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
    // Clear staged mail layout uploads — server response will have the new
    // URLs on channelMailSettings.
    mailLayoutFiles.value = {};
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
  if (entityData.value?.url) {
    dataList.push({
      label: t('channels.url'),
      value: entityData.value.url,
      displayValue: t('channels.visit_url'),
      displayType: DataItemDisplayType.Link,
      href: entityData.value.url,
      target: '_blank',
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
    if (channelPayments.value?.length) {
      const activePayments = channelPayments.value.filter((p) => p.active);
      if (activePayments.length) {
        const displayValue = activePayments.map((p) => p.name).join(', ');
        dataList.push({
          label: t('channels.tab_payments'),
          value: activePayments.map((p) => p._id),
          displayValue,
          displayType: DataItemDisplayType.Array,
          entityName: 'payment_method',
        });
      }
    }
    // Mail settings status
    dataList.push({
      label: t('channels.transaction_mails'),
      value: channelData?.mailSettings?.disabled ? t('inactive') : t('active'),
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
          'paymentMethods',
          'storefrontSettings',
          'storefrontSchema',
          'mailSettings',
          'mailTypes',
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
                        <FormInputLocked :model-value="internalName" />
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
                        <FormInputLocked v-bind="componentField" type="url" />
                      </FormControl>
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
              <!-- Additional languages -->
              <ChannelAdditionalLanguages
                :all-languages="allLanguages"
                :channel-languages="channelLanguages"
                :default-language-id="defaultLanguageId"
                @add="handleAddLanguages"
                @update="handleUpdateLanguage"
                @remove="handleRemoveLanguage"
              />
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
            <ChannelPaymentsTab
              v-model:payments="channelPayments"
              :all-markets="allMarkets"
              :loading="loading"
            />
          </ContentEditMainContent>
        </KeepAlive>
        <!-- Tab 3: Mails -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 3"
            :key="`tab-${currentTab}`"
          >
            <ChannelMailsTab
              v-model:layout-fields="mailLayoutFields"
              v-model:layout-files="mailLayoutFiles"
              :mail-types="channelMailTypes"
              :loading="loading"
              :channel-id="entityId ?? ''"
              :languages="channelActiveLanguages"
              :default-language="defaultLanguageId"
              :storefront-url="entityDataUpdate?.url ?? ''"
              :mail-from-email="channelMailSettings?.fromEmailAddress ?? ''"
              @mail-saved="handleMailSaved"
            />
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
