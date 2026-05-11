<script setup lang="ts">
defineProps<{
  code: string;
  label: string;
}>();
</script>

<template>
  <FlagIcon v-if="code" :country-code="code" :name="label" />
  <span v-else class="text-sm">{{ label }}</span>
</template>
