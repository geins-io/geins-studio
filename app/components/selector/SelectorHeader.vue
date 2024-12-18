<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    selection: SelectorSelection;
    products: Product[];
  }>(),
  {
    title: 'Product selection',
    description: 'Quick add or browse to make a specific selection',
  },
);
const _emits = defineEmits(['add', 'remove']);
</script>
<template>
  <div>
    <h2 class="mb-1.5 text-xl font-semibold">{{ title }}</h2>
    <p class="text-sm text-muted-foreground">{{ description }}</p>
  </div>
  <div class="flex w-1/2 gap-6">
    <SelectorQuickAdd
      v-if="products.length"
      :data-set="products"
      :selection="selection"
      @add="$emit('add', $event)"
      @remove="$emit('remove', $event)"
    />
    <SelectorPanel>
      <Button>Browse</Button>
    </SelectorPanel>
  </div>
</template>
