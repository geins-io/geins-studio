<script setup lang="ts">
const _props = defineProps<{
  isTrue: boolean;
}>();
</script>
<template>
  <div>
    <span class="flex items-center gap-1.5">
      <LucideCheck v-if="isTrue" class="size-3.5 text-positive" />
      <LucideX v-else class="size-3.5 text-negative" />
      {{ isTrue ? $t('yes') : $t('no') }}
    </span>
  </div>
</template>
