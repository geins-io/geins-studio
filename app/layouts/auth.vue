<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue';

import Logo from '@/assets/logos/geins.svg';
</script>

<template>
  <div
    class="flex h-screen w-full flex-col-reverse justify-end lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[600px]"
  >
    <div class="bg-card flex items-center justify-center py-12">
      <div class="grid w-full gap-6 px-10 lg:w-[350px] lg:p-0">
        <slot />
      </div>
    </div>
    <div class="bg-background flex items-center justify-center">
      <Logo class="size-32 lg:size-1/3" :font-controlled="false" />
    </div>
  </div>
  <SpeedInsights />
</template>
