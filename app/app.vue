<script setup lang="ts">
import { Analytics } from '@vercel/analytics/nuxt';
import { ConfigProvider } from 'reka-ui';

const useIdFunction = () => useId();

const loadingBarColor =
  'repeating-linear-gradient(90deg, #ffadad 0%, #ffd6a5 12.5%, #fdffb6 25%, #caffbf 37.5%, #9bf6ff 50%, #a0c4ff 62.5%, #bdb2ff 75%, #ffc6ff 87.5%, #ffadad 100%)';

useHead({
  title: 'Geins Studio',
});
</script>

<template>
  <Analytics />
  <ConfigProvider :use-id="useIdFunction">
    <NuxtLoadingIndicator :color="loadingBarColor" :height="6" />
    <NuxtLayout>
      <NuxtPage />
      <Toaster />
    </NuxtLayout>
  </ConfigProvider>
</template>
