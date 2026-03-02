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

const discountTypeOptions = computed(() => [
  { value: 'percent' as const, label: '%' },
  { value: 'fixedAmount' as const, label: props.currency },
]);

const onDiscountTypeChange = (value: 'percent' | 'fixedAmount') => {
  discountType.value = value;
  if (discountValue.value) {
    emit('blur');
  }
};

interface PriceRow {
  key: string;
  label: string;
  value: number;
  negate?: boolean;
  editable?: 'discount' | 'shipping';
  bold?: boolean;
  big?: boolean;
  vat?: string;
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
    label: t('orders.total'),
    value: props.total.grandTotalExVat,
    bold: true,
    vat: t('ex_vat'),
  },
  { key: 'vat', label: t('orders.vat'), value: props.total.vat },
  {
    key: 'grandTotalIncVat',
    label: t('orders.grand_total'),
    value: props.total.grandTotalIncVat,
    bold: true,
    big: true,
    vat: t('inc_vat'),
  },
]);
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
            row.big ? 'text-sm sm:text-base' : '',
          )
        "
      >
        <span class="shrink-0 text-left">
          {{ row.label }}
        </span>
        <span
          v-if="row.vat"
          class="text-muted-foreground shrink-0 text-xs font-normal"
          >({{ row.vat }})</span
        >
        <span
          class="border-muted-foreground/30 min-w-4 flex-1 translate-y-[-0.4em] self-end border-b border-dashed"
        />

        <!-- Editable discount row -->
        <template v-if="editMode && row.editable === 'discount'">
          <div class="flex shrink-0 items-center gap-1.5">
            <Input
              v-model="discountValue"
              size="sm"
              inputmode="decimal"
              placeholder="0"
              class="w-30 text-right text-xs"
              @blur="emit('blur')"
            >
              <template #valueDescriptor>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <button
                      class="flex cursor-pointer items-center gap-0.5 text-xs"
                    >
                      {{ discountType === 'percent' ? '%' : currency }}
                      <LucideChevronDown class="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" class="min-w-10">
                    <DropdownMenuItem
                      v-for="opt in discountTypeOptions"
                      :key="opt.value"
                      class="text-xs"
                      @click="onDiscountTypeChange(opt.value)"
                    >
                      {{ opt.label }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </template>
            </Input>
            <span class="shrink-0 tabular-nums">
              {{ row.negate && row.value > 0 ? '-' : ''
              }}{{ formatPrice(row.value) }}
              <span class="text-xs font-bold">{{ currency }}</span>
            </span>
          </div>
        </template>

        <!-- Editable shipping row -->
        <template v-else-if="editMode && row.editable === 'shipping'">
          <Input
            v-model="shippingFee"
            size="sm"
            inputmode="decimal"
            placeholder="0"
            class="w-30 shrink-0 text-right text-xs tabular-nums"
            @blur="emit('blur')"
          >
            <template #valueDescriptor>
              {{ currency }}
            </template>
          </Input>
          <span class="shrink-0 tabular-nums">
            {{ row.negate && row.value > 0 ? '-' : ''
            }}{{ formatPrice(row.value) }}
            <span class="text-xs font-bold">{{ currency }}</span>
          </span>
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
