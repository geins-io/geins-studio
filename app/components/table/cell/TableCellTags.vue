<script setup lang="ts">
const _props = defineProps<{
  tags: string[];
}>();
</script>
<template>
  <div class="flex items-center gap-1">
    <span
      v-for="(tag, index) in tags"
      :key="index"
      class="bg-background rounded-lg border px-1.5 py-1 text-xs leading-4"
    >
      {{ tag }}
    </span>
  </div>
</template>
