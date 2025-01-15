<script setup lang="ts" generic="T">
import { useToast } from '@/components/ui/toast/use-toast';

const _props = withDefaults(
  defineProps<{
    mode: 'simple' | 'advanced';
  }>(),
  {
    mode: 'simple',
  },
);

const { defaultCurrency } = useAccountStore();
const { toast } = useToast();

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
  toast({
    title: `Product with id ${id} added to selection`,
    variant: 'positive',
  });
};
const removeFromManuallySelected = (id: number) => {
  includeSelection.value?.ids?.splice(
    includeSelection.value?.ids?.indexOf(id),
    1,
  );
};

const { products } = useProductsStore();
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
          <ContentSwitch
            label="Exclude products from selection"
            description="Exclude a brand, category, product etc. from your selection"
            :checked="shouldExclude"
            @update:checked="shouldExclude = $event"
          >
            <SelectorSelection
              type="exclude"
              :selection="excludeSelection"
              :currency="defaultCurrency"
            />
          </ContentSwitch>
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
