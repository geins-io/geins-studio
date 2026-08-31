<script setup lang="ts">
import type { EntityBaseWithName } from '#shared/types';

/**
 * Bulk-edit pane for step 2 of the upload wizard — shown when more than one file
 * is checked. Applies folder, channels and tags across the whole selection in
 * one pass; the reconciliation (shared value vs. "mixed", tri-state channels,
 * shared-tag diffing) lives in {@link useUploadWizard}, not here.
 */
const props = defineProps<{
  ids: string[];
  tagOptions: EntityBaseWithName[];
}>();
const emit = defineEmits<{ deselect: []; removed: [] }>();

const {
  removeFiles,
  bulkFolderId,
  setBulkFolder,
  channelState,
  bulkChannelUnion,
  applyBulkChannels,
  bulkSharedTags,
  applyBulkTags,
} = useUploadWizardContext();

const folder = computed<string | null | undefined>({
  get: () => bulkFolderId(props.ids),
  set: (value) => setBulkFolder(props.ids, value ?? null),
});

// The selector shows the union of channels across the selection; a channel only
// some files have is marked with a dashed chip border.
const channels = computed<string[]>({
  get: () => bulkChannelUnion(props.ids),
  set: (value) => applyBulkChannels(props.ids, value),
});
const channelItemClass = (id: string) =>
  channelState(props.ids, id) === 'partial'
    ? 'border-dashed border-muted-foreground/35 bg-background dark:bg-background'
    : undefined;

const tags = computed<string[]>({
  get: () => bulkSharedTags(props.ids),
  set: (value) => applyBulkTags(props.ids, value),
});

function removeSelected() {
  removeFiles(props.ids);
  emit('removed');
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="flex items-center gap-3 border-b px-6 py-4">
      <div
        class="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-md"
      >
        <LucideFiles class="size-4" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold">
          {{
            $t(
              'asset_library.files_selected',
              { count: ids.length },
              ids.length,
            )
          }}
        </p>
        <p class="text-muted-foreground text-xs">
          {{ $t('asset_library.wizard_bulk_apply_hint') }}
        </p>
      </div>
      <button
        type="button"
        class="text-link shrink-0 text-sm underline hover:opacity-80"
        @click="emit('deselect')"
      >
        {{ $t('deselect_all') }}
      </button>
    </div>

    <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
      <div class="space-y-1.5">
        <Label>{{ $t('folder', 1) }}</Label>
        <AssetFolderPicker
          v-model="folder"
          :placeholder="$t('asset_library.wizard_bulk_folder_placeholder')"
        />
      </div>

      <div class="space-y-1.5">
        <Label>
          {{ $t('channel', 2) }}
          <span class="text-muted-foreground font-normal">
            ({{ $t('optional') }})
          </span>
        </Label>
        <FormInputChannels v-model="channels" :item-class="channelItemClass" />
        <p class="text-muted-foreground text-xs">
          {{ $t('asset_library.wizard_channels_partial_hint') }}
        </p>
      </div>

      <div class="space-y-1.5">
        <Label>{{ $t('tag', 2) }}</Label>
        <FormInputTagsSearch
          v-model="tags"
          entity-key="tag"
          :data-set="tagOptions"
          :allow-custom-tags="true"
        />
      </div>

      <div class="space-y-1.5">
        <Label>{{ $t('remove') }}</Label>
        <div>
          <Button
            variant="outline"
            class="text-destructive hover:text-destructive gap-1.5 font-normal"
            @click="removeSelected"
          >
            <LucideTrash2 class="size-4" />
            {{
              $t(
                'asset_library.wizard_remove_from_upload',
                { count: ids.length },
                ids.length,
              )
            }}
          </Button>
          <p class="text-muted-foreground mt-2 text-xs">
            {{ $t('asset_library.wizard_remove_from_upload_hint') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
