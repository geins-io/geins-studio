<script setup lang="ts">
import type { AssetType } from '#shared/types';

/** Colored pill for an asset's type — thin wrapper over `Badge`. */
const props = withDefaults(
  defineProps<{
    type: AssetType;
    size?: 'default' | 'sm';
  }>(),
  { size: 'sm' },
);

const { meta, label } = useAssetType();
const info = computed(() => meta(props.type));
</script>

<template>
  <Badge :variant="info.variant" :size="size">{{ label(type) }}</Badge>
</template>
