<script setup lang="ts">
import type { ProductMatch } from '#shared/types';

/**
 * Compact, read-only card shown at the top of the manage step's detail pane when
 * the selected image links to a product (see {@link useProductMatch}). A
 * "Linked product" heading over a single row: product thumbnail + name, followed
 * inline by the article number and id (dot-separated, muted) — a discreet
 * confirmation of the match.
 */
const props = defineProps<{ product: ProductMatch }>();

const refs = computed(() =>
  [props.product.articleNumber, props.product._id].filter(Boolean).join(' · '),
);
</script>

<template>
  <div class="flex items-center gap-2.5 rounded-lg border px-3 py-2">
    <LucideLink2
      class="text-muted-foreground size-4 shrink-0"
      role="img"
      :aria-label="$t('asset_library.linked_product')"
    />
    <ProductThumbnail
      :src="product.thumbnail"
      :alt="product.name"
      class="size-6"
    />
    <p class="min-w-0 flex-1 truncate text-sm">
      <span class="text-foreground font-semibold">{{ product.name }}</span>
      <span v-if="refs" class="text-muted-foreground">
        {{ ' ' }}· {{ refs }}
      </span>
    </p>
  </div>
</template>
