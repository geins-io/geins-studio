<script setup lang="ts">
import type { AssetLink, ProductMatch } from '#shared/types';

/**
 * Read-only "Where it's used" section for the asset detail panel: what the asset is
 * linked to outside the library, from `GET /media/assets/{id}/links`.
 *
 * The API resolves nothing — a link carries only `targetType` + `targetId`, and
 * a link to a since-deleted product is still returned. Product targets are
 * therefore resolved client-side against the products store (`useProductMatch`)
 * and rendered as [AssetLinkedProduct](/components/asset/AssetLinkedProduct);
 * anything that does not resolve, and any target type this release does not
 * name, falls back to a plain type + id row rather than being hidden.
 */
const props = defineProps<{ assetId: string }>();

const { assetApi } = useGeinsRepository();
const { matchById } = useProductMatch();

// Stable key, watched on the asset: only one detail panel is open at a time, so
// a single cache entry is enough (same shape as the panel's `asset-tags` read).
const {
  data: links,
  pending,
  error,
  refresh,
} = useAsyncData<AssetLink[]>(
  'asset-links',
  () => assetApi.links(props.assetId),
  { default: () => [], watch: [() => props.assetId] },
);

interface UsedInRow {
  key: string;
  link: AssetLink;
  product: ProductMatch | null;
}

const rows = computed<UsedInRow[]>(() =>
  (links.value ?? []).map((link) => ({
    key: `${link.targetType}:${link.targetId}`,
    link,
    product: link.targetType === 'product' ? matchById(link.targetId) : null,
  })),
);
</script>

<template>
  <section>
    <ContentCardHeader
      size="md"
      heading-level="h3"
      :title="$t('asset_library.used_in')"
    />

    <div v-if="pending" class="mt-4 space-y-2">
      <Skeleton v-for="i in 2" :key="i" class="h-11 w-full rounded-lg" />
    </div>

    <Card v-else-if="error" class="mt-4">
      <CardContent class="p-0">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="destructive">
              <LucideTriangleAlert />
            </EmptyMedia>
            <EmptyTitle>{{ $t('asset_library.used_in_error') }}</EmptyTitle>
            <EmptyDescription>{{ $t('error_try_again') }}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <ButtonIcon icon="retry" variant="secondary" @click="refresh()">
              {{ $t('retry') }}
            </ButtonIcon>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>

    <p v-else-if="!rows.length" class="text-muted-foreground mt-4 text-sm">
      {{ $t('asset_library.used_in_empty') }}
    </p>

    <ul v-else class="mt-4 space-y-2">
      <li v-for="row in rows" :key="row.key">
        <AssetLinkedProduct v-if="row.product" :product="row.product" />
        <div
          v-else
          class="text-muted-foreground flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm"
        >
          <LucideLink2 class="size-4 shrink-0" aria-hidden="true" />
          <p class="min-w-0 flex-1 truncate">
            <span class="text-foreground font-semibold">
              {{ row.link.targetType }}
            </span>
            {{ ' ' }}· {{ row.link.targetId }}
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>
