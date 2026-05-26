<script setup lang="ts">
import type { Component } from 'vue';

const modules = import.meta.glob<{ default: Component }>(
  '@/assets/logos/*-symbol.svg',
  { eager: true },
);

const symbolMap: Record<string, Component> = {};
for (const [path, mod] of Object.entries(modules)) {
  const name = path.match(/\/([^/]+)-symbol\.svg$/)?.[1];
  if (name) symbolMap[name] = mod.default;
}

const { appId } = useBrand();
const logo = computed(() => symbolMap[appId.value] ?? symbolMap['geins']);
</script>

<template>
  <component :is="logo" v-bind="$attrs" />
</template>
