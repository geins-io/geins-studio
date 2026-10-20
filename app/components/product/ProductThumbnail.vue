<script setup lang="ts">
import { cn } from '@/utils/index';
import type { HTMLAttributes } from 'vue';

/**
 * A product image with a **built-in placeholder fallback**. Wraps the Geins
 * image-URL builder (`getProductThumbnail`) and the shared `handleImageError`
 * handler so callers never re-implement the `<img @error>` dance: pass the
 * product's image slug and get a square thumbnail that degrades to the
 * placeholder when the slug is missing or the image fails to load.
 */
const props = withDefaults(
  defineProps<{
    /** Product image slug/path (the product's `thumbnail` / `imageUrl`). */
    src?: string;
    alt?: string;
    /** Extra classes; overrides the default `size-10` etc. via tailwind-merge. */
    class?: HTMLAttributes['class'];
  }>(),
  { src: '', alt: '' },
);

const { getProductThumbnail, handleImageError } = useGeinsImage();

// The product image comes in two shapes across the app: a bare media slug
// (built into a commerce.services URL) or an already-resolved src — an absolute
// URL or a root-relative path like the placeholder. Pass resolved srcs through
// untouched; build only bare slugs. Empty / load failure fall back to the
// placeholder (via getProductThumbnail / handleImageError).
const imgSrc = computed(() => {
  const src = props.src?.trim();
  if (!src) return getProductThumbnail();
  return /^(https?:\/\/|\/)/i.test(src) ? src : getProductThumbnail(src);
});
</script>

<template>
  <img
    :src="imgSrc"
    :alt="alt"
    :class="cn('size-10 shrink-0 rounded-md border object-cover', props.class)"
    @error="handleImageError"
  />
</template>
