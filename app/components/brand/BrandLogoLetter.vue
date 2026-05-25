<script setup lang="ts">
import GeinsLetter from '@/assets/logos/geins-g.svg';
import LitiumLetter from '@/assets/logos/litium-g.svg';

const { isLitium } = useBrand();
</script>

<template>
  <LitiumLetter v-if="isLitium" v-bind="$attrs" />
  <GeinsLetter v-else v-bind="$attrs" />
</template>
