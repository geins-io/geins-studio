<script setup lang="ts">
import type { QuotationRequest } from '#shared/types';

defineProps<{
  request: QuotationRequest;
}>();

const { formatDate } = useDate();
</script>
<template>
  <ContentEditCard :create-mode="false" :title="$t('orders.request_details')">
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-muted-foreground mb-1 text-xs font-medium">
            {{ $t('orders.desired_delivery_date') }}
          </p>
          <p class="text-sm">
            {{
              request.desiredDeliveryDate
                ? formatDate(request.desiredDeliveryDate)
                : '-'
            }}
          </p>
        </div>
        <div>
          <p class="text-muted-foreground mb-1 text-xs font-medium">
            {{ $t('orders.goods_label') }}
          </p>
          <p class="text-sm">
            {{ request.goodsLabel || '-' }}
          </p>
        </div>
      </div>
      <div class="border-t pt-4">
        <p class="text-muted-foreground mb-1 text-xs font-medium">
          {{ $t('orders.customer_reference') }}
        </p>
        <p class="text-sm">
          {{ request.customerReference || '-' }}
        </p>
      </div>
      <div class="border-t pt-4">
        <p class="text-muted-foreground mb-1 text-xs font-medium">
          {{ $t('message') }}
        </p>
        <p class="text-sm whitespace-pre-line">
          {{ request.comment || '-' }}
        </p>
      </div>
    </div>
  </ContentEditCard>
</template>
