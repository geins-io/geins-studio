<script setup lang="ts">
import type { ChannelPaymentMethod } from '#shared/types';

const props = defineProps<{
  payment: ChannelPaymentMethod;
  onChange: (active: boolean) => void;
  disabled?: boolean;
}>();

const { t } = useI18n();

const subtitle = computed(() => {
  const parts: string[] = [];
  if (props.payment.markets?.length) {
    parts.push(
      t('channels.payment_markets_count', { count: props.payment.markets.length }),
    );
  }
  if (props.payment.customerTypes?.length) {
    parts.push(
      t('channels.payment_customer_types_count', {
        count: props.payment.customerTypes.length,
      }),
    );
  }
  return parts.join(' | ');
});
</script>

<template>
  <div class="flex items-center gap-4 py-3">
    <div class="flex-1">
      <div class="text-sm font-medium">{{ payment.name }}</div>
      <div v-if="subtitle" class="text-muted-foreground text-xs">
        {{ subtitle }}
      </div>
    </div>
    <Switch
      :checked="payment.active"
      :disabled="disabled"
      @update:checked="onChange"
    />
  </div>
</template>
