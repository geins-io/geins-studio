<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import type {
  Asset,
  AssetLocalizations,
  AssetUpdate,
  EntityBaseWithName,
  Localized,
  LocalizedText,
} from '#shared/types';
import { ENTITIES } from '#shared/utils/entities';
import { formatFileSize } from '#shared/utils/file';

/**
 * Asset detail/edit panel — the standard slide-in edit panel (PanelEdit) for a
 * single asset. Editable metadata (name, folder, description, tags, channels)
 * plus read-only info. Alt text (translation panel), actions, and replace are
 * separate. Opened from the library card/row via `v-model:open` + `:asset`.
 */
const props = defineProps<{ asset: Asset | null }>();
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ updated: []; replaced: [Asset] }>();

const { t } = useI18n();
const { currentLanguage } = storeToRefs(useAccountStore());
const { assetApi } = useGeinsRepository();
const { formatDate } = useDate();
const { geinsLogError } = useGeinsLog('components/AssetDetailPanel.vue');
const { copyUrl, download, deleteAsset } = useAssetActions();
const caps = useAssetCapabilities();

// Save is possible when at least one metadata field the backend permits is
// editable — phase 1 allows description + alt text; the mock allows all.
const canEditAnyMetadata =
  caps.canEditDescriptionAltText ||
  caps.canRenameAsset ||
  caps.canEditTags ||
  caps.canEditChannels ||
  caps.canMoveAsset;

const entityKey = ENTITIES.asset.key;

// Distinct tags across all assets feed the tags field's autocomplete (custom
// tags can still be typed). Shaped as `{ _id, name }` for FormInputTagsSearch;
// refreshed each open so freshly coined tags appear as options.
const { data: allTags, refresh: refreshTags } = useAsyncData<string[]>(
  'asset-tags',
  () => assetApi.listTags(),
  { default: () => [], immediate: caps.tagAutocomplete },
);
const tagOptions = computed<EntityBaseWithName[]>(() =>
  (allTags.value ?? []).map((tag) => ({ _id: tag, name: tag })),
);

const loading = ref(false);
const replaceOpen = ref(false);
const deleteOpen = ref(false);
const deleting = ref(false);
// Set when a save fails the etag precondition (412) — someone else changed the
// asset since it loaded. Shown inline instead of the global toast (suppressed
// for 412 in geins-api); cleared on reopen.
const stale = ref(false);

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, { message: t('form.field_required') }),
    folderId: z.string().nullable(),
    description: z.record(z.string(), z.string()),
    altText: z.record(z.string(), z.string()),
    tags: z.array(z.string()),
    channels: z.array(z.string()),
  }),
);
const form = useForm({ validationSchema: formSchema });

interface AssetFormValues {
  name: string;
  folderId: string | null;
  description: LocalizedText;
  altText: LocalizedText;
  tags: string[];
  channels: string[];
}

// `form.meta.dirty` false-positives on open (undefined fields settling +
// child input mount emits), so derive dirty from a post-settle snapshot.
const { isDirty, captureBaseline } = usePanelDirty(() => form.values);

// description + altText are LocalizedText maps (locale→string) bound to
// FormTranslatableField, mapped to/from the wire `localizations` shape at
// load/save (both are per-locale, product-standard).
const description = computed<LocalizedText>({
  get: () => (form.values.description as LocalizedText | undefined) ?? {},
  set: (value) => form.setFieldValue('description', value),
});
const altText = computed<LocalizedText>({
  get: () => (form.values.altText as LocalizedText | undefined) ?? {},
  set: (value) => form.setFieldValue('altText', value),
});

// Merge the two per-locale maps into the wire `localizations` shape, dropping
// blank fields (and empty locales). A full replace: locales/fields absent here
// are cleared server-side — matching `assetLocalizationsRequest` semantics.
function buildLocalizations(
  descriptions: LocalizedText,
  altTexts: LocalizedText,
): Localized<AssetLocalizations> {
  const out: Localized<AssetLocalizations> = {};
  for (const locale of new Set([
    ...Object.keys(descriptions),
    ...Object.keys(altTexts),
  ])) {
    const entry: AssetLocalizations = {};
    const desc = descriptions[locale]?.trim();
    const alt = altTexts[locale]?.trim();
    if (desc) entry.description = desc;
    if (alt) entry.altText = alt;
    if (Object.keys(entry).length) out[locale] = entry;
  }
  return out;
}
watch(open, (value) => {
  if (value && props.asset) {
    stale.value = false;
    if (caps.tagAutocomplete) refreshTags();
    // Edit description + alt text as locale→string maps; localizations is the
    // wire shape (only non-empty fields are kept).
    const localizations = props.asset.localizations ?? {};
    const descriptions: LocalizedText = {};
    const altTexts: LocalizedText = {};
    for (const [lang, loc] of Object.entries(localizations)) {
      if (loc.description) descriptions[lang] = loc.description;
      if (loc.altText) altTexts[lang] = loc.altText;
    }
    // Legacy rows kept description in a top-level column, not localizations —
    // seed the current language so an existing description survives a first edit.
    if (!Object.keys(descriptions).length && props.asset.description) {
      descriptions[currentLanguage.value] = props.asset.description;
    }
    const values: AssetFormValues = {
      name: props.asset.name,
      folderId: props.asset.folderId,
      description: descriptions,
      altText: altTexts,
      tags: [...props.asset.tags],
      channels: [...props.asset.channels],
    };
    form.resetForm({ values });
    captureBaseline();
  }
});

