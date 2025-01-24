<script setup lang="ts" generic="T">
const _props = defineProps<{
  rowData: T;
}>();

const _emit = defineEmits({
  delete: (rowData): T => rowData,
});
</script>
<template>
  <div class="flex items-center justify-center">
    <Button
      class="size-7 p-1 hover:text-negative"
      size="xs"
      variant="outline"
      @click="$emit('delete', rowData)"
    >
      <LucideX class="size-3.5" />
    </Button>
  </div>
</template>
