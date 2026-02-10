<script setup lang="ts">
const _props = defineProps<{
  isTrue: boolean;
}>();
</script>
<template>
  <div>
    <span class="flex items-center gap-1.5">
      <LucideCheck v-if="isTrue" class="text-positive size-3.5" />
      <LucideX v-else class="text-negative size-3.5" />
      {{ isTrue ? $t('yes') : $t('no') }}
    </span>
  </div>
</template>