async function handleSave() {
  if (!props.asset) return;
  const result = await form.validate();
  if (!result.valid) return;
  loading.value = true;
  try {
    const payload: AssetUpdate = {
      name: form.values.name,
      folderId: form.values.folderId ?? null,
      // Description + alt text both round-trip through localizations (the
      // top-level values are derived server-side in the account default language).
      localizations: buildLocalizations(
        (form.values.description as LocalizedText | undefined) ?? {},
        (form.values.altText as LocalizedText | undefined) ?? {},
      ),
      tags: form.values.tags ?? [],
      channels: form.values.channels ?? [],
    };
    // Round-trip the loaded etag as If-Match so a concurrent change is caught
    // (412) instead of silently overwritten. Omitted when the backend gave none.
    const fetchOptions = props.asset.etag
      ? { headers: { 'If-Match': props.asset.etag } }
      : undefined;
    await assetApi.update(props.asset._id, payload, undefined, fetchOptions);
    await refreshNuxtData('asset-library-list');
    emit('updated');
    open.value = false;
  } catch (error) {
    if (getErrorStatus(error) === 412) {
      stale.value = true;
      return;
    }
    geinsLogError('updateAsset', getErrorMessage(error));
  } finally {
    loading.value = false;
  }
}

// Discard the stale local copy and reload: the list refresh re-fetches with the
// current etag, so reopening the panel edits fresh data.
function handleReloadStale() {
  emit('updated');
  open.value = false;
}

async function handleDelete() {
  if (!props.asset) return;
  deleting.value = true;
  const ok = await deleteAsset(props.asset);
  deleting.value = false;
  if (!ok) return;
  deleteOpen.value = false;
  open.value = false;
  emit('updated');
}
</script>

