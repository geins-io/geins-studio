<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    articleNumber?: string;
    imageUrl?: string;
  }>(),
  {
    articleNumber: '',
    imageUrl: '',
  },
);
</script>
<template>
  <div class="flex items-center gap-3 py-1">
    <ProductThumbnail :src="imageUrl" :alt="name" />
    <div class="min-w-0">
      <p class="truncate text-sm leading-tight font-medium">{{ name }}</p>
      <p
        v-if="articleNumber"
        class="text-muted-foreground mt-0.5 truncate text-xs leading-tight"
      >
        {{ articleNumber }}
      </p>
    </div>
  </div>
</template>
