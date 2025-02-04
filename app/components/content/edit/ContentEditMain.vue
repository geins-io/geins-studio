<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    hasSidebar?: boolean;
  }>(),
  {
    hasSidebar: true,
  },
);
</script>
<template>
  <div
    :class="
      cn(`grid gap-4`, `${props.hasSidebar ? 'grid-cols-main' : 'grid-cols-1'}`)
    "
  >
    <div class="flex flex-col gap-4">
      <slot />
    </div>
    <div class="flex flex-col gap-4">
      <slot name="sidebar" />
    </div>
  </div>
</template>
