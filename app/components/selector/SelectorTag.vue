<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    label: string;
    removable?: boolean;
  }>(),
  {
    removable: true,
  },
);
const emit = defineEmits(['remove']);
</script>
<template>
  <div
    class="bg-background flex items-center gap-2 rounded-lg border px-2 py-1 text-xs font-light whitespace-nowrap @2xl:px-3 @2xl:text-sm"
  >
    {{ label }}
    <Button
      v-if="removable"
      type="ghost"
      class="text-foreground hover:text-negative size-3 bg-transparent p-0 hover:bg-transparent"
      size="xs"
      @click="emit('remove')"
    >
      <LucideX class="size-3" />
    </Button>
  </div>
</template>
