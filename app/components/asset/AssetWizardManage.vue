<script setup lang="ts">
import type { EntityBaseWithName, LocalizedText } from '#shared/types';
import { mimeToAssetType } from '#shared/utils/asset';
import { formatFileSize } from '#shared/utils/file';

/**
 * Step 2 of the upload wizard — the manage pane. A split panel: the left column
 * lists the selected files with checkboxes; the right column edits the metadata
 * of the single selected file (this component) or, when several are checked, the
 * bulk pane (STU-320). All edits write straight into the shared wizard state via
 * {@link useUploadWizardContext}.
 */
const { assetApi } = useGeinsRepository();
const { meta } = useAssetType();
const { resolveIcon } = useLucideIcon();
const { folderName } = useFolders();
const { files, settingsOf, patchSettings, removeFiles } =
  useUploadWizardContext();

// Distinct existing tags feed the tags autocomplete (custom tags still typeable).
const { data: allTags } = useAsyncData<string[]>(
  'asset-tags',
  () => assetApi.listTags(),
  { default: () => [] },
);
const tagOptions = computed<EntityBaseWithName[]>(() =>
  (allTags.value ?? []).map((tag) => ({ _id: tag, name: tag })),
);

// Checkbox selection. A single checked file shows its fields; several switch to
// the bulk pane; a plain row click selects exactly one.
const checked = ref<string[]>([]);
const active = computed(() =>
  checked.value.length === 1
    ? files.value.find((f) => f.id === checked.value[0])
    : undefined,
);
const bulkMode = computed(() => checked.value.length > 1);

const allChecked = computed(
  () => files.value.length > 0 && checked.value.length === files.value.length,
);
const selectAllState = computed<boolean | 'indeterminate'>(() =>
  allChecked.value ? true : checked.value.length > 0 ? 'indeterminate' : false,
);
function toggleAll() {
  checked.value = allChecked.value ? [] : files.value.map((f) => f.id);
}
function toggleCheck(id: string) {
  checked.value = checked.value.includes(id)
    ? checked.value.filter((x) => x !== id)
    : [...checked.value, id];
}
function selectSingle(id: string) {
  checked.value = [id];
}
function removeFile(id: string) {
  checked.value = checked.value.filter((x) => x !== id);
  removeFiles([id]);
}

// Prune stale ids if files are removed elsewhere (review step, etc.).
watch(files, (list) => {
  const ids = new Set(list.map((f) => f.id));
  checked.value = checked.value.filter((id) => ids.has(id));
});

const activeType = computed(() =>
  active.value ? mimeToAssetType(active.value.file.type) : 'other',
);
const activeMeta = computed(() => meta(activeType.value));

// Field bindings for the active file — read from its settings (falling back to
// the file's own name), write back through patchSettings.
const name = computed<string>({
  get: () =>
    active.value
      ? (settingsOf(active.value.id).name ?? active.value.file.name)
      : '',
  set: (value) => {
    if (active.value) patchSettings(active.value.id, { name: value });
  },
});
const description = computed<string>({
  get: () =>
    active.value ? (settingsOf(active.value.id).description ?? '') : '',
  set: (value) => {
    if (active.value) patchSettings(active.value.id, { description: value });
  },
});
const folderId = computed<string | null>({
  get: () =>
    active.value ? (settingsOf(active.value.id).folderId ?? null) : null,
  set: (value) => {
    if (active.value) patchSettings(active.value.id, { folderId: value });
  },
});
const tags = computed<string[]>({
  get: () => (active.value ? (settingsOf(active.value.id).tags ?? []) : []),
  set: (value) => {
    if (active.value) patchSettings(active.value.id, { tags: value });
  },
});
const channels = computed<string[]>({
  get: () => (active.value ? (settingsOf(active.value.id).channels ?? []) : []),
  set: (value) => {
    if (active.value) patchSettings(active.value.id, { channels: value });
  },
});
const altText = computed<LocalizedText>({
  get: () => (active.value ? (settingsOf(active.value.id).altText ?? {}) : {}),
  set: (value) => {
    if (active.value) patchSettings(active.value.id, { altText: value });
  },
});

const rowFolderName = (id: string): string | undefined => {
  const fid = settingsOf(id).folderId;
  return fid ? folderName(fid) : undefined;
};
</script>

