<script setup lang="ts">
import type { Asset } from '#shared/types';
import { formatFileSize } from '#shared/utils/file';

/**
 * Grid tile for a single asset: thumbnail, name, type badge, folder, tags, and
 * size/modified meta. Click (name or card) or the action menu opens the asset.
 *
 * In `selectable` mode (asset picker) the tile becomes a selection target: a
 * checkbox overlays the thumbnail, the whole tile toggles selection instead of
 * opening, and `hideActions` drops the per-card actions menu.
 */
const props = withDefaults(
  defineProps<{
    asset: Asset;
    /** Resolved folder name (the asset only carries `folderId`). */
    folderName?: string;
    /** Picker mode — render a selection checkbox and toggle on tile click. */
    selectable?: boolean;
    /** Reflected selected state (driven by the parent). */
    selected?: boolean;
    /** Suppress the actions menu (the picker has selection only). */
    hideActions?: boolean;
  }>(),
  {
    selectable: false,
    selected: false,
    hideActions: false,
  },
);

const emit = defineEmits<{
  open: [];
  download: [];
  copyUrl: [];
  delete: [];
  toggleSelect: [];
}>();

const { formatDate } = useDate();
const { canDeleteAsset } = useAssetCapabilities();
const size = computed(() => formatFileSize(props.asset.sizeBytes));

// In the picker, the tile is a selection target — clicking the thumbnail or
// name toggles selection rather than opening the (nonexistent) detail panel.
const activate = () => {
  if (props.selectable) {
    emit('toggleSelect');
  } else {
    emit('open');
  }
};
</script>

<template>
  <Card
    :class="
      cn(
        'group flex h-full flex-col gap-0 overflow-hidden py-0 transition-colors hover:shadow-sm',
        selectable && selected
          ? 'border-primary ring-primary ring-2'
          : 'hover:border-ring/40',
      )
    "
  >
    <div class="relative">
      <button
        type="button"
        class="block w-full cursor-pointer"
        :aria-label="
          selectable ? $t('select') : $t('asset_library.view_details')
        "
        @click="activate"
      >
        <AssetThumbnail
          :type="asset.type"
          :thumb-url="asset.thumbUrl"
          :alt="asset.name"
          size="card"
          class="rounded-none"
        />
      </button>
      <div
        v-if="selectable"
        :class="
          cn(
            'absolute top-2 left-2 transition-opacity',
            selected
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
          )
        "
      >
        <Checkbox
          :model-value="selected"
          :aria-label="$t('select')"
          class="bg-white/90 shadow-xs"
          @click.stop="emit('toggleSelect')"
        />
      </div>
      <div
        v-if="!hideActions"
        class="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
      >
        <AssetActionsMenu
          :asset="asset"
          :can-delete="canDeleteAsset"
          @open="emit('open')"
          @download="emit('download')"
          @copy-url="emit('copyUrl')"
          @delete="emit('delete')"
        />
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-2 p-3">
      <button
        type="button"
        class="link-text truncate text-left text-sm"
        @click="activate"
      >
        {{ asset.name }}
      </button>

      <div>
        <AssetTypeBadge :type="asset.type" />
      </div>

      <div
        v-if="folderName"
        class="text-muted-foreground flex items-center gap-1.5 text-xs"
      >
        <LucideFolder class="size-3 shrink-0" aria-hidden="true" />
        <span class="truncate">{{ folderName }}</span>
      </div>

      <div v-if="asset.tags.length" class="flex items-center gap-1.5">
        <LucideTag
          class="text-muted-foreground size-3 shrink-0"
          aria-hidden="true"
        />
        <div class="flex flex-wrap items-center gap-1.5">
          <Tag v-for="tag in asset.tags" :key="tag" :label="tag" size="sm" />
        </div>
      </div>

      <div
        class="text-muted-foreground mt-auto flex items-center justify-between text-xs"
      >
        <span>{{ size }}</span>
        <span>{{ formatDate(asset.updatedAt, { dateStyle: 'medium' }) }}</span>
      </div>
    </div>
  </Card>
</template>
