<script setup lang="ts">
import type { QuotationTotal, QuotationPreviewTotal } from '#shared/types';

const props = withDefaults(
  defineProps<{
    total: QuotationTotal | QuotationPreviewTotal;
    currency: string;
    label?: string;
    editMode?: boolean;
  }>(),
  {
    label: '',
    editMode: false,
  },
);

const discountType = defineModel<'percent' | 'fixedAmount'>('discountType', {
  default: 'percent',
});
const discountValue = defineModel<string>('discountValue', { default: '' });
const shippingFee = defineModel<string>('shippingFee', { default: '' });

const emit = defineEmits<{
  blur: [];
}>();

const { t } = useI18n();

const formatPrice = (value: number) => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const shippingValue = computed(() =>
  'suggestedShippingFee' in props.total
    ? props.total.suggestedShippingFee
    : props.total.shipping,
);

interface PriceRow {
  key: string;
  label: string;
  value: number;
  negate?: boolean;
  editable?: 'discount' | 'shipping';
  bold?: boolean;
}

const rows = computed<PriceRow[]>(() => [
  { key: 'subtotal', label: t('orders.subtotal'), value: props.total.subtotal },
  {
    key: 'discount',
    label: t('orders.discount'),
    value: props.total.discount,
    negate: true,
    editable: 'discount',
  },
  {
    key: 'shipping',
    label: t('orders.shipping'),
    value: shippingValue.value,
    editable: 'shipping',
  },
  {
    key: 'grandTotalExVat',
    label: t('orders.grand_total_ex_vat'),
    value: props.total.grandTotalExVat,
  },
  { key: 'vat', label: t('orders.vat'), value: props.total.vat },
  {
    key: 'grandTotalIncVat',
    label: t('orders.grand_total_inc_vat'),
    value: props.total.grandTotalIncVat,
    bold: true,
  },
]);

const onTypeToggle = (type: 'percent' | 'fixedAmount') => {
  if (discountType.value === type) return;
  discountType.value = type;
  if (discountValue.value) {
    emit('blur');
  }
};
</script>
<template>
  <div>
    <ul class="space-y-3 text-sm">
      <li
        v-for="row in rows"
        :key="row.key"
        :class="
          cn(
            'flex items-center justify-between gap-2 text-right text-xs sm:text-sm',
            row.bold ? 'font-semibold' : '',
          )
        "
      >
        <span class="shrink-0 text-left">
          {{ row.label }}
        </span>
        <span
          class="border-muted-foreground/30 min-w-4 flex-1 translate-y-[-0.4em] self-end border-b border-dashed"
        />

        <!-- Editable discount row -->
        <template v-if="editMode && row.editable === 'discount'">
          <div class="flex shrink-0 items-center gap-1.5">
            <div class="flex h-7 overflow-hidden rounded-md border text-xs">
              <button
                type="button"
                :class="
                  cn(
                    'px-2 transition-colors',
                    discountType === 'percent'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted',
                  )
                "
                @click="onTypeToggle('percent')"
              >
                %
              </button>
              <button
                type="button"
                :class="
                  cn(
                    'border-l px-2 transition-colors',
                    discountType === 'fixedAmount'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted',
                  )
                "
                @click="onTypeToggle('fixedAmount')"
              >
                {{ currency }}
              </button>
            </div>
            <input
              v-model="discountValue"
              type="text"
              inputmode="decimal"
              class="bg-background border-input focus:ring-ring h-7 w-20 rounded-md border px-2 text-right text-xs tabular-nums focus:ring-1 focus:outline-none"
              placeholder="0"
              @blur="emit('blur')"
            />
          </div>
        </template>

        <!-- Editable shipping row -->
        <template v-else-if="editMode && row.editable === 'shipping'">
          <div class="flex shrink-0 items-center gap-1.5">
            <input
              v-model="shippingFee"
              type="text"
              inputmode="decimal"
              class="bg-background border-input focus:ring-ring h-7 w-20 rounded-md border px-2 text-right text-xs tabular-nums focus:ring-1 focus:outline-none"
              placeholder="0"
              @blur="emit('blur')"
            />
            <span class="text-xs font-bold">{{ currency }}</span>
          </div>
        </template>

        <!-- Read-only row -->
        <template v-else>
          <span class="shrink-0 tabular-nums">
            {{ row.negate && row.value > 0 ? '-' : ''
            }}{{ formatPrice(row.value) }}
            <span class="text-xs font-bold">{{ currency }}</span>
          </span>
        </template>
      </li>
    </ul>
  </div>
</template>
