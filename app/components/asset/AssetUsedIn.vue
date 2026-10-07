<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core';
import type {
  AssetLink,
  AssetLinkTargetType,
  AssetType,
  ProductMatch,
} from '#shared/types';
import { isProductLink, productLinkKindKey } from '#shared/utils/asset';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * "Where it's used" section for the asset detail panel: what the asset is
 * linked to outside the library, from `GET /media/assets/{id}/links`, grouped
 * into **products** (linkable and removable here, via
 * [AssetLinkProductsDialog](/components/asset/AssetLinkProductsDialog)) and
 * **other** targets (read-only; only shown when there are any).
 *
 * The API resolves nothing — a link carries only `targetType` + `targetId`, and
 * a link to a since-deleted product is still returned. Product targets (both
 * `productimage` and `productfile`) are therefore resolved client-side against
 * the products store (`useProductMatch`) and rendered as
 * [AssetLinkedProduct](/components/asset/AssetLinkedProduct) with an image/file
 * badge; anything that does not resolve, and any target type this release does
 * not name, falls back to a plain type + id row rather than being hidden.
 */
const props = defineProps<{ assetId: string; assetType: AssetType }>();

const { t } = useI18n();
const { toast } = useToast();
const { assetApi } = useGeinsRepository();
const { matchById } = useProductMatch();
const { geinsLogError } = useGeinsLog('components/AssetUsedIn.vue');

// Stable key, watched on the asset: only one detail panel is open at a time, so
// a single cache entry is enough (same shape as the panel's `asset-tags` read).
const {
  data: links,
  pending,
  error,
  refresh,
} = useAsyncData<AssetLink[]>(
  'asset-links',
  // A trashed asset's links answer 404 — that is "no usage", not a failure.
  () =>
    assetApi.links(props.assetId).catch((error) => {
      if (getErrorStatus(error) === 404) return [];
      throw error;
    }),
  { default: () => [], watch: [() => props.assetId] },
);

interface ProductRow {
  key: string;
  link: AssetLink;
  kind: AssetLinkTargetType;
  product: ProductMatch | null;
}

const productRows = computed<ProductRow[]>(() =>
  (links.value ?? []).flatMap((link) =>
    isProductLink(link.targetType)
      ? [
          {
            key: `${link.targetType}:${link.targetId}`,
            link,
            kind: link.targetType,
            product: matchById(link.targetId),
          },
        ]
      : [],
  ),
);
const otherLinks = computed(() =>
  (links.value ?? []).filter((link) => !isProductLink(link.targetType)),
);

// Resolved product ids per kind, so the dialog shows them as already linked.
const linkedProductIds = computed<Record<AssetLinkTargetType, string[]>>(() => {
  const byKind: Record<AssetLinkTargetType, string[]> = {
    productimage: [],
    productfile: [],
  };
  for (const row of productRows.value)
    if (row.product) byKind[row.kind].push(row.product._id);
  return byKind;
});

const linkOpen = ref(false);

// One remove button for both the resolved and the unresolved product row.
const [DefineRemoveButton, ReuseRemoveButton] = createReusableTemplate<{
  row: ProductRow;
}>();

const pendingRemove = ref<ProductRow | null>(null);
const removeOpen = ref(false);
const removing = ref(false);

function requestRemove(row: ProductRow) {
  pendingRemove.value = row;
  removeOpen.value = true;
}

async function confirmRemove() {
  const row = pendingRemove.value;
  if (!row) return;
  removing.value = true;
  try {
    await assetApi.removeLink(
      props.assetId,
      row.link.targetType,
      row.link.targetId,
    );
    toast({ title: t('entity_removed', { entityKey: 'link' }) });
    removeOpen.value = false;
  } catch (err) {
    // The global API error toast already told the user.
    geinsLogError('removeLink', getErrorMessage(err));
  } finally {
    removing.value = false;
    await refresh();
  }
}

const removeDescription = computed(() =>
  t('asset_library.remove_link_description', {
    target:
      pendingRemove.value?.product?.name ?? pendingRemove.value?.link.targetId,
  }),
);
</script>

<template>
  <section>
    <DefineRemoveButton v-slot="{ row }">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="size-7 shrink-0"
            :aria-label="$t('remove_entity', { entityKey: 'link' })"
            data-test="used-in-remove"
            @click="requestRemove(row)"
          >
            <LucideX class="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {{ $t('remove_entity', { entityKey: 'link' }) }}
        </TooltipContent>
      </Tooltip>
    </DefineRemoveButton>

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

    <TooltipProvider v-else :delay-duration="100">
      <div class="mt-4 space-y-6">
        <div data-test="used-in-products">
          <div class="flex items-center justify-between gap-4">
            <h4 class="text-sm font-semibold">{{ $t('product', 2) }}</h4>
            <ButtonIcon
              icon="Link2"
              size="sm"
              variant="secondary"
              data-test="used-in-link-product"
              @click="linkOpen = true"
            >
              {{ $t('asset_library.link_to_product') }}
            </ButtonIcon>
          </div>

          <p
            v-if="!productRows.length"
            class="text-muted-foreground mt-3 text-sm"
          >
            {{ $t('no_entity', { entityKey: 'product' }, 2) }}
          </p>
          <ul v-else class="mt-3 space-y-2">
            <li v-for="row in productRows" :key="row.key">
              <AssetLinkedProduct
                v-if="row.product"
                :product="row.product"
                :kind="row.kind"
              >
                <ReuseRemoveButton :row="row" />
              </AssetLinkedProduct>
              <div
                v-else
                class="text-muted-foreground flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm"
              >
                <LucideLink2 class="size-4 shrink-0" aria-hidden="true" />
                <p class="min-w-0 flex-1 truncate">
                  <span class="text-foreground font-semibold">
                    {{ $t('product') }}
                  </span>
                  {{ ' ' }}· {{ row.link.targetId }}
                </p>
                <Badge variant="secondary" size="sm">
                  {{ $t(productLinkKindKey(row.kind)) }}
                </Badge>
                <ReuseRemoveButton :row="row" />
              </div>
            </li>
          </ul>
        </div>

        <!-- Targets beyond products (CMS, channel settings, …) aren't linkable
             from here; they're listed so usage is never under-reported. -->
        <div v-if="otherLinks.length" data-test="used-in-other">
          <h4 class="text-sm font-semibold">
            {{ $t('asset_library.used_in_other') }}
          </h4>
          <ul class="mt-3 space-y-2">
            <li
              v-for="link in otherLinks"
              :key="`${link.targetType}:${link.targetId}`"
              class="text-muted-foreground flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm"
            >
              <LucideLink2 class="size-4 shrink-0" aria-hidden="true" />
              <p class="min-w-0 flex-1 truncate">
                <span class="text-foreground font-semibold">
                  {{ link.targetType }}
                </span>
                {{ ' ' }}· {{ link.targetId }}
              </p>
            </li>
          </ul>
        </div>
      </div>
    </TooltipProvider>

    <AssetLinkProductsDialog
      v-model:open="linkOpen"
      :asset-id="assetId"
      :asset-type="assetType"
      :linked-product-ids="linkedProductIds"
      @linked="refresh()"
    />
    <DialogDelete
      v-model:open="removeOpen"
      entity-key="link"
      :loading="removing"
      :description="removeDescription"
      @confirm="confirmRemove"
    />
  </section>
</template>
