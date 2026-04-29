<script setup lang="ts">
import type {
  ChannelMailType,
  Language,
  MailTextEntry,
  MailTextsUpdateRequest,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

const props = defineProps<{
  channelId: string;
  mailType: ChannelMailType | null;
  languages: Language[];
  defaultLanguage: string;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
  saved: [];
}>();

const open = defineModel<boolean>('open', { required: true });

const { t } = useI18n();
const { toast } = useToast();
const { accountApi } = useGeinsRepository();
const { showErrorToast } = usePageError({ scope: 'ChannelMailConfigSheet' });

const activeTab = ref<'edit' | 'preview'>('edit');
const selectedLanguage = ref(props.defaultLanguage);
const textEntries = ref<MailTextEntry[]>([]);
const localOverrides = ref<Record<string, string>>({});
const initialValues = ref<Record<string, string>>({});
const loading = ref(false);
const saving = ref(false);
const textsError = ref(false);

// Preview tab state — lazy: only fetched the first time the tab is shown
// or when the user explicitly refreshes / changes language.
const previewHtml = ref('');
const previewLoading = ref(false);
const previewError = ref(false);
const previewLoaded = ref(false);

watch(
  () => props.defaultLanguage,
  (lang) => {
    selectedLanguage.value = lang;
  },
);

async function fetchTexts() {
  if (!props.mailType || !props.channelId) return;
  loading.value = true;
  textsError.value = false;
  try {
    const result = await accountApi.channel
      .id(props.channelId)
      .mail.getTexts(props.mailType._id, selectedLanguage.value);
    textEntries.value = result.texts;
    // Seed the editor with the effective current text so users see and edit
    // the default directly. API returns overrideValue as "" when unset (not
    // null), so use `||` rather than `??` to fall through empty overrides.
    // Track the seeded value per key so we only submit fields the user
    // actually changed.
    const seeded = Object.fromEntries(
      result.texts.map((e) => [e.key, e.overrideValue || e.defaultValue || '']),
    );
    localOverrides.value = { ...seeded };
    initialValues.value = { ...seeded };
  } catch {
    textsError.value = true;
    await showErrorToast(t('channels.mail_load_texts_error'));
    textEntries.value = [];
    localOverrides.value = {};
    initialValues.value = {};
  } finally {
    loading.value = false;
  }
}

watch(
  [() => open.value, () => props.mailType?._id],
  ([isOpen, type]) => {
    if (isOpen && type) {
      activeTab.value = 'edit';
      selectedLanguage.value = props.defaultLanguage;
      previewLoaded.value = false;
      previewHtml.value = '';
      previewError.value = false;
      fetchTexts();
    }
  },
  { immediate: true },
);

async function fetchPreview() {
  if (!props.mailType || !props.channelId) return;
  previewLoading.value = true;
  previewError.value = false;
  try {
    previewHtml.value = await accountApi.channel
      .id(props.channelId)
      .mail.preview(props.mailType._id, selectedLanguage.value);
  } catch {
    previewError.value = true;
  } finally {
    previewLoading.value = false;
  }
}

watch(activeTab, async (tab) => {
  if (tab === 'preview' && !previewLoaded.value) {
    await fetchPreview();
    previewLoaded.value = true;
  }
});

watch(selectedLanguage, (val, prev) => {
  if (val === prev || !open.value) return;
  fetchTexts();
  // Preview is shared state — if it was already loaded (or is currently
  // visible), reload for the new language; otherwise invalidate so it
  // refetches the next time the user switches to it.
  if (activeTab.value === 'preview' || previewLoaded.value) {
    fetchPreview();
  } else {
    previewLoaded.value = false;
  }
});

const allTextKeys = computed(() => textEntries.value.map((e) => e.key));
const hasOverrides = computed(() =>
  textEntries.value.some((e) => e.isOverridden),
);

function buildChangedTexts(): Record<string, string> {
  const texts: Record<string, string> = {};
  for (const entry of textEntries.value) {
    const current = localOverrides.value[entry.key] ?? '';
    const initial = initialValues.value[entry.key] ?? '';
    if (current !== initial) texts[entry.key] = current;
  }
  return texts;
}

async function handleSave() {
  if (!props.mailType) return;
  saving.value = true;
  try {
    const payload: MailTextsUpdateRequest = {
      language: selectedLanguage.value,
      texts: buildChangedTexts(),
    };
    await accountApi.channel
      .id(props.channelId)
      .mail.updateTexts(props.mailType._id, payload);
    toast({
      title: t('channels.mail_save_success'),
      variant: 'positive',
    });
    emit('saved');
    await fetchTexts();
    // Always reload the preview after a save so the saved live version is
    // fresh the next time the preview tab is shown.
    if (activeTab.value === 'preview' || previewLoaded.value) {
      await fetchPreview();
    } else {
      previewLoaded.value = false;
    }
  } catch {
    await showErrorToast(t('channels.mail_save_error'));
  } finally {
    saving.value = false;
  }
}

async function handleRestoreDefaults() {
  if (!props.mailType) return;
  saving.value = true;
  try {
    const texts: Record<string, string> = {};
    for (const entry of textEntries.value.filter((e) => e.isOverridden)) {
      texts[entry.key] = '';
    }
    await accountApi.channel
      .id(props.channelId)
      .mail.updateTexts(props.mailType._id, {
        language: selectedLanguage.value,
        texts,
      });
    toast({
      title: t('channels.mail_save_success'),
      variant: 'positive',
    });
    emit('saved');
    await fetchTexts();
    if (activeTab.value === 'preview' || previewLoaded.value) {
      await fetchPreview();
    } else {
      previewLoaded.value = false;
    }
  } catch {
    await showErrorToast(t('channels.mail_save_error'));
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  open.value = false;
}

const categoryLabel = computed(() => {
  if (!props.mailType) return '';
  return t(`channels.mail_category_${props.mailType.category.toLowerCase()}`);
});
</script>

<template>
  <Sheet :open="open" @update:open="emit('update:open', $event)">
    <SheetContent side="right" width="medium">
      <SheetHeader>
        <SheetTitle class="flex items-center gap-2">
          <span>{{ mailType?.name }}</span>
          <Badge v-if="mailType" variant="secondary">{{ categoryLabel }}</Badge>
        </SheetTitle>
        <SheetDescription class="sr-only">
          {{ mailType?.name }}
        </SheetDescription>
      </SheetHeader>
      <SheetBody class="flex h-full flex-col gap-4">
        <Tabs v-model="activeTab" class="h-full">
          <div class="bg-card sticky top-0 z-10 flex items-center gap-3 pb-3">
            <TabsList class="">
              <TabsTrigger value="edit" class="flex items-center gap-1.5">
                {{ t('channels.mail_edit_tab') }}
              </TabsTrigger>
              <TabsTrigger value="preview" class="flex items-center gap-1.5">
                {{ t('channels.mail_preview_tab') }}
              </TabsTrigger>
            </TabsList>
            <LucideLoaderCircle
              v-if="loading || previewLoading"
              class="size-5 animate-spin"
            />
          </div>

          <!-- Edit tab -->
          <TabsContent
            value="edit"
            class="flex min-h-[93%] flex-1 flex-col gap-4 overflow-hidden"
          >
            <div class="space-y-1.5">
              <Label>{{ t('channels.mail_select_language') }}</Label>
              <FormInputLanguageSelect
                v-model="selectedLanguage"
                :data-set="languages"
                show-flags
                disable-teleport
              />
            </div>

            <div v-if="loading" class="flex flex-col gap-4">
              <div v-for="i in 4" :key="i" class="flex flex-col gap-1.5">
                <Skeleton class="h-4 w-28" />
                <Skeleton class="h-20 w-full" />
              </div>
            </div>

            <Empty v-else-if="textsError">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LucideAlertCircle class="size-5" />
                </EmptyMedia>
                <EmptyTitle>
                  {{ t('channels.mail_load_texts_error_title') }}
                </EmptyTitle>
                <EmptyDescription>
                  {{ t('channels.mail_load_texts_error_description') }}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <ButtonIcon
                  icon="retry"
                  variant="secondary"
                  @click="fetchTexts"
                >
                  {{ $t('retry') }}
                </ButtonIcon>
              </EmptyContent>
            </Empty>

            <Empty v-else-if="!textEntries.length">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LucideFileText class="size-5" />
                </EmptyMedia>
                <EmptyTitle>{{ t('channels.mail_no_texts') }}</EmptyTitle>
                <EmptyDescription>
                  {{ t('channels.mail_no_texts_description') }}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>

            <div v-else class="flex flex-col gap-4">
              <div
                v-for="entry in textEntries"
                :key="entry.key"
                class="flex flex-col gap-1.5"
              >
                <div class="flex items-center justify-between gap-2">
                  <Label>{{ prettifyLangKey(entry.key, allTextKeys) }}</Label>
                  <Badge
                    v-if="entry.isOverridden"
                    variant="warning-light"
                    size="sm"
                    class="mr-0.5 mb-0.5"
                  >
                    {{ t('channels.mail_text_overridden') }}
                  </Badge>
                </div>
                <Textarea
                  :model-value="localOverrides[entry.key] ?? ''"
                  rows="3"
                  @update:model-value="
                    localOverrides[entry.key] = String($event)
                  "
                />
                <FormInputDescription v-if="entry.variables?.length">
                  {{ t('channels.mail_template_variables_hint') }}
                  <template
                    v-for="(variable, idx) in entry.variables"
                    :key="variable"
                  >
                    <code class="bg-muted rounded px-1 py-0.5 text-xs">{{
                      '{' + variable + '}'
                    }}</code
                    ><span v-if="idx < (entry.variables?.length ?? 0) - 1"
                      >,
                    </span>
                  </template>
                </FormInputDescription>
              </div>
            </div>
          </TabsContent>

          <!-- Preview tab -->
          <TabsContent
            value="preview"
            class="flex min-h-0 flex-1 flex-col gap-4"
          >
            <div class="space-y-1.5">
              <Label>{{ t('channels.mail_select_language') }}</Label>
              <FormInputLanguageSelect
                v-model="selectedLanguage"
                :data-set="languages"
                show-flags
                disable-teleport
              />
            </div>

            <Feedback type="info">
              <template #title>{{ t('channels.mail_preview_tab') }}</template>
              <template #description>
                {{ t('channels.mail_preview_live_notice') }}
              </template>
            </Feedback>

            <Skeleton
              v-if="previewLoading"
              class="w-full rounded-md"
              style="height: 750px"
            />

            <Empty v-else-if="previewError">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <LucideAlertCircle class="size-5" />
                </EmptyMedia>
                <EmptyTitle>{{ t('channels.mail_preview_error') }}</EmptyTitle>
                <EmptyDescription>
                  {{ t('channels.mail_preview_error_description') }}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <ButtonIcon
                  icon="retry"
                  variant="secondary"
                  @click="fetchPreview"
                >
                  {{ $t('retry') }}
                </ButtonIcon>
              </EmptyContent>
            </Empty>

            <iframe
              v-else
              :srcdoc="previewHtml"
              sandbox=""
              class="w-full rounded-md border"
              style="height: 750px"
              :title="t('channels.mail_preview_tab')"
            />
          </TabsContent>
        </Tabs>
      </SheetBody>
      <SheetFooter class="flex-col gap-2 sm:flex-row sm:justify-between">
        <Button variant="outline" :disabled="saving" @click="handleCancel">
          {{ t('cancel') }}
        </Button>
        <div class="flex items-center gap-2">
          <Button
            v-if="hasOverrides"
            variant="outline"
            :disabled="loading || saving"
            @click="handleRestoreDefaults"
          >
            {{ t('channels.mail_restore_defaults') }}
          </Button>
          <Button :loading="saving" :disabled="loading" @click="handleSave">
            {{ t('save') }}
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
