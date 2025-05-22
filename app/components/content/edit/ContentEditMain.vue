<script setup lang="ts">
const slots = useSlots();
const hasSidebar = computed(() => !!slots.sidebar);
</script>
<template>
  <div
    :class="
      cn(`grid gap-4`, `${hasSidebar ? 'grid-cols-main' : 'grid-cols-1'}`)
    "
  >
    <div class="flex flex-col gap-4">
      <slot />
    </div>
    <div v-if="hasSidebar" class="flex flex-col gap-4">
      <slot name="sidebar" />
    </div>
  </div>
</template>
