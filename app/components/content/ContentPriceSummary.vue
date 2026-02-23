<script setup lang="ts">
import type { QuotationTotal } from '#shared/types';

const props = withDefaults(
  defineProps<{
    total: QuotationTotal;
    currency: string;
    label?: string;
  }>(),
  {
    label: '',
  },
);

const { t } = useI18n();

const formatPrice = (value: number) => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const rows = computed(() => {
  const items = [
    { label: t('orders.subtotal'), value: props.total.subtotal },
    { label: t('orders.discount'), value: props.total.discount, negate: true },
    { label: t('orders.shipping'), value: props.total.shipping },
    { label: t('orders.tax'), value: props.total.tax },
  ];

  if (props.total.grandTotal !== undefined) {
    items.push({
      label: t('orders.grand_total'),
      value: props.total.grandTotal,
      negate: false,
    });
  }

  return items;
});
</script>
<template>
  <div>
    <ul class="space-y-3 text-sm">
      <li
        v-for="(row, index) in rows"
        :key="index"
        :class="
          cn(
            'flex items-center justify-between gap-2 text-right text-xs sm:text-sm',
            index === rows.length - 1 && total.grandTotal !== undefined
              ? 'font-semibold'
              : '',
          )
        "
      >
        <span class="shrink-0 text-left">
          {{ row.label }}
        </span>
        <span
          class="border-muted-foreground/30 min-w-4 flex-1 translate-y-[-0.4em] self-end border-b border-dashed"
        />
        <span class="shrink-0 tabular-nums">
          {{ row.negate && row.value > 0 ? '-' : ''
          }}{{ formatPrice(row.value) }}
          <span class="text-xs font-bold">{{ currency }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>
