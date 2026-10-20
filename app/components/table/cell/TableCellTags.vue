<script setup lang="ts">
const _props = defineProps<{
  tags: string[];
}>();
</script>
<template>
  <div class="flex items-center gap-1.5">
    <Tag v-for="(tag, index) in tags" :key="index" :label="tag" size="sm" />
  </div>
</template>
