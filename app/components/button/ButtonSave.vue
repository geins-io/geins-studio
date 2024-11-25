<script setup lang="ts">
import { Save } from 'lucide-vue-next';
</script>

<template>
  <Button>
    <Save class="mr-2 size-4" />
    <slot />
  </Button>
</template>
