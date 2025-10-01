<script setup lang="ts">
import { ToastProvider, type ToastProviderProps } from 'reka-ui';

const props = defineProps<ToastProviderProps>();
</script>

<template>
  <ToastProvider v-bind="props" class="left-0">
    <slot />
  </ToastProvider>
</template>
