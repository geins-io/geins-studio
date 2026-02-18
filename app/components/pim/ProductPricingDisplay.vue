<script setup lang="ts">
import type { ProductPrice } from '#shared/types';

interface Props {
  defaultPrice: ProductPrice;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const { t } = useI18n();
const accountStore = useAccountStore();
const { currentCurrency } = storeToRefs(accountStore);
const locale = useCookieLocale();

// Format price with currency
const formatPrice = (value: number): string => {
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currentCurrency.value,
    minimumFractionDigits: 2,
  }).format(value);
};

// Format VAT rate as percentage
const formatVatRate = (rate: number): string => {
  return `${Math.round(rate * 100)}%`;
};
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="space-y-4">
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
    </div>
    <div v-else class="space-y-6">
      <!-- Selling Prices -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold">{{ $t('selling_price') }}</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <DataItem :label="$t('selling_price_inc_vat')">
            {{ formatPrice(defaultPrice.sellingPriceIncVat) }}
          </DataItem>
          <DataItem :label="$t('selling_price_ex_vat')">
            {{ formatPrice(defaultPrice.sellingPriceExVat) }}
          </DataItem>
        </div>
      </div>

      <!-- Regular Prices -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold">{{ $t('regular_price') }}</h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <DataItem :label="$t('regular_price_inc_vat')">
            {{ formatPrice(defaultPrice.regularPriceIncVat) }}
          </DataItem>
          <DataItem :label="$t('regular_price_ex_vat')">
            {{ formatPrice(defaultPrice.regularPriceExVat) }}
          </DataItem>
        </div>
      </div>

      <!-- VAT Rate -->
      <div class="space-y-4">
        <h3 class="text-sm font-semibold">{{ $t('vat_rate') }}</h3>
        <DataItem :label="$t('vat_rate')">
          {{ formatVatRate(defaultPrice.vatRate) }}
        </DataItem>
      </div>
    </div>
  </div>
</template>
