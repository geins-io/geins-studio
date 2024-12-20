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
    class="flex items-center gap-2 rounded-lg border bg-background px-3 py-1 text-sm"
  >
    {{ label }}
    <Button
      v-if="removable"
      type="ghost"
      class="size-3 bg-transparent p-0 text-foreground hover:bg-transparent hover:text-negative"
      size="icon"
      @click="emit('remove')"
    >
      <LucideX class="size-3" />
    </Button>
  </div>
</template>
