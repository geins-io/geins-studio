<script setup lang="ts">
import { FileText, Receipt } from '@lucide/vue';
import type { ChannelPaymentMethod, Market } from '#shared/types';
import Avarda from '@/assets/logos/payment/avarda.svg';
import Geinspay from '@/assets/logos/payment/geinspay.svg';
import Klarnacheckoutv3 from '@/assets/logos/payment/klarnacheckoutv3.svg';
import Sveacheckout from '@/assets/logos/payment/sveacheckout.svg';
import Walleycheckout from '@/assets/logos/payment/walleycheckout.svg';
import type { Component } from 'vue';

const paymentLogos: Record<string, Component | string> = {
  avarda: Avarda,
  geinspay: Geinspay,
  klarnacheckoutv3: Klarnacheckoutv3,
  manualinvoice: FileText,
  sveacheckout: Sveacheckout,
  walleycheckout: Walleycheckout,
  prepaid: Receipt,
};

const props = defineProps<{
  payment: ChannelPaymentMethod;
  allMarkets?: Market[];
  onChange: (active: boolean) => void;
  disabled?: boolean;
}>();

const { t } = useI18n();

const logoComponent = computed(
  () => paymentLogos[props.payment.identifier.toLocaleLowerCase()] ?? null,
);

const resolvedMarketNames = computed(() =>
  props.payment.markets.map((marketId) => {
    const market = props.allMarkets?.find((entry) => entry._id === marketId);

    return market
      ? `${market.country?.name ?? marketId} (${market.currency?._id ?? ''})`
      : marketId;
  }),
);

const marketsTooltip = computed(() =>
  createTooltip({
    items: resolvedMarketNames.value,
    entityKey: 'market',
    formatter: (m) => m,
    t,
  }),
);

const customerTypesTooltip = computed(() =>
  createTooltip({
    items: props.payment.customerTypes,
    entityKey: 'customer_type',
    formatter: (ct) => ct,
    t,
  }),
);
</script>

<template>
  <Item variant="outline">
    <ItemMedia
      variant="image"
      :class="cn(!payment.active && 'opacity-50', 'h-10 w-18')"
    >
      <component
        :is="logoComponent"
        v-if="logoComponent"
        :font-controlled="false"
      />
      <LucideImageOff v-else class="text-muted-foreground size-4" />
    </ItemMedia>
    <ItemContent :class="cn(!payment.active && 'opacity-50')">
      <ItemTitle>{{ payment.name }}</ItemTitle>
      <ItemDescription>
        <span class="inline-flex items-center gap-1.5">
          <ContentTextTooltip v-if="!marketsTooltip.disabled">
            {{ marketsTooltip.displayValue }}
            <template #tooltip>{{ marketsTooltip.contentValue }}</template>
          </ContentTextTooltip>
          <template
            v-if="!marketsTooltip.disabled && !customerTypesTooltip.disabled"
          >
            <span class="text-muted-foreground/60">|</span>
          </template>
          <ContentTextTooltip v-if="!customerTypesTooltip.disabled">
            {{ customerTypesTooltip.displayValue }}
            <template #tooltip>
              {{ customerTypesTooltip.contentValue }}
            </template>
          </ContentTextTooltip>
        </span>
      </ItemDescription>
    </ItemContent>
    <ItemActions>
      <Switch
        :model-value="payment.active"
        :disabled="disabled"
        @update:model-value="onChange"
      />
    </ItemActions>
  </Item>
</template>
