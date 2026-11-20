<script setup lang="ts">
import type { Order } from '#shared/types';
import { orderLinkTarget } from '#shared/utils/asset';
import { useToast } from '@/components/ui/toast/use-toast';

/**
 * Links one asset to an order. The merchant types the order number and
 * [OrderLookup](/components/order/OrderLookup) finds it, so only an order the
 * API returned can be linked. Any asset can be, private ones included.
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

const order = ref<Order | null>(null);
const linking = ref(false);

watch(open, (isOpen) => {
  if (isOpen) order.value = null;
});

const canLink = computed(
  () => !!order.value && !props.linkedOrderIds.includes(order.value._id),
);

async function link() {
  if (!order.value || !canLink.value || linking.value) return;
  linking.value = true;
  try {
    await assetApi.bulkLink(
      [props.assetId],
      [orderLinkTarget(order.value._id)],
    );
    toast({ title: t('entity_added', { entityKey: 'link' }) });
    open.value = false;
    emit('linked');
  } catch (err) {
    // The global API error toast already told the user.
    geinsLogError('link', getErrorMessage(err));
  } finally {
    linking.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ $t('asset_library.link_to_order') }}</DialogTitle>
        <DialogDescription>
          {{ $t('asset_library.link_to_order_description') }}
        </DialogDescription>
      </DialogHeader>

      <OrderLookup v-model="order" :linked-ids="linkedOrderIds" />

      <DialogFooter class="sm:justify-between">
        <Button variant="outline" :disabled="linking" @click="open = false">
          {{ $t('cancel') }}
        </Button>
        <ButtonIcon
          icon="Link2"
          :loading="linking"
          :disabled="!canLink"
          data-test="link-order-confirm"
          @click="link"
        >
          {{ $t('asset_library.link_to_order') }}
        </ButtonIcon>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
