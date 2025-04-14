<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    createMode: boolean;
  }>(),
  {
    createMode: false,
  },
);

const active = defineModel<boolean>('active');
</script>
<template>
  <div class="container p-0">
    <slot name="header" />
    <slot />
  </div>
</template>
