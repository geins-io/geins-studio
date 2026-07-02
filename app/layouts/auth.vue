<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/vue';

const { brandName } = useBrand();

const isVercel = useRuntimeConfig().public.isVercel;
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
          <BrandLogoSymbol class="size-4" :font-controlled="false" />
        </div>
        {{ brandName }}
      </div>
      <slot />
    </div>
  </div>
  <SpeedInsights v-if="isVercel" />
</template>
