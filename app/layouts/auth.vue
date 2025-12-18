<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue';

import LogoLetter from '@/assets/logos/geins-g.svg';
</script>

<template>
  <div
    class="bg-muted dark:bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
  >
    <div class="flex w-full max-w-sm flex-col">
      <div class="mb-6 flex items-center gap-2 self-center font-medium">
        <div
          class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
        >
          <LogoLetter class="size-4" :font-controlled="false" />
        </div>
        Geins Studio
      </div>
      <slot />
    </div>
  </div>
  <SpeedInsights />
</template>
