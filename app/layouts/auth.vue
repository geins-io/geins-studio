<script setup lang="ts">
import Logo from '@/assets/logos/geins.svg';
</script>

<template>
  <div
    class="h-screen w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[600px]"
  >
    <div class="flex items-center justify-center bg-card py-12">
      <div class="grid w-[350px] gap-6">
        <slot />
      </div>
    </div>
    <div class="flex items-center justify-center bg-background">
      <Logo class="size-1/3" :font-controlled="false" />
    </div>
  </div>
</template>
