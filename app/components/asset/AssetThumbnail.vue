<script setup lang="ts">
import type { AssetType } from '#shared/types';

/**
 * Asset preview — the image when a `thumbUrl` is present, otherwise a typed
 * icon block. `card` (3:2, grid) and `row` (small square, list) sizes.
 */
const props = withDefaults(
  defineProps<{
    type: AssetType;
    thumbUrl?: string | null;
    alt?: string;
    size?: 'card' | 'row';
  }>(),
  { size: 'card' },
);

const { meta, label } = useAssetType();
const { resolveIcon } = useLucideIcon();

const info = computed(() => meta(props.type));
const icon = computed(() => resolveIcon(info.value.icon));

const wrapperClass = computed(() =>
  props.size === 'card' ? 'aspect-[3/2] w-full' : 'size-10 shrink-0',
);
</script>

<template>
  <div :class="[wrapperClass, 'overflow-hidden rounded-md']">
    <img
      v-if="thumbUrl"
      :src="thumbUrl"
      :alt="alt ?? ''"
      class="bg-muted h-full w-full object-cover"
    />
    <div
      v-else
      :class="[
        info.tint,
        'flex h-full w-full flex-col items-center justify-center gap-1',
      ]"
    >
      <component :is="icon" :class="size === 'card' ? 'size-9' : 'size-5'" />
      <span v-if="size === 'card'" class="text-xs font-medium opacity-90">
        {{ label(type) }}
      </span>
    </div>
  </div>
</template>
