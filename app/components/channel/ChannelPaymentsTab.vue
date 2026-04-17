<script setup lang="ts">
import type { ChannelPaymentMethod, Market } from '#shared/types';

const props = withDefaults(
  defineProps<{
    payments: ChannelPaymentMethod[];
    allMarkets?: Market[];
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
  <ContentEditCard :title="t('payment_method', 2)">
    <!-- Loading state -->
    <div v-if="loading" class="space-y-2 py-2">
      <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
    </div>

    <!-- Empty state -->
    <Empty v-else-if="!payments.length" class="border-y">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LucideCreditCard class="size-5" />
        </EmptyMedia>
        <EmptyTitle>
          {{ t('no_entity', { entityName: 'payment_method' }, 2) }}
        </EmptyTitle>
        <EmptyDescription>{{
          t('channels.no_payment_methods')
        }}</EmptyDescription>
      </EmptyHeader>
    </Empty>

    <!-- Payment rows -->
    <div v-else class="divide-y border-y py-6">
      <ChannelPaymentRow
        v-for="payment in payments"
        :key="payment._id"
        :payment="payment"
        :all-markets="allMarkets"
        :on-change="(active: boolean) => handleToggle(payment._id, active)"
      />
    </div>
  </ContentEditCard>
</template>
