<script setup lang="ts">
import { Pencil, Trash } from 'lucide-vue-next';

const emit = defineEmits({
  edit: (): boolean => true,
  delete: (): boolean => true,
});
// Import icons edit and delete from lucile-vue-next
</script>
<template>
  <div class="flex justify-end gap-3">
    <Button class="size-7" size="xs" variant="secondary" @click="emit('edit')">
      <Pencil class="size-5" />
    </Button>
    <Button
      class="size-7"
      size="xs"
      variant="secondary"
      @click="emit('delete')"
    >
      <Trash class="size-5" />
    </Button>
  </div>
</template>
