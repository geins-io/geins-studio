<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    dataList?: DataList;
  }>(),
  {
    dataList: () => [],
  },
);
</script>
<template>
  <ul v-auto-animate class="space-y-3 border-t pt-4 text-sm">
    <li
      v-for="(item, index) in dataList"
      :key="index"
      class="flex items-center justify-between gap-2"
    >
      <span class="font-bold">{{ item.label }}:</span>
      <span class="text-muted-foreground">{{ item.value }}</span>
    </li>
  </ul>
</template>
