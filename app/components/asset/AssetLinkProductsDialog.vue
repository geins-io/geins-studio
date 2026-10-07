<script setup lang="ts">
import type { AssetLinkTargetType, AssetType } from '#shared/types';
import { productLinkKindKey, productLinkTargetType } from '#shared/utils/asset';
import { chunkIds } from '#shared/utils/bulk';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * Links one asset to one or more products: a **Link as** choice (Image or File)
 * over a [ProductMultiSelect](/components/product/ProductMultiSelect). Opened
 * from "Where it's used"; emits `linked` after a successful write so the
 * caller can refetch its links.
 */
const props = defineProps<{
  assetId: string;
  assetType: AssetType;
  /** Product ids the asset is already linked to, per link kind. */
  linkedProductIds: Record<AssetLinkTargetType, string[]>;
}>();
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ linked: [] }>();

const { t } = useI18n();
const { toast } = useToast();
const { assetApi } = useGeinsRepository();
const { geinsLogError } = useGeinsLog('components/AssetLinkProductsDialog.vue');
const productsStore = useProductsStore();
const { products, initialized } = storeToRefs(productsStore);
// The store loads lazily; init() is idempotent.
productsStore.init();

// `productimage` on anything but image/svg is a 422, so only those get the
// choice; everything else links as a file.
const canLinkAsImage = computed(
  () => productLinkTargetType(props.assetType) === 'productimage',
);
const kind = ref<AssetLinkTargetType>('productimage');
const selected = ref<string[]>([]);
const linking = ref(false);

watch(
  open,
  (isOpen) => {
    if (!isOpen) return;
    kind.value = productLinkTargetType(props.assetType);
    selected.value = [];
  },
  { immediate: true },
);

// Switching kind can turn a pick into an existing link; drop it so the count
// on the button stays honest.
const locked = computed(() => props.linkedProductIds[kind.value] ?? []);
watch(locked, (ids) => {
  const existing = new Set(ids);
  selected.value = selected.value.filter((id) => !existing.has(id));
});

async function link() {
  if (!selected.value.length || linking.value) return;
  linking.value = true;
  try {
    // A bulk-link call takes at most 100 links.
    for (const productIds of chunkIds(selected.value)) {
      await assetApi.bulkLink(
        [props.assetId],
        productIds.map((targetId) => ({ targetType: kind.value, targetId })),
      );
    }
    toast({
      title: t('entity_added', { entityKey: 'link' }, selected.value.length),
    });
    open.value = false;
    emit('linked');
  } catch (err) {
    // The global API error toast already told the user; a partial run is
    // safe to repeat (linking only adds). The refetch locks what did land,
    // and the `locked` watcher prunes those from the selection.
    geinsLogError('link', getErrorMessage(err));
    emit('linked');
  } finally {
    linking.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ $t('asset_library.link_to_product') }}</DialogTitle>
        <DialogDescription>
          {{ $t('asset_library.link_to_product_description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4">
        <div
          v-if="canLinkAsImage"
          class="flex items-center justify-between gap-3"
        >
          <p class="text-sm font-medium">{{ $t('asset_library.link_as') }}</p>
          <ButtonGroup>
            <Button
              v-for="option in ['productimage', 'productfile'] as const"
              :key="option"
              variant="outline"
              size="sm"
              :class="segmentedButtonClass(kind === option)"
              :aria-pressed="kind === option"
              @click="kind = option"
            >
              {{ $t(productLinkKindKey(option)) }}
            </Button>
          </ButtonGroup>
        </div>

        <ProductMultiSelect
          v-model="selected"
          :products="products"
          :loading="!initialized"
          :locked-ids="locked"
          :locked-label="$t('asset_library.picker_linked')"
        />
      </div>

      <DialogFooter class="sm:justify-between">
        <Button variant="outline" :disabled="linking" @click="open = false">
          {{ $t('cancel') }}
        </Button>
        <ButtonIcon
          icon="Link2"
          :loading="linking"
          :disabled="!selected.length"
          data-test="link-products-confirm"
          @click="link"
        >
          {{
            $t(
              'asset_library.link_to_count_products',
              { count: selected.length },
              selected.length,
            )
          }}
        </ButtonIcon>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
