<script setup lang="ts">
import GeinsLogo from '@/assets/logos/geins.svg';
import LitiumLogo from '@/assets/logos/litium.svg';

const logoMap = { geins: GeinsLogo, litium: LitiumLogo } as const;
const { brand, brandId } = useBrand();
</script>

<template>
  <component
    :is="logoMap[brandId]"
    v-bind="$attrs"
    :style="brand.logoFullMaxWidth ? { maxWidth: brand.logoFullMaxWidth } : undefined"
  />
</template>
