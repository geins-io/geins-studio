<script setup lang="ts">
const _props = defineProps<{
  address: Address;
}>();

const { getCountryNameById } = useAccountStore();
</script>
<template>
  <div class="text-xs">
    <p v-if="address.firstName || address.lastName">
      {{ address.firstName }} {{ address.lastName }}
    </p>
    <p v-if="address.company">
      {{ address.company }}
    </p>
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
  </div>
</template>
