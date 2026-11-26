<script setup lang="ts">
import type { DashboardWidgetInstance } from '#shared/types';
import { attentionTileKey } from '@/lib/dashboard-data';

const props = defineProps<{
  instance: DashboardWidgetInstance;
}>();

const key = attentionTileKey(props.instance.type);
const { entries } = useDashboardAttention(key ? [key] : []);
const entry = computed(() => entries.value[0]);
</script>

<template>
  <DashboardWidget :instance="instance">
    <DashboardAttentionCard v-if="entry" :entry="entry" layout="tile" />
  </DashboardWidget>
</template>
