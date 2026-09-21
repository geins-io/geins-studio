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
const { hasPending, commitPending } = providePendingCommits();
const caps = useAssetCapabilities();

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
// Set when the rename/move leg fails: `conflict` is the documented 409 (the
// target folder already holds that name), `error` is anything else. Shown
// inline — the call suppresses the toast so the reason sits by the fields.
const relocateFailed = ref<'conflict' | 'error' | null>(null);
// The etag this panel last wrote against. Seeded on open and advanced by a
// successful PATCH, so retrying after a failed relocate isn't rejected as stale
// by the etag the first PATCH already consumed.
const etag = ref<string | null>(null);

const formSchema = toTypedSchema(
  z.object({
    name: z
      .string()
      .min(1, { message: t('form.field_required') })
      // `relocate` takes a bare file name — a slash is a 422 from the real API.
      .refine((value) => !value.includes('/'), {
        message: t('asset_library.asset_name_no_slash'),
      }),
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
// An unsaved inline folder name is unsaved work too: it enables Save and trips
// the close guard, so it can be committed instead of lost with the panel.
const dirty = computed(() => isDirty.value || hasPending.value);

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
    relocateFailed.value = null;
    etag.value = props.asset.etag ?? null;
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
      tags: [...(props.asset.tags ?? [])],
      channels: [...(props.asset.channels ?? [])],
    };
    form.resetForm({ values });
    captureBaseline();
  }
});

// A save is up to two calls: metadata through `PATCH`, then name + folder
// through `relocate` (one endpoint covers rename and move, as a full replace).
// PATCH goes first and carries the `If-Match`, so a concurrent change is caught
// as a 412 before the relocate — which has no precondition of its own and would
// otherwise be unrecoverable. Name/folder are deliberately absent from the PATCH
// body: they are not part of the phase-1 update surface.
async function handleSave() {
  if (!props.asset) return;
  // Create a folder name typed into the picker but never saved — it feeds the
  // folderId read below, so skipping it would move the asset to the old folder.
  if (!(await commitPending())) return;
  const result = await form.validate();
  if (!result.valid) return;
  const asset = props.asset;
  const name = form.values.name ?? asset.name;
  const folderId = form.values.folderId ?? null;
  loading.value = true;
  relocateFailed.value = null;
  try {
    const payload: AssetUpdate = {
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
    const fetchOptions = etag.value
      ? { headers: { 'If-Match': etag.value } }
      : undefined;
    const updated = await assetApi.update(
      asset._id,
      payload,
      undefined,
      fetchOptions,
    );
    etag.value = updated?.etag ?? etag.value;

    if (name !== asset.name || folderId !== asset.folderId) {
      try {
        // Relocate answers 200 or 202 — a 202 means the move is accepted but
        // not settled, so the refreshed list is the source of truth either way.
        await assetApi.relocate(
          asset._id,
          { name, folderId },
          { suppressErrorToast: true },
        );
      } catch (error) {
        geinsLogError('relocateAsset', getErrorMessage(error));
        relocateFailed.value =
          getErrorStatus(error) === 409 ? 'conflict' : 'error';
        // The metadata write landed — surface it while the panel stays open on
        // the failed rename/move.
        await refreshNuxtData('asset-library-list');
        emit('updated');
        return;
      }
    }

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
    :dirty="dirty"
    :loading="loading"
    :save-disabled="!dirty"
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

      <Alert v-if="relocateFailed" variant="warning" class="mb-6">
        <LucideTriangleAlert class="size-4" />
        <AlertTitle>
          {{
            relocateFailed === 'conflict'
              ? $t('asset_library.asset_relocate_conflict_title')
              : $t('error_updating_entity', { entityKey })
          }}
        </AlertTitle>
        <AlertDescription>
          {{
            relocateFailed === 'conflict'
              ? $t('asset_library.asset_relocate_conflict_description')
              : $t('error_try_again')
          }}
        </AlertDescription>
      </Alert>

      <div class="mb-6">
        <AssetThumbnail
          :type="asset.type"
          :thumb-url="asset.thumbUrl"
          :url="asset.url"
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
        <!-- Metadata edit is gated per field, not as one block: name + folder
             (relocate), description + alt text (PATCH) ship on both backends,
             while tags / channels wait for phase 2. Each gated group is wrapped
             in its own <fieldset> (which reliably disables the nested custom
             controls). See useAssetCapabilities. -->
        <FormGridWrap>
          <FormGrid design="1">
            <FormField v-slot="{ componentField }" name="name" keep-value>
              <FormItem>
                <FormLabel>{{ $t('name', 1) }}</FormLabel>
                <FormControl>
                  <Input v-bind="componentField" />
                </FormControl>
                <FormMessage />
              </FormItem>
            </FormField>

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
