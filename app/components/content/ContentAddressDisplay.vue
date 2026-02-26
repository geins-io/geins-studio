<script setup lang="ts">
withDefaults(
  defineProps<{
    address?: AddressUpdate | null;
    addressOnly?: boolean;
    loading?: boolean;
  }>(),
  { addressOnly: false, loading: false },
);

const { getCountryNameById } = useAccountStore();
</script>
<template>
  <div class="text-xs">
    <template v-if="loading">
      <Skeleton class="mb-0.5 h-4 w-24" />
      <Skeleton class="mb-0.5 h-4 w-32" />
      <Skeleton class="h-4 w-16" />
    </template>
    <template v-else-if="!address">
      <span>-</span>
    </template>
    <template v-else>
      <template v-if="!addressOnly">
        <p v-if="address.firstName || address.lastName" class="">
          {{ fullName(address) }}
        </p>
        <p v-if="address.company">
          {{ address.company }}
        </p>
      </template>
      <p v-if="address.addressLine1">
        {{ address.addressLine1 }}
      </p>
      <p v-if="address.addressLine2">
        {{ address.addressLine2 }}
      </p>
      <p v-if="address.zip || address.city">
        {{ address.zip }} {{ address.city }}
      </p>
      <p v-if="address.region">
        {{ address.region }}
      </p>
      <p v-if="address.country">
        {{ getCountryNameById(address.country) }}
      </p>
    </template>
  </div>
</template>
