<script setup lang="ts">
import { ConfigProvider } from 'radix-vue';

const useIdFunction = () => useId();

const { callAPI } = useAPI();

const { data, error } = await callAPI('/user/me');
console.log('🚀 ~ data:', data.value);
console.log('🚀 ~ error:', error.value);
</script>

<template>
  <ConfigProvider :use-id="useIdFunction">
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster />
  </ConfigProvider>
</template>
