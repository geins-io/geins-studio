<script setup lang="ts">
defineProps<{
  product: {
    id: string;
  };
}>();
</script>
<template>
  <div class="flex justify-end gap-3">
    <Button size="sm">Edit</Button>
    <Button size="sm" variant="destructive">Delete</Button>
  </div>
</template>
