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
      class="hover:text-negative size-6 p-1 sm:size-7"
      size="xs"
      variant="outline"
      @click="$emit('delete', rowData)"
    >
      <LucideX class="size-3.5" />
    </Button>
  </div>
</template>
