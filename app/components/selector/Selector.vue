<script setup lang="ts" generic="T">
const { geinsLog } = useGeinsLog();

const props = withDefaults(
  defineProps<{
    mode: 'simple' | 'advanced';
    selection: SelectorSelection;
  }>(),
  {
    mode: 'simple',
  },
);

const selection = ref(props.selection);

const addToManuallySelected = (id: number) => {
  selection.value.ids?.push(id);
};
const removeFromManuallySelected = (id: number) => {
  selection.value.ids = selection.value.ids?.filter((i) => i !== id);
};

// Get dataset of entity
const api = repository(useNuxtApp().$geinsApi);
const products = await api.product.list();
const entityName = 'product';
const { getColumns } = useColumns();
const columns = getColumns(products);

const selectedProducts = computed(() => {
  const selected = products.filter((product) =>
    selection.value.ids?.includes(product.id),
  );
  return selected.length ? selected : products;
});
</script>
<template>
  <div class="mb-6 flex items-start justify-between">
    <slot name="header">
      <SelectorHeader
        :products="products"
        :selection="selection"
        @add="addToManuallySelected($event)"
        @remove="removeFromManuallySelected($event)"
      />
    </slot>
  </div>
  <div>
    <slot name="selection" />
    <slot />
    <slot name="list">
      <TableView
        :columns="columns"
        :data="selectedProducts"
        :entity-name="entityName"
        mode="simple"
      />
    </slot>
  </div>
</template>
