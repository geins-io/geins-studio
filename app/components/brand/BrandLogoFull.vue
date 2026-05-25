<script setup lang="ts">
import GeinsLogo from '@/assets/logos/geins.svg';
import LitiumLogo from '@/assets/logos/litium.svg';

const { isLitium } = useBrand();
</script>

<template>
  <LitiumLogo v-if="isLitium" v-bind="$attrs" style="max-width: 86px" />
  <GeinsLogo v-else v-bind="$attrs" />
</template>
