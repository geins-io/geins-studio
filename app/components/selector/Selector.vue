<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';

const props = withDefaults(
  defineProps<{
    entities: Entity[];
    entityName?: string;
    mode?: 'simple' | 'advanced';
  }>(),
  {
    entityName: 'product',
    mode: 'advanced',
  },
);

const entities = ref(props.entities);
const { defaultCurrency } = useAccountStore();
const { toast } = useToast();

/* const dummyData: SelectorSelectionBase = {
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
}; */

const dummyData: SelectorSelectionBase = {
  include: [
    {
      condition: 'and',
      selections: [
        {
          condition: 'and',
          categories: [],
          brands: [],
          price: [],
          stock: [],
          ids: [],
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

const { getColumns } = useColumns();
const columns = getColumns(entities.value);

const selectedEntities = computed(() => {
  const selected = entities.value.filter((entity) =>
    includeSelection.value?.ids?.includes(entity.id),
  );
  return selected.length ? selected : entities.value;
});

const shouldExclude = ref(false);
</script>
<template>
  <div>
    <div class="mb-6 flex items-start justify-between">
      <slot name="header">
        <SelectorHeader
          :entities="entities"
          :entity-name="entityName"
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
          :data="selectedEntities"
          :entity-name="entityName"
          :mode="mode"
        />
      </slot>
    </div>
  </div>
</template>
