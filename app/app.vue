<script setup lang="ts">
import { ConfigProvider } from 'radix-vue';

const useIdFunction = () => useId();

const loadingBarColor =
  'repeating-linear-gradient(90deg, #ffadad 0%, #ffd6a5 12.5%, #fdffb6 25%, #caffbf 37.5%, #9bf6ff 50%, #a0c4ff 62.5%, #bdb2ff 75%, #ffc6ff 87.5%, #ffadad 100%)';
</script>

<template>
  <ConfigProvider :use-id="useIdFunction">
    <NuxtLoadingIndicator :color="loadingBarColor" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster />
  </ConfigProvider>
</template>