<template>
  <PanelEdit
    v-model:open="open"
    width="narrow"
    :title="asset?.name ?? $t(entityKey, 1)"
    :entity-key="entityKey"
    :dirty="isDirty"
    :loading="loading"
    :save-disabled="!isDirty || !canEditAnyMetadata"
    @save="handleSave"
  >
    <template v-if="asset">
      <Alert v-if="stale" variant="warning" class="mb-6">
        <LucideTriangleAlert class="size-4" />
        <AlertTitle>{{ $t('asset_library.asset_stale_title') }}</AlertTitle>
        <AlertDescription class="flex flex-col items-start gap-2">
          {{ $t('asset_library.asset_stale_description') }}
          <Button
            size="sm"
            variant="outline"
            class="bg-transparent dark:bg-transparent"
            @click="handleReloadStale"
          >
            {{ $t('reload') }}
          </Button>
        </AlertDescription>
      </Alert>

      <div class="mb-6">
        <AssetThumbnail
          :type="asset.type"
          :thumb-url="asset.thumbUrl"
          :alt="asset.name"
          size="banner"
        />
      </div>

      <div class="flex gap-2">
        <ButtonIcon
          icon="copy"
          variant="outline"
          size="sm"
          class="flex-1 bg-transparent dark:bg-transparent"
          :disabled="!asset.url"
          @click="copyUrl(asset)"
        >
          {{ $t('asset_library.copy_public_url') }}
        </ButtonIcon>
        <ButtonIcon
          icon="download"
          variant="outline"
          size="sm"
          class="flex-1 bg-transparent dark:bg-transparent"
          :disabled="!asset.url"
          @click="download(asset)"
        >
          {{ $t('download') }}
        </ButtonIcon>
        <ButtonIcon
          icon="RefreshCw"
          variant="outline"
          size="sm"
          class="flex-1 bg-transparent dark:bg-transparent"
          :disabled="!caps.canReplaceFile"
          @click="replaceOpen = true"
        >
          {{ $t('replace') }}
        </ButtonIcon>
      </div>

      <div class="border-border -mx-3 mt-4 mb-6 border-b sm:-mx-6" />

      <form @submit.prevent>
        <!-- Metadata edit is gated per field, not as one block: the real
             Geins.Media phase 1 PATCH only sets description + alt text, so those
             stay editable while rename / folder move / tags / channels disable
             until phase 2. Each group is wrapped in its own <fieldset> (which
             reliably disables the nested custom controls). See
             useAssetCapabilities. -->
        <FormGridWrap>
          <FormGrid design="1">
            <fieldset
              :disabled="!caps.canRenameAsset"
              class="m-0 min-w-0 border-0 p-0"
              :class="{ 'opacity-60': !caps.canRenameAsset }"
            >
              <FormField v-slot="{ componentField }" name="name" keep-value>
                <FormItem>
                  <FormLabel>{{ $t('name', 1) }}</FormLabel>
                  <FormControl>
                    <Input v-bind="componentField" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </FormField>
            </fieldset>

            <fieldset
              :disabled="!caps.canMoveAsset"
              class="m-0 min-w-0 border-0 p-0"
              :class="{ 'opacity-60': !caps.canMoveAsset }"
            >
              <FormField
                v-slot="{ value, handleChange }"
                name="folderId"
                keep-value
              >
                <FormItem>
                  <FormLabel :optional="true">{{ $t('folder', 1) }}</FormLabel>
                  <AssetFolderPicker
                    :model-value="value"
                    @update:model-value="handleChange"
                  />
                </FormItem>
              </FormField>
            </fieldset>

            <FormField name="description" keep-value>
              <FormItem>
                <FormLabel :optional="true">
                  {{ $t('description') }}
                </FormLabel>
                <FormTranslatableField
                  v-model="description"
                  multiline
                  :label="$t('description')"
                  :placeholder="$t('asset_library.description_placeholder')"
                  :subject="asset.name"
                  :disabled="!caps.canEditDescriptionAltText"
                />
              </FormItem>
            </FormField>

            <FormField v-if="asset.type === 'image'" name="altText" keep-value>
              <FormItem>
                <FormLabel :optional="true">
                  {{ $t('asset_library.alt_text') }}
                </FormLabel>
                <FormTranslatableField
                  v-model="altText"
                  :label="$t('asset_library.alt_text')"
                  :placeholder="$t('asset_library.alt_text_placeholder')"
                  :subject="asset.name"
                  :disabled="!caps.canEditDescriptionAltText"
                />
              </FormItem>
            </FormField>

            <fieldset
              :disabled="!caps.canEditTags"
              class="m-0 min-w-0 border-0 p-0"
              :class="{ 'opacity-60': !caps.canEditTags }"
            >
              <FormField v-slot="{ componentField }" name="tags" keep-value>
                <FormItem>
                  <FormLabel :optional="true">{{ $t('tag', 2) }}</FormLabel>
                  <FormControl>
                    <FormInputTagsSearch
                      :model-value="componentField.modelValue"
                      entity-key="tag"
                      :data-set="tagOptions"
                      :allow-custom-tags="true"
                      @update:model-value="
                        componentField['onUpdate:modelValue']
                      "
                    />
                  </FormControl>
                </FormItem>
              </FormField>
            </fieldset>

            <fieldset
              :disabled="!caps.canEditChannels"
              class="m-0 min-w-0 border-0 p-0"
              :class="{ 'opacity-60': !caps.canEditChannels }"
            >
              <FormField
                v-slot="{ value, handleChange }"
                name="channels"
                keep-value
              >
                <FormItem>
                  <FormLabel :optional="true">{{ $t('channel', 2) }}</FormLabel>
                  <FormControl>
                    <FormInputChannels
                      :model-value="value"
                      @update:model-value="handleChange"
                    />
                  </FormControl>
                </FormItem>
              </FormField>
            </fieldset>
          </FormGrid>
        </FormGridWrap>
      </form>

      <dl class="mt-6 space-y-2 border-t pt-4 text-sm">
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">{{ $t('type') }}</dt>
          <dd><AssetTypeBadge :type="asset.type" /></dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">{{ $t('size') }}</dt>
          <dd>{{ formatFileSize(asset.sizeBytes) }}</dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">{{ $t('created') }}</dt>
          <dd>{{ formatDate(asset.createdAt, { dateStyle: 'medium' }) }}</dd>
        </div>
        <div class="flex items-center justify-between">
          <dt class="text-muted-foreground">{{ $t('modified') }}</dt>
          <dd>{{ formatDate(asset.updatedAt, { dateStyle: 'medium' }) }}</dd>
        </div>
        <div v-if="asset.createdBy" class="flex items-center justify-between">
          <dt class="text-muted-foreground">{{ $t('created_by') }}</dt>
          <dd>{{ asset.createdBy }}</dd>
        </div>
      </dl>

      <div class="mt-6 border-t pt-6">
        <div class="flex items-center justify-between gap-4">
          <ContentCardHeader
            size="md"
            heading-level="h3"
            :title="$t('delete_entity', { entityKey })"
            :description="$t('asset_library.asset_remove_description')"
          />
          <Button
            size="sm"
            variant="destructive"
            :disabled="deleting || !caps.canDeleteAsset"
            @click.stop="deleteOpen = true"
          >
            {{ $t('delete') }}
          </Button>
        </div>
      </div>

      <AssetReplaceDialog
        v-model:open="replaceOpen"
        :asset="asset"
        @replaced="emit('replaced', $event)"
      />

      <DialogDelete
        v-model:open="deleteOpen"
        :entity-key="entityKey"
        :loading="deleting"
        :description="$t('asset_library.asset_delete_confirm_description')"
        :warning-title="$t('asset_library.removing_everywhere')"
        :warning-description="
          $t('asset_library.remove_everywhere_description', 1)
        "
        @confirm="handleDelete"
      />
    </template>
  </PanelEdit>
</template>
