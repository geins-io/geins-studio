<script setup lang="ts">
import type { QuotationTotal } from '#shared/types';

const props = withDefaults(
  defineProps<{
    total: QuotationTotal;
    currency: string;
    label?: string;
    editMode?: boolean;
  }>(),
  {
    label: '',
    editMode: false,
  },
);

const shipping = props.total.shipping || 0;

const discountType = defineModel<'percent' | 'fixedAmount'>('discountType', {
  default: 'percent',
});
const discountValue = defineModel<string>('discountValue', {
  default: '',
});
const shippingFee = defineModel<string>('shippingFee', {
  default: '',
});

shippingFee.value = String(shipping || 0);

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
  show?: boolean;
}

const rows = computed<PriceRow[]>(() => {
  const discount = props.total.discount;
  const shipping = shippingValue.value || 0;

  return ([
    {
      key: 'subtotal',
      label: t('orders.subtotal'),
      value: props.total.subtotal,
      show: props.editMode || discount > 0 || shipping > 0,
    },
    {
      key: 'discount',
      label: t('orders.discount'),
      value: discount,
      negate: true,
      editable: 'discount' as const,
      show: props.editMode || discount > 0,
    },
    {
      key: 'shipping',
      label: t('orders.shipping'),
      value: shipping,
      editable: 'shipping' as const,
      show: props.editMode || shipping > 0,
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
  ] as PriceRow[]).filter((r) => r.show !== false);
});
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
            editMode ? 'h-6' : '',
          )
        "
      >
        <span class="shrink-0 text-left">
          {{ row.label }}
        </span>

        <!-- Discount popover trigger -->
        <Popover v-if="editMode && row.editable === 'discount'">
          <PopoverTrigger as-child>
            <Button variant="outline" size="icon-xs" class="relative shrink-0">
              <LucidePlus class="size-3" />
              <span
                v-if="Number(discountValue) > 0"
                class="bg-primary absolute -top-0.5 -right-0.5 flex size-1.5 rounded-full"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-auto p-2">
            <Label class="text-xs">{{ t('orders.discount') }}</Label>
            <Input
              v-model="discountValue"
              size="sm"
              placeholder="0"
              class="w-46 text-right text-xs tabular-nums"
              description="Add a discount to your quotation"
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
          </PopoverContent>
        </Popover>
        <!-- Shipping popover trigger -->

        <Popover v-else-if="editMode && row.editable === 'shipping'">
          <PopoverTrigger as-child>
            <Button variant="outline" size="icon-xs" class="relative shrink-0">
              <LucidePlus class="size-3" />
              <span
                v-if="shippingValue && Number(shippingValue) > 0"
                class="bg-primary absolute -top-0.5 -right-0.5 flex size-1.5 rounded-full"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" class="w-auto p-2">
            <Label class="text-xs">{{ t('orders.shipping') }}</Label>
            <Input
              v-model="shippingFee"
              size="sm"
              inputmode="decimal"
              placeholder="0"
              class="w-46 text-right text-xs tabular-nums"
              description="Add a suggested shipping fee"
              @blur="emit('blur')"
            >
              <template #valueDescriptor>
                {{ currency }}
              </template>
            </Input>
          </PopoverContent>
        </Popover>

        <span
          v-if="row.vat"
          class="text-muted-foreground shrink-0 text-xs font-normal"
          >({{ row.vat }})</span
        >

        <span
          class="border-muted-foreground/30 min-w-4 flex-1 translate-y-[-0.4em] self-end border-b border-dashed"
        />

        <!-- Value display (all rows) -->
        <span class="shrink-0 tabular-nums">
          {{ row.negate && row.value > 0 ? '-' : '' }}
          {{ formatPrice(row.value) }}
          <span class="text-xs font-bold">{{ currency }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>