<template>
  <div class="flex h-full min-h-0 overflow-hidden rounded-lg border">
    <!-- Left: file list -->
    <div class="flex w-[35%] min-w-0 shrink-0 flex-col border-r">
      <div class="flex items-center gap-3 border-b px-4 py-3">
        <Checkbox
          :model-value="selectAllState"
          :aria-label="$t('select_all')"
          @update:model-value="toggleAll"
        />
        <span
          class="text-muted-foreground text-xs font-medium tracking-wider uppercase"
        >
          {{ $t('file', 2) }} ({{ files.length }})
        </span>
      </div>
      <div class="min-h-0 flex-1 divide-y overflow-y-auto">
        <div
          v-for="f in files"
          :key="f.id"
          class="hover:bg-muted/40 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
          :class="checked.includes(f.id) && 'bg-muted/60'"
          @click="selectSingle(f.id)"
        >
          <Checkbox
            :model-value="checked.includes(f.id)"
            :aria-label="f.file.name"
            @click.stop
            @update:model-value="toggleCheck(f.id)"
          />
          <div
            :class="[
              meta(mimeToAssetType(f.file.type)).tint,
              'flex size-8 shrink-0 items-center justify-center rounded-md',
            ]"
          >
            <component
              :is="resolveIcon(meta(mimeToAssetType(f.file.type)).icon)"
              class="size-4"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {{ settingsOf(f.id).name ?? f.file.name }}
            </p>
            <p class="text-muted-foreground truncate text-xs">
              {{ formatFileSize(f.file.size) }}
              <template v-if="rowFolderName(f.id)">
                · {{ rowFolderName(f.id) }}
              </template>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: detail / bulk / empty -->
    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <!-- Bulk pane (STU-320) -->
      <div
        v-if="bulkMode"
        class="text-muted-foreground flex flex-1 items-center justify-center p-6 text-center text-sm"
      >
        {{
          $t(
            'asset_library.files_selected',
            { count: checked.length },
            checked.length,
          )
        }}
      </div>

      <!-- Single-file fields -->
      <template v-else-if="active">
        <div class="flex items-center gap-3 border-b px-6 py-4">
          <div
            :class="[
              activeMeta.tint,
              'flex size-9 shrink-0 items-center justify-center rounded-md',
            ]"
          >
            <component :is="resolveIcon(activeMeta.icon)" class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold">
              {{ name || active.file.name }}
            </p>
            <p class="text-muted-foreground text-xs">
              {{ formatFileSize(active.file.size) }} ·
              {{ $t(activeMeta.labelKey) }}
            </p>
          </div>
          <ButtonIcon
            icon="Trash2"
            variant="ghost"
            size="sm"
            :aria-label="$t('remove')"
            @click="removeFile(active.id)"
          />
        </div>

        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div class="space-y-1.5">
            <Label>{{ $t('name', 1) }}</Label>
            <Input v-model="name" />
          </div>

          <div v-if="activeType === 'image'" class="space-y-1.5">
            <Label>
              {{ $t('asset_library.alt_text') }}
              <span class="text-muted-foreground font-normal">
                ({{ $t('optional') }})
              </span>
            </Label>
            <FormTranslatableField
              v-model="altText"
              :label="$t('asset_library.alt_text')"
              :placeholder="$t('asset_library.alt_text_placeholder')"
              :subject="name || active.file.name"
            />
          </div>

          <div class="space-y-1.5">
            <Label>
              {{ $t('folder', 1) }}
              <span class="text-muted-foreground font-normal">
                ({{ $t('optional') }})
              </span>
            </Label>
            <AssetFolderPicker v-model="folderId" />
          </div>

          <div class="space-y-1.5">
            <Label>
              {{ $t('channel', 2) }}
              <span class="text-muted-foreground font-normal">
                ({{ $t('optional') }})
              </span>
            </Label>
            <FormInputChannels v-model="channels" />
          </div>

          <div class="space-y-1.5">
            <Label>
              {{ $t('description') }}
              <span class="text-muted-foreground font-normal">
                ({{ $t('optional') }})
              </span>
            </Label>
            <Textarea v-model="description" />
          </div>

          <div class="space-y-1.5">
            <Label>
              {{ $t('tag', 2) }}
              <span class="text-muted-foreground font-normal">
                ({{ $t('optional') }})
              </span>
            </Label>
            <FormInputTagsSearch
              v-model="tags"
              entity-key="tag"
              :data-set="tagOptions"
              :allow-custom-tags="true"
            />
          </div>
        </div>
      </template>

      <!-- Empty states -->
      <Empty v-else>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideFiles />
          </EmptyMedia>
          <EmptyTitle>
            {{
              files.length === 0
                ? $t('asset_library.wizard_no_files')
                : $t('asset_library.wizard_no_selection')
            }}
          </EmptyTitle>
          <EmptyDescription>
            {{
              files.length === 0
                ? $t('asset_library.wizard_no_files_hint')
                : $t('asset_library.wizard_no_selection_hint')
            }}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  </div>
</template>
