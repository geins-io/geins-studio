<script setup lang="ts">
const emit = defineEmits({
  edit: (): boolean => true,
  delete: (): boolean => true,
});
</script>
<template>
  <div class="flex justify-end gap-3">
    <Button size="sm" @click="emit('edit')">Edit</Button>
    <Button size="sm" variant="destructive" @click="emit('delete')">
      Delete
    </Button>
  </div>
</template>
