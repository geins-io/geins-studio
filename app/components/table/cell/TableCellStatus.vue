<script setup lang="ts">
defineProps<{
  status: boolean | string;
}>();
</script>
<template>
  <div>
    <StatusBadge :status="status" />
  </div>
</template>
