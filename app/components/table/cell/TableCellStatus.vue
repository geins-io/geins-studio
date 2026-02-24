<script setup lang="ts">
import type { StatusBadgeStatus } from '#shared/types';

defineProps<{
  status: StatusBadgeStatus;
}>();
</script>
<template>
  <div>
    <StatusBadge :status="status" />
  </div>
</template>
