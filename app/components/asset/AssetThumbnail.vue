<script setup lang="ts">
import type { AssetType } from '#shared/types';

/**
 * Asset preview — the image when a `thumbUrl` is present, otherwise a typed
 * icon block. `card` (3:2, grid), `banner` (2:1, full-width panel preview),
 * and `row` (small square, list) sizes.
 */
const props = withDefaults(
  defineProps<{
    type: AssetType;
    thumbUrl?: string | null;
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

// Fall back to the type icon when there's no thumb OR the image fails to load
// (phase-1 assets return `thumbUrl: null`; a stale/removed object 404s). Reset
// on change since the panel banner reuses one instance across assets.
const broken = ref(false);
watch(
  () => props.thumbUrl,
  () => {
    broken.value = false;
  },
);
const showImage = computed(() => !!props.thumbUrl && !broken.value);

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
      :src="thumbUrl ?? ''"
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
