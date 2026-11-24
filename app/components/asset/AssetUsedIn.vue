<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core';
import type {
  AssetLink,
  ProductLinkTargetType,
  AssetType,
  Order,
  ProductMatch,
} from '#shared/types';
import { isProductLink, productLinkKindKey } from '#shared/utils/asset';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * "Where it's used" section for the asset detail panel: what the asset is
 * linked to outside the library, from `GET /media/assets/{id}/links`, grouped
 * into **products** (linkable and removable here, via
 * [AssetLinkProductsDialog](/components/asset/AssetLinkProductsDialog)),
 * **orders** (`orderfile`, linkable via
 * [AssetLinkOrderDialog](/components/asset/AssetLinkOrderDialog) and removable)
 * and **other** targets (read-only; only shown when there are any). A private
 * asset takes only order links, so its "Link to product" is disabled.
 *
 * The API resolves nothing — a link carries only `targetType` + `targetId`, and
 * a link to a since-deleted product is still returned. Product targets (both
 * `productimage` and `productfile`) are therefore resolved client-side against
 * the products store (`useProductMatch`) and rendered as
 * [AssetLinkedProduct](/components/asset/AssetLinkedProduct) with an image/file
 * badge; anything that does not resolve, and any target type this release does
 * not name, falls back to a plain type + id row rather than being hidden.
 * Order targets are looked up in one `POST order/query` by `orderIds`; an order
 * that doesn't come back still renders as its bare number.
 */
const props = defineProps<{
  assetId: string;
  assetType: AssetType;
  /** In a private folder: only order links are allowed. */
  assetPrivate?: boolean;
}>();

const { t } = useI18n();
const { toast } = useToast();
const { assetApi, orderApi } = useGeinsRepository();
const { matchById } = useProductMatch();
const { batchQueryNoPagination } = useBatchQuery();
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

// The one cache entry holds the previous asset's rows while switching, so
// track whose rows they are: skeleton until this asset's land (or on a retry
// after an error), and a refresh of the same asset keeps them, dimmed.
const loadedFor = ref(pending.value ? null : props.assetId);
watch(pending, (isPending) => {
  if (!isPending) loadedFor.value = props.assetId;
});
const showSkeleton = computed(
  () => pending.value && (loadedFor.value !== props.assetId || !!error.value),
);
const refetching = computed(() => pending.value && !showSkeleton.value);
const { dimmed } = useRefetchDim(refetching);

interface ProductRow {
  key: string;
  link: AssetLink;
  kind: ProductLinkTargetType;
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
const orderLinks = computed(() =>
  (links.value ?? []).filter((link) => link.targetType === 'orderfile'),
);
const otherLinks = computed(() =>
  (links.value ?? []).filter(
    (link) =>
      !isProductLink(link.targetType) && link.targetType !== 'orderfile',
  ),
);
const linkedOrderIds = computed(() =>
  orderLinks.value.map((link) => link.targetId),
);

// Order details for the rows. A failed or partial read only drops the details:
// the row still shows the order number, so a link is never hidden.
const orders = ref(new Map<string, Order>());
watch(
  linkedOrderIds,
  async (ids) => {
    const missing = ids.filter((id) => !orders.value.has(id));
    if (!missing.length) return;
    try {
      const result = await orderApi.query(
        {
          include: [{ selections: [{ orderIds: missing }] }],
          ...batchQueryNoPagination.value,
        },
        undefined,
        { suppressErrorToast: true },
      );
      const next = new Map(orders.value);
      for (const order of Array.isArray(result?.items) ? result.items : [])
        next.set(order._id, order);
      orders.value = next;
    } catch (err) {
      geinsLogError('resolve orders', getErrorMessage(err));
    }
  },
  { immediate: true },
);

// Resolved product ids per kind, so the dialog shows them as already linked.
const linkedProductIds = computed<Record<ProductLinkTargetType, string[]>>(
  () => {
    const byKind: Record<ProductLinkTargetType, string[]> = {
      productimage: [],
      productfile: [],
    };
    for (const row of productRows.value)
      if (row.product) byKind[row.kind].push(row.product._id);
    return byKind;
  },
);

const linkOpen = ref(false);
const linkOrderOpen = ref(false);

// What a remove confirms: the link, and how the dialog names its target.
interface RemovableLink {
  link: AssetLink;
  target: string;
}

// One remove button for every removable row (product or order).
const [DefineRemoveButton, ReuseRemoveButton] = createReusableTemplate<{
  row: RemovableLink;
}>();

const pendingRemove = ref<RemovableLink | null>(null);
const removeOpen = ref(false);
const removing = ref(false);

function requestRemove(row: RemovableLink) {
  pendingRemove.value = row;
  removeOpen.value = true;
}

const productRemovable = (row: ProductRow): RemovableLink => ({
  link: row.link,
  target: row.product?.name ?? row.link.targetId,
});
const orderRemovable = (link: AssetLink): RemovableLink => ({
  link,
  target: link.targetId,
});

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

const removeDescription = computed(() => {
  const row = pendingRemove.value;
  return row?.link.targetType === 'orderfile'
    ? t('asset_library.remove_order_link_description', { number: row.target })
    : t('asset_library.remove_link_description', { target: row?.target });
});
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

    <div v-if="showSkeleton" class="mt-4 space-y-2">
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
      <div
        class="mt-4 space-y-6 transition-opacity"
        :class="dimmed && 'pointer-events-none opacity-60'"
        :aria-busy="refetching || undefined"
      >
        <div data-test="used-in-products">
          <div class="flex items-center justify-between gap-4">
            <h4 class="text-sm font-semibold">{{ $t('product', 2) }}</h4>
            <!-- A disabled button gets no pointer events, so the span carries
                 the tooltip. -->
            <Tooltip :disabled="!assetPrivate">
              <TooltipTrigger as-child>
                <span :tabindex="assetPrivate ? 0 : undefined">
                  <ButtonIcon
                    icon="Link2"
                    size="sm"
                    variant="secondary"
                    :disabled="assetPrivate"
                    data-test="used-in-link-product"
                    @click="linkOpen = true"
                  >
                    {{ $t('asset_library.link_to_product') }}
                  </ButtonIcon>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {{ $t('asset_library.private_product_link_blocked') }}
              </TooltipContent>
            </Tooltip>
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
                <ReuseRemoveButton :row="productRemovable(row)" />
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
                <ReuseRemoveButton :row="productRemovable(row)" />
              </div>
            </li>
          </ul>
        </div>

        <div data-test="used-in-orders">
          <div class="flex items-center justify-between gap-4">
            <h4 class="text-sm font-semibold">{{ $t('order', 2) }}</h4>
            <ButtonIcon
              icon="Link2"
              size="sm"
              variant="secondary"
              data-test="used-in-link-order"
              @click="linkOrderOpen = true"
            >
              {{ $t('asset_library.link_to_order') }}
            </ButtonIcon>
          </div>

          <p
            v-if="!orderLinks.length"
            class="text-muted-foreground mt-3 text-sm"
          >
            {{ $t('no_entity', { entityKey: 'order' }, 2) }}
          </p>
          <ul v-else class="mt-3 space-y-2">
            <li v-for="link in orderLinks" :key="`orderfile:${link.targetId}`">
              <OrderRow
                :order-id="link.targetId"
                :order="orders.get(link.targetId) ?? null"
              >
                <ReuseRemoveButton :row="orderRemovable(link)" />
              </OrderRow>
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
    <AssetLinkOrderDialog
      v-model:open="linkOrderOpen"
      :asset-id="assetId"
      :linked-order-ids="linkedOrderIds"
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
