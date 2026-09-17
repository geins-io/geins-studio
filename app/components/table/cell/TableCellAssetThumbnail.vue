<script setup lang="ts">
import type { AssetType } from '#shared/types';
import { assetPreviewUrl } from '#shared/utils/asset';
import { cn } from '@/utils/index';

/**
 * Table cell rendering an asset thumbnail — the image when present, otherwise a
 * typed icon block tinted with the asset-type color. Matches the built-in
 * `image` column type's size + style (size-7, centered, 40px column). Pass
 * `className` from the column's `getBasicCellStyle(table)`.
 */
const props = defineProps<{
  type: AssetType;
  thumbUrl?: string | null;
  /** Full-size file, used as the preview when there is no thumbnail. */
  url?: string | null;
  alt?: string;
  className?: string;
}>();

const { meta, label } = useAssetType();
const { resolveIcon } = useLucideIcon();

const info = computed(() => meta(props.type));
const icon = computed(() => resolveIcon(info.value.icon));

const src = computed(() =>
  assetPreviewUrl(props.type, props.thumbUrl, props.url),
);
const broken = ref(false);
watch(src, () => {
  broken.value = false;
});
const showImage = computed(() => !!src.value && !broken.value);
</script>

<template>
  <div :class="cn(className, 'px-1')">
    <img
      v-if="showImage"
      :src="src ?? ''"
      :alt="alt ?? label(type)"
      class="mx-auto size-7 max-w-10 rounded-md object-cover p-0.5"
      @error="broken = true"
    />
    <div
      v-else
      :class="
        cn(
          info.tint,
          'mx-auto flex size-7 items-center justify-center rounded-md',
        )
      "
    >
      <component :is="icon" class="size-4" />
    </div>
  </div>
</template>
