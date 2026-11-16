<script setup lang="ts">
import type { Address } from '#shared/types';
import { quotationBuyerDecision } from '#shared/utils/quotation';

const props = withDefaults(
  defineProps<{
    companyName?: string;
    vatNumber?: string;
    billingAddress?: Address | null;
    shippingAddress?: Address | null;
    buyerName?: string;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    loading?: boolean;
  }>(),
  {
    companyName: '',
    vatNumber: '',
    billingAddress: null,
    shippingAddress: null,
    buyerName: '',
    approvedAt: null,
    rejectedAt: null,
    loading: false,
  },
);

const { formatDate } = useDate();

const buyerDecision = computed(() =>
  quotationBuyerDecision({
    approvedAt: props.approvedAt,
    rejectedAt: props.rejectedAt,
  }),
);
</script>
<template>
  <div class="space-y-4">
    <!-- Company info -->
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-muted-foreground mb-1 text-xs font-medium">
          {{ $t('company') }}
        </p>
        <p class="text-sm">
          <Skeleton v-if="loading" class="h-5 w-32" />
          <template v-else>
            {{ companyName || '-' }}
          </template>
        </p>
      </div>
      <div>
        <p class="text-muted-foreground mb-1 text-xs font-medium">
          {{ $t('customers.vat_number') }}
        </p>
        <p class="text-sm">
          <Skeleton v-if="loading" class="h-5 w-32" />
          <template v-else>
            {{ vatNumber || '-' }}
          </template>
        </p>
      </div>
    </div>

    <!-- Addresses -->
    <div class="grid grid-cols-2 gap-4 border-t pt-4">
      <div>
        <p class="text-muted-foreground mb-1 text-xs font-medium">
          {{ $t('billing_address') }}
        </p>
        <ContentAddressDisplay
          :loading="loading"
          :address="billingAddress"
          address-only
        />
      </div>
      <div>
        <p class="text-muted-foreground mb-1 text-xs font-medium">
          {{ $t('shipping_address') }}
        </p>
        <ContentAddressDisplay
          :loading="loading"
          :address="shippingAddress"
          address-only
        />
      </div>
    </div>

    <!-- Buyer -->
    <div class="grid grid-cols-2 gap-4 border-t pt-4">
      <div>
        <p class="text-muted-foreground mb-1 text-xs font-medium">
          {{ $t('buyer') }}
        </p>
        <p class="text-sm">
          <Skeleton v-if="loading" class="h-5 w-32" />
          <template v-else>
            {{ buyerName || '-' }}
          </template>
        </p>
        <p
          v-if="!loading && buyerDecision"
          class="text-muted-foreground mt-1 text-xs"
        >
          {{
            buyerDecision.decision === 'accepted'
              ? $t('orders.accepted_on', { date: formatDate(buyerDecision.at) })
              : $t('orders.rejected_on', { date: formatDate(buyerDecision.at) })
          }}
        </p>
      </div>
    </div>
  </div>
</template>
