<script setup lang="ts">
import type { Order } from '#shared/types';
import { orderLinkTarget } from '#shared/utils/asset';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * Links one asset to one or more orders. The merchant types the order numbers
 * and [OrderLookup](/components/order/OrderLookup) finds them, so only orders
 * the API returned can be linked. Any asset can be, private ones included.
 * Opened from "Where it's used"; emits `linked` so the caller can refetch.
 */
const props = defineProps<{
  assetId: string;
  /** Order ids the asset is already linked to. */
  linkedOrderIds: string[];
}>();
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ linked: [] }>();

const { t } = useI18n();
const { toast } = useToast();
const { assetApi } = useGeinsRepository();
const { geinsLogError } = useGeinsLog('components/AssetLinkOrderDialog.vue');

const orders = ref<Order[]>([]);
const linking = ref(false);

watch(open, (isOpen) => {
  if (isOpen) orders.value = [];
});

// Orders already linked stay in the list with a badge but aren't linked again.
const toLink = computed(() => {
  const linked = new Set(props.linkedOrderIds);
  return orders.value.map((order) => order._id).filter((id) => !linked.has(id));
});

async function link() {
  if (!toLink.value.length || linking.value) return;
  linking.value = true;
  try {
    // A bulk-link call takes at most 100 links.
    for (const orderIds of chunkIds(toLink.value)) {
      await assetApi.bulkLink([props.assetId], orderIds.map(orderLinkTarget));
    }
    toast({
      title: t('entity_added', { entityKey: 'link' }, toLink.value.length),
    });
    open.value = false;
    emit('linked');
  } catch (err) {
    // The global API error toast already told the user; a partial run is
    // safe to repeat (linking only adds), and the refetch marks what landed.
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
        <DialogTitle>{{ $t('asset_library.link_to_order') }}</DialogTitle>
        <DialogDescription>
          {{ $t('asset_library.link_to_order_description') }}
        </DialogDescription>
      </DialogHeader>

      <OrderLookup v-model="orders" :linked-ids="linkedOrderIds" />

      <DialogFooter class="sm:justify-between">
        <Button variant="outline" :disabled="linking" @click="open = false">
          {{ $t('cancel') }}
        </Button>
        <ButtonIcon
          icon="Link2"
          :loading="linking"
          :disabled="!toLink.length"
          data-test="link-order-confirm"
          @click="link"
        >
          {{
            $t(
              'asset_library.link_to_count_orders',
              { count: toLink.length },
              toLink.length,
            )
          }}
        </ButtonIcon>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
