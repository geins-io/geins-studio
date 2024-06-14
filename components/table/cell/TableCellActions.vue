<script setup lang="ts">
defineProps<{
  product: {
    id: string;
  };
}>();
</script>
<template>
  <div class="flex justify-end gap-3">
    <Button>Edit</Button>
    <Button variant="destructive">Delete</Button>
  </div>
</template>
