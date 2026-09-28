<script setup lang="ts">
import type { AssetLinkTargetType, ProductMatch } from '#shared/types';
import { productLinkKindKey } from '#shared/utils/asset';

/**
 * Compact, read-only card shown at the top of the manage step's detail pane when
 * the selected file links to a product (see {@link useProductMatch}), and per
 * product row in [AssetUsedIn](/components/asset/AssetUsedIn). A single row:
 * product thumbnail + name, followed inline by the article number and id
 * (dot-separated, muted) — a discreet confirmation of the match. With `kind`,
 * a trailing badge says whether the asset is the product's image or a file.
 */
const props = defineProps<{
  product: ProductMatch;
  kind?: AssetLinkTargetType;
}>();

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
    <Badge v-if="kind" variant="secondary" size="sm">
      {{ $t(productLinkKindKey(kind)) }}
    </Badge>
  </div>
</template>
