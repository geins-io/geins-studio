<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue';

import Logo from '@/assets/logos/geins.svg';
</script>

<template>
  <div
    class="flex h-screen w-full flex-col-reverse justify-center max-lg:items-center max-sm:p-4 lg:grid lg:min-h-[600px] lg:grid-cols-2"
  >
    <div
      class="bg-card flex w-full items-center justify-center py-12 max-lg:max-w-[470px] max-lg:rounded-lg max-lg:border"
    >
      <div class="grid w-full gap-6 px-10 lg:w-[350px] lg:p-0">
        <slot />
      </div>
    </div>
    <div class="bg-background flex items-center justify-center">
      <Logo
        class="-mt-7 mb-7 w-28 sm:w-32 lg:m-0 lg:w-1/3"
        :font-controlled="false"
      />
    </div>
  </div>
  <SpeedInsights />
</template>
