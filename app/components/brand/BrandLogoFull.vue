<script setup lang="ts">
import type { Component } from 'vue';

const modules = import.meta.glob<{ default: Component }>(
  '@/assets/logos/*-logo.svg',
  { eager: true },
);

const logoMap: Record<string, Component> = {};
for (const [path, mod] of Object.entries(modules)) {
  const name = path.match(/\/([^/]+)-logo\.svg$/)?.[1];
  if (name) logoMap[name] = mod.default;
}

const { appId, brand } = useBrand();
const logo = computed(() => logoMap[appId.value] ?? logoMap['geins']);
</script>

<template>
  <component
    :is="logo"
    v-bind="$attrs"
    :style="brand.logoFullMaxWidth ? { maxWidth: brand.logoFullMaxWidth } : undefined"
  />
</template>
