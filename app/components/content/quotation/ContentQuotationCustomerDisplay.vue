<script setup lang="ts">
import type { Address } from '#shared/types';

withDefaults(
  defineProps<{
    companyName?: string;
    vatNumber?: string;
    billingAddress?: Address | null;
    shippingAddress?: Address | null;
    buyerName?: string;
    ownerName?: string;
    currency?: string;
    loading?: boolean;
  }>(),
  {
    companyName: '',
    vatNumber: '',
    billingAddress: null,
    shippingAddress: null,
    buyerName: '',
    ownerName: '',
    currency: '',
    loading: false,
  },
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

    <!-- Owner & Buyer -->
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
      </div>
      <div>
        <p class="text-muted-foreground mb-1 text-xs font-medium">
          {{ $t('orders.quotation_owner') }}
        </p>
        <p class="text-sm">
          <Skeleton v-if="loading" class="h-5 w-32" />
          <template v-else>
            {{ ownerName || '-' }}
          </template>
        </p>
      </div>
    </div>

    <!-- Currency -->
    <div class="border-t pt-4">
      <p class="text-muted-foreground mb-1 text-xs font-medium">
        {{ $t('currency') }}
      </p>
      <p class="text-sm">
        <Skeleton v-if="loading" class="h-5 w-32" />
        <template v-else>
          {{ currency || '-' }}
        </template>
      </p>
    </div>
  </div>
</template>
