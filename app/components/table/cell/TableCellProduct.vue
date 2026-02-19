<script setup lang="ts">
const props = withDefaults(
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

const { handleImageError } = useGeinsImage();
const imgSrc = computed(() => props.imageUrl || '/placeholder.svg');
</script>
<template>
  <div class="flex items-center gap-3 py-1">
    <img
      :src="imgSrc"
      :alt="name"
      class="size-10 shrink-0 rounded-md border object-cover"
      @error="handleImageError"
    />
    <div class="min-w-0">
      <p class="truncate text-sm leading-tight font-medium">{{ name }}</p>
      <p
        v-if="articleNumber"
        class="text-muted-foreground truncate text-xs leading-tight"
      >
        {{ articleNumber }}
      </p>
    </div>
  </div>
</template>
