<script setup lang="ts" generic="T">
const _props = defineProps<{
  rowData: T;
}>();

const _emit = defineEmits({
  edit: (rowData): T => rowData,
});
</script>
<template>
  <div class="flex items-center justify-center">
    <Button
      class="size-7 p-1"
      size="xs"
      variant="outline"
      @click="$emit('edit', rowData)"
    >
      <LucideEdit class="size-3.5" />
    </Button>
  </div>
</template>
