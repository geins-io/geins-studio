<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    showSidebar?: boolean;
  }>(),
  {
    showSidebar: true,
  },
);

const slots = useSlots();
const hasSidebar = computed(() => props.showSidebar && !!slots.sidebar);
</script>
<template>
  <div
    :class="
      cn(`grid gap-4`, `${hasSidebar ? 'grid-cols-main' : 'grid-cols-1'}`)
    "
  >
    <slot />
    <div v-if="hasSidebar" class="flex flex-col gap-4">
      <slot name="sidebar" />
    </div>
  </div>
</template>
