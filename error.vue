<script setup lang="ts">
import type { NuxtError } from '#app';

const _props = defineProps({
  error: Object as () => NuxtError,
});

const handleError = () => clearError({ redirect: '/' });
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <h1 class="text-xl font-bold mb-5">Error {{ error?.statusCode }}</h1>
    <Button @click="handleError">Clear errors</Button>
  </div>
</template>
