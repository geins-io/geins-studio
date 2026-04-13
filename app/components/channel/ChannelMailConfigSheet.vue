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
const loading = ref(false);
const saving = ref(false);

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
  try {
    const result = await accountApi.channel
      .id(props.channelId)
      .mail.getTexts(props.mailType.type, selectedLanguage.value);
    textEntries.value = result.texts;
    localOverrides.value = Object.fromEntries(
      result.texts.map((e) => [e.key, e.overrideValue ?? '']),
    );
  } catch {
    await showErrorToast(t('channels.mail_load_texts_error'));
    textEntries.value = [];
    localOverrides.value = {};
  } finally {
    loading.value = false;
  }
}

watch(
  [() => open.value, () => props.mailType?.type],
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
      .mail.preview(props.mailType.type, { language: selectedLanguage.value });
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

async function refreshPreview() {
  previewLoaded.value = false;
  await fetchPreview();
  previewLoaded.value = true;
}

watch(selectedLanguage, (val, prev) => {
  if (val === prev || !open.value) return;
  fetchTexts();
  if (activeTab.value === 'preview') fetchPreview();
});

function prettifyKey(key: string): string {
  return key
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildChangedTexts(): Record<string, string> {
  const texts: Record<string, string> = {};
  for (const entry of textEntries.value) {
    const current = localOverrides.value[entry.key] ?? '';
    const initial = entry.overrideValue ?? '';
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
      .mail.updateTexts(props.mailType.type, payload);
    toast({
      title: t('channels.mail_save_success'),
      variant: 'positive',
    });
    emit('saved');
    await fetchTexts();
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
      .mail.updateTexts(props.mailType.type, {
        language: selectedLanguage.value,
        texts,
      });
    toast({
      title: t('channels.mail_save_success'),
      variant: 'positive',
    });
    emit('saved');
    await fetchTexts();
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
    <SheetContent side="right" class="sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle class="flex items-center gap-2">
          <span>{{ mailType?.name }}</span>
          <Badge v-if="mailType" variant="secondary">{{ categoryLabel }}</Badge>
        </SheetTitle>
        <SheetDescription class="sr-only">
          {{ mailType?.name }}
        </SheetDescription>
      </SheetHeader>

      <Tabs v-model="activeTab" class="flex min-h-0 flex-1 flex-col">
        <TabsList class="mx-4">
          <TabsTrigger value="edit">
            {{ t('channels.mail_edit_tab') }}
          </TabsTrigger>
          <TabsTrigger value="preview">
            {{ t('channels.mail_preview_tab') }}
          </TabsTrigger>
        </TabsList>

        <!-- Edit tab -->
        <TabsContent
          value="edit"
          class="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <SheetBody class="flex flex-col gap-4">
            <div class="space-y-1.5">
              <Label>{{ t('channels.mail_select_language') }}</Label>
              <Select v-model="selectedLanguage">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="lang in languages"
                    :key="lang._id"
                    :value="lang._id"
                  >
                    <ChannelLanguageIcon
                      :language-id="lang._id"
                      :name="lang.name"
                    />
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="loading" class="flex flex-col gap-3">
              <Skeleton v-for="i in 4" :key="i" class="h-24 w-full" />
            </div>

            <div v-else-if="!textEntries.length" class="text-muted-foreground text-sm">
              {{ t('channels.mail_no_texts') }}
            </div>

            <div v-else class="flex flex-col gap-4">
              <div
                v-for="entry in textEntries"
                :key="entry.key"
                class="flex flex-col gap-1.5"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium">
                      {{ prettifyKey(entry.key) }}
                    </span>
                    <span
                      class="text-muted-foreground font-mono text-xs"
                    >{{ entry.key }}</span>
                  </div>
                  <Badge v-if="entry.isOverridden" variant="secondary">
                    {{ t('channels.mail_text_overridden') }}
                  </Badge>
                </div>
                <Textarea
                  :model-value="localOverrides[entry.key] ?? ''"
                  :placeholder="entry.defaultValue"
                  rows="3"
                  @update:model-value="
                    localOverrides[entry.key] = String($event)
                  "
                />
                <FormInputDescription>
                  {{ t('channels.mail_template_variables_hint') }}
                </FormInputDescription>
              </div>
            </div>
          </SheetBody>

          <SheetFooter class="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              :disabled="loading || saving"
              @click="handleRestoreDefaults"
            >
              {{ t('channels.mail_restore_defaults') }}
            </Button>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                :disabled="saving"
                @click="handleCancel"
              >
                {{ t('cancel') }}
              </Button>
              <Button :loading="saving" :disabled="loading" @click="handleSave">
                {{ t('save') }}
              </Button>
            </div>
          </SheetFooter>
        </TabsContent>

        <!-- Preview tab -->
        <TabsContent value="preview" class="flex min-h-0 flex-1 flex-col">
          <SheetBody class="flex flex-col gap-3">
            <div class="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                :disabled="previewLoading"
                @click="refreshPreview"
              >
                <LucideRefreshCw class="mr-2 size-4" />
                {{ t('channels.mail_preview_refresh') }}
              </Button>
            </div>

            <Skeleton
              v-if="previewLoading"
              class="w-full rounded-md"
              style="height: 600px"
            />

            <div
              v-else-if="previewError"
              class="text-destructive flex flex-col items-center gap-2 py-8"
            >
              <LucideAlertCircle class="size-6" />
              <p class="text-sm">{{ t('channels.mail_preview_error') }}</p>
              <Button variant="outline" size="sm" @click="fetchPreview">
                {{ t('retry') }}
              </Button>
            </div>

            <iframe
              v-else
              :srcdoc="previewHtml"
              sandbox=""
              class="w-full rounded-md border"
              style="height: 600px"
              :title="t('channels.mail_preview_tab')"
            />
          </SheetBody>
        </TabsContent>
      </Tabs>
    </SheetContent>
  </Sheet>
</template>
