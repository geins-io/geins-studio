<script setup lang="ts">
import type { ChannelPaymentMethod } from '#shared/types';

const props = withDefaults(
  defineProps<{
    payments: ChannelPaymentMethod[];
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  'update:payments': [payments: ChannelPaymentMethod[]];
}>();

const { t } = useI18n();

function handleToggle(paymentId: string, active: boolean) {
  const updated = props.payments.map((p) =>
    p._id === paymentId ? { ...p, active } : p,
  );
  emit('update:payments', updated);
}
</script>

<template>
  <ContentEditCard :title="t('channels.tab_payments')">
    <!-- Loading state -->
    <div v-if="loading" class="space-y-2 py-2">
      <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!payments.length"
      class="text-muted-foreground py-6 text-center text-sm"
    >
      {{ t('channels.no_payment_methods') }}
    </div>

    <!-- Payment rows -->
    <div v-else class="divide-y">
      <ChannelPaymentRow
        v-for="payment in payments"
        :key="payment._id"
        :payment="payment"
        :on-change="(active: boolean) => handleToggle(payment._id, active)"
      />
    </div>
  </ContentEditCard>
</template>
