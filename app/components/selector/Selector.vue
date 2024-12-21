<script setup lang="ts" generic="T">
const props = withDefaults(
  defineProps<{
    mode: 'simple' | 'advanced';
  }>(),
  {
    mode: 'simple',
  },
);

const { defaultCurrency } = useAccountStore();

const dummyData: SelectorSelectionBase = {
  include: {
    condition: 'and',
    categories: [
      { id: 1, name: 'Electronics' },
      { id: 2, name: 'Clothing' },
      { id: 3, name: 'Shoes' },
    ],
    brands: [
      { id: 1, name: 'BrandA' },
      { id: 2, name: 'BrandB' },
    ],
    price: [
      {
        condition: 'lt',
        values: {
          EUR: 90,
          SEK: 850,
        },
      },
      {
        condition: 'gt',
        values: {
          EUR: 10,
          SEK: 100,
        },
      },
    ],
    stock: [
      {
        condition: 'gt',
        quantity: 10,
      },
      {
        condition: 'lt',
        quantity: 1000,
      },
    ],
    ids: [1, 2, 3],
  },
  exclude: {
    condition: 'or',
    categories: [{ id: 22, name: 'Clottthhhing' }],
    brands: [{ id: 2, name: 'BrandB' }],
    ids: [4, 5, 6],
  },
};

const selection = ref<SelectorSelectionBase>(dummyData);

const addToManuallySelected = (id: number) => {
  selection.value.include.ids?.push(id);
};
const removeFromManuallySelected = (id: number) => {
  selection.value.include.ids = selection.value.exclude.ids?.filter(
    (i) => i !== id,
  );
};

// Get dataset of entity
const api = repository(useNuxtApp().$geinsApi);
const products = await api.product.list();
const entityName = 'product';
const { getColumns } = useColumns();
const columns = getColumns(products);

const selectedProducts = computed(() => {
  const selected = products.filter((product) =>
    selection.value.include.ids?.includes(product.id),
  );
  return selected.length ? selected : products;
});

const shouldExclude = ref(false);
</script>
<template>
  <div>
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
      <div class="mb-4">
        <slot name="selection">
          <SelectorSelection
            class="mb-4"
            type="include"
            :selection="selection.include"
            :currency="defaultCurrency"
          />
        </slot>
        <FormSwitch
          :checked="shouldExclude"
          @update:checked="shouldExclude = $event"
        />
      </div>
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
  </div>
</template>
