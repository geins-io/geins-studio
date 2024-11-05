<script setup lang="ts">
import type { NuxtError } from '#app';

const _props = defineProps({
  error: Object as () => NuxtError,
});

const handleError = () => clearError({ redirect: '/' });
// TODO: Remove message and callstack before launch
</script>

<template>
  <div class="flex h-screen flex-col items-center justify-center">
    <h1 class="mb-2 text-xl font-bold">Error {{ error?.statusCode }}</h1>
    <p v-if="error?.message" class="mb-5">{{ error?.message }}</p>
    <p v-else>No message</p>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="mb-5 text-xs" v-html="error?.stack" />
    <Button @click="handleError">Clear errors</Button>
  </div>
</template>
