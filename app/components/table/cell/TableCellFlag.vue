<script setup lang="ts">
defineProps<{
  code: string;
  label: string;
}>();
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <div
      v-if="code"
      :class="[flagClass(code), 'size-4.5 rounded-full border bg-contain bg-center bg-no-repeat']"
    />
    <span class="text-sm">{{ label }}</span>
  </span>
</template>
