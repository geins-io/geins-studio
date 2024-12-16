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
    <h2 class="text-xl font-semibold">{{ title }}</h2>
    <p>{{ description }}</p>
  </div>
</template>
