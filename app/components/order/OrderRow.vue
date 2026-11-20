<script setup lang="ts">
import type { Order } from '#shared/types';

/**
 * One order as a bordered row: "Order {number}", then date · email · total
 * and its status. When the order couldn't be looked up (`order` is `null`)
 * the row shows the bare number, so a link to it is never hidden. A trailing
 * slot takes the row's actions.
 */
const props = defineProps<{
  /** The order's numeric id — what an `orderfile` link stores. */
  orderId: string;
  order?: Order | null;
}>();

const { formatDate } = useDate();
const { formatCurrency } = usePrice();

const meta = computed(() => {
  const order = props.order;
  if (!order) return '';
  return [
    formatDate(order.dateCreated, { dateStyle: 'medium' }),
    order.email,
    `${formatCurrency(order.sumIncVat)} ${order.currency}`,
  ]
    .filter(Boolean)
    .join(' · ');
});
</script>

<template>
  <div class="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm">
    <LucideReceipt
      class="text-muted-foreground size-4 shrink-0"
      aria-hidden="true"
    />
    <div class="min-w-0 flex-1">
      <p class="truncate font-semibold">
        {{ $t('orders.order_title', { number: orderId }) }}
      </p>
      <p v-if="meta" class="text-muted-foreground truncate text-xs">
        {{ meta }}
      </p>
    </div>
    <StatusBadge v-if="order?.status" :status="order.status" />
    <slot />
  </div>
</template>
