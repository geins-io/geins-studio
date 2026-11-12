<script setup lang="ts">
import type { QuotationOrderDetails } from '#shared/types';
import { calendarDayToLocalIso } from '#shared/utils/calendar-day';

const props = defineProps<{
  orderDetails?: QuotationOrderDetails | null;
}>();

const { formatDate } = useDate();

const deliveryDate = computed(() => {
  const value = props.orderDetails?.desiredDeliveryDate;
  return value ? formatDate(calendarDayToLocalIso(value) ?? value) : '-';
});
</script>
<template>
  <ContentEditCard
    :create-mode="false"
    :title="$t('orders.order_details')"
    :description="$t('orders.order_details_description')"
  >
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-muted-foreground mb-1 text-xs font-medium">
            {{ $t('orders.goods_label') }}
          </p>
          <p class="text-sm">
            {{ orderDetails?.goodsLabel || '-' }}
          </p>
        </div>
        <div>
          <p class="text-muted-foreground mb-1 text-xs font-medium">
            {{ $t('orders.customer_order_number') }}
          </p>
          <p class="text-sm">
            {{ orderDetails?.customerOrderNumber || '-' }}
          </p>
        </div>
      </div>
      <div class="border-t pt-4">
        <p class="text-muted-foreground mb-1 text-xs font-medium">
          {{ $t('orders.desired_delivery_date') }}
        </p>
        <p class="text-sm">{{ deliveryDate }}</p>
      </div>
    </div>
  </ContentEditCard>
</template>
