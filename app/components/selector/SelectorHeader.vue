<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: 'Product selection',
    description: 'Quick add or browse to make a specific selection',
  },
);
</script>
<template>
  <div>
    <h2 class="mb-1.5 text-xl font-semibold">{{ title }}</h2>
    <p class="text-sm text-muted-foreground">{{ description }}</p>
  </div>
</template>
