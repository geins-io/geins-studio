<script setup lang="ts">
import GeinsSymbol from '@/assets/logos/geins-symbol.svg';
import LitiumSymbol from '@/assets/logos/litium-symbol.svg';

const logoMap = { geins: GeinsSymbol, litium: LitiumSymbol } as const;
const { brandId } = useBrand();
</script>

<template>
  <component :is="logoMap[brandId]" v-bind="$attrs" />
</template>
