<script setup lang="ts">
const _emits = defineEmits(['add']);
const api = repository(useNuxtApp().$geinsApi);
const products = await api.product.list();
</script>
<template>
  <div class="flex w-1/2 gap-6">
    <SelectorQuickAdd :data-set="products" @add="$emit('add', $event)" />
    <SelectorPanel>
      <Button>Browse</Button>
    </SelectorPanel>
  </div>
</template>
