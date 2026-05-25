<script setup lang="ts">
const { brandName} = useBrand();
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
</template>
