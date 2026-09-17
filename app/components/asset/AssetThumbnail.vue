<script setup lang="ts">
import type { AssetType } from '#shared/types';
import { assetPreviewUrl } from '#shared/utils/asset';

/**
 * Asset preview — the thumbnail when the backend serves one, the full-size file
 * for image/SVG assets when it doesn't, otherwise a typed icon block. `card`
 * (3:2, grid), `banner` (2:1, full-width panel preview), and `row` (small
 * square, list) sizes.
 */
const props = withDefaults(
  defineProps<{
    type: AssetType;
    thumbUrl?: string | null;
    /** Full-size file, used as the preview when there is no thumbnail. */
    url?: string | null;
    alt?: string;
    size?: 'card' | 'banner' | 'row';
  }>(),
  { size: 'card' },
);

const { meta, label } = useAssetType();
const { resolveIcon } = useLucideIcon();

const info = computed(() => meta(props.type));
const icon = computed(() => resolveIcon(info.value.icon));
const isRow = computed(() => props.size === 'row');

// Fall back to the type icon when there's nothing previewable OR the image
// fails to load (a stale/removed object 404s). Reset on change since the panel
// banner reuses one instance across assets.
const src = computed(() =>
  assetPreviewUrl(props.type, props.thumbUrl, props.url),
);
const broken = ref(false);
watch(src, () => {
  broken.value = false;
});
const showImage = computed(() => !!src.value && !broken.value);

const wrapperClass = computed(() => {
  switch (props.size) {
    case 'banner':
      return 'aspect-[2/1] w-full';
    case 'row':
      return 'size-10 shrink-0';
    default:
      return 'aspect-[3/2] w-full';
  }
});
</script>

<template>
  <div :class="[wrapperClass, 'overflow-hidden rounded-md']">
    <img
      v-if="showImage"
      :src="src ?? ''"
      :alt="alt ?? ''"
      class="bg-muted h-full w-full object-cover"
      @error="broken = true"
    />
    <div
      v-else
      :class="[
        info.tint,
        'flex h-full w-full flex-col items-center justify-center gap-1',
      ]"
    >
      <component :is="icon" :class="isRow ? 'size-5' : 'size-9'" />
      <span v-if="!isRow" class="text-xs font-medium opacity-90">
        {{ label(type) }}
      </span>
    </div>
  </div>
</template>
