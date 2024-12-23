<script setup lang="ts" generic="T">
const _props = withDefaults(
  defineProps<{
    mode: 'simple' | 'advanced';
  }>(),
  {
    mode: 'simple',
  },
);

const { defaultCurrency } = useAccountStore();

const dummyData: SelectorSelectionBase = {
  include: [
    {
      condition: 'and',
      selections: [
        {
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
      ],
    },
  ],
};

const fallbackSelection: SelectorSelection = {
  condition: 'and',
  categories: [],
  brands: [],
  price: [],
  stock: [],
  ids: [],
};

const includeSelection = ref<SelectorSelection>(
  dummyData.include?.[0]?.selections?.[0] || fallbackSelection,
);
const excludeSelection = ref<SelectorSelection>(
  dummyData.exclude?.[0]?.selections?.[0] || fallbackSelection,
);

const addToManuallySelected = (id: number) => {
  includeSelection.value?.ids?.push(id);
};
const removeFromManuallySelected = (id: number) => {
  includeSelection.value?.ids?.splice(
    includeSelection.value?.ids?.indexOf(id),
    1,
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
    includeSelection.value?.ids?.includes(product.id),
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
          :selection="includeSelection"
          @add="addToManuallySelected($event)"
          @remove="removeFromManuallySelected($event)"
        />
      </slot>
    </div>
    <div>
      <div class="mb-4 space-y-4">
        <slot name="selection">
          <SelectorSelection
            type="include"
            :selection="includeSelection"
            :currency="defaultCurrency"
          />
          <FormSwitch
            :checked="shouldExclude"
            @update:checked="shouldExclude = $event"
          />
          <SelectorSelection
            v-if="shouldExclude"
            type="exclude"
            :selection="excludeSelection"
            :currency="defaultCurrency"
          />
        </slot>
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
