<script setup lang="ts">
import { Copy } from 'lucide-vue-next';
</script>

<template>
  <Button>
    <Copy class="mr-2 size-4" />
    <slot />
  </Button>
</template>
