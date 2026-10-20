<script setup lang="ts">
import { mimeToAssetType } from '#shared/utils/asset';
import { formatFileSize } from '#shared/utils/file';

/**
 * One read-only row in the upload wizard's review step (step 3): type-tinted
 * icon, name, resolved metadata (folder / tags / channels), size and type badge.
 * Presentational only — the review step passes already-resolved values so the
 * same row renders identically across its flat, folder and product views.
 */
const props = defineProps<{
  name: string;
  file: File;
  folderName?: string;
  tags: string[];
  channelNames: string[];
}>();

const { meta } = useAssetType();
const { resolveIcon } = useLucideIcon();

const type = computed(() => mimeToAssetType(props.file.type));
const info = computed(() => meta(type.value));
</script>

<template>
  <div class="flex items-center gap-3 border-t px-5 py-3">
    <div
      :class="[
        info.tint,
        'flex size-8 shrink-0 items-center justify-center rounded-md',
      ]"
    >
      <component :is="resolveIcon(info.icon)" class="size-4" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium">{{ name }}</p>
      <div
        class="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"
      >
        <span class="inline-flex items-center gap-1">
          <LucideFolder class="size-3" />
          {{ folderName ?? $t('asset_library.no_folder') }}
        </span>
        <span v-if="tags.length" class="inline-flex items-center gap-1">
          <LucideTag class="size-3" />
          {{ tags.join(', ') }}
        </span>
        <span v-if="channelNames.length" class="inline-flex items-center gap-1">
          <LucideGlobe class="size-3" />
          {{ channelNames.join(', ') }}
        </span>
      </div>
    </div>
    <span class="text-muted-foreground shrink-0 text-xs">
      {{ formatFileSize(file.size) }}
    </span>
    <AssetTypeBadge :type="type" />
  </div>
</template>
