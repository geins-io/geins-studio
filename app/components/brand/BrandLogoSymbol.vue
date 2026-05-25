<script setup lang="ts">
import GeinsSymbol from '@/assets/logos/geins-symbol.svg';
import LitiumSymbol from '@/assets/logos/litium-symbol.svg';

const { isLitium } = useBrand();
</script>

<template>
  <LitiumSymbol v-if="isLitium" v-bind="$attrs" />
  <GeinsSymbol v-else v-bind="$attrs" />
</template>
