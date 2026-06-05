<script setup lang="ts">
defineProps<{
  value: string;
}>();
</script>
<template>
  <div>
    <code
      v-if="value && value !== '–'"
      class="bg-muted text-foreground inline-block max-w-full truncate rounded-md px-1.5 py-0.5 font-mono text-xs"
    >
      {{ value }}
    </code>
    <span v-else class="text-muted-foreground">–</span>
  </div>
</template>
