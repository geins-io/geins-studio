<script setup lang="ts">
const _props = defineProps<{
  changes?: boolean;
}>();
</script>
<template>
  <div
    v-if="changes"
    class="text-negative flex items-center justify-start gap-1.5 pb-2 text-xs"
  >
    <LucideInfo class="size-3.5" />
    <span class="whitespace-nowrap">{{ $t('unsaved_changes') }}</span>
  </div>
</template>
