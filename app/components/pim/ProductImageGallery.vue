<script setup lang="ts">
import type { Media } from '#shared/types';
import { LucideImage } from '#components';

// =====================================================================================
// PROPS
// =====================================================================================
interface Props {
  media?: Media[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  media: () => [],
  loading: false,
});

// =====================================================================================
// COMPOSABLES
// =====================================================================================
const { t } = useI18n();
const { getProductThumbnail } = useGeinsImage();

// =====================================================================================
// COMPUTED
// =====================================================================================
const hasImages = computed(() => props.media && props.media.length > 0);

const sortedImages = computed(() => {
  if (!props.media || props.media.length === 0) return [];
  // Sort by order property
  return [...props.media].sort((a, b) => a.order - b.order);
});

const getImageUrl = (image: Media, size: string = '400x400') => {
  return getProductThumbnail(image.filename);
};
</script>

<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" class="aspect-square w-full rounded-lg" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!hasImages"
      class="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed p-12 text-center"
    >
      <LucideImage class="size-12 text-muted-foreground" />
      <div class="space-y-1">
        <h3 class="text-sm font-medium">{{ $t('product_no_images') }}</h3>
      </div>
    </div>

    <!-- Image Grid -->
    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      <div
        v-for="(image, index) in sortedImages"
        :key="image._id || index"
        class="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
      >
        <img
          :src="getImageUrl(image)"
          :alt="`Product image ${index + 1}`"
          class="size-full object-cover transition-transform group-hover:scale-105"
        />
        <!-- Primary Badge -->
        <Badge
          v-if="index === 0"
          variant="secondary"
          class="absolute left-2 top-2 shadow-sm"
        >
          {{ $t('primary') }}
        </Badge>
      </div>
    </div>
  </div>
</template>
