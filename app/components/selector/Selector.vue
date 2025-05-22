<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
import type { ColumnDef } from '@tanstack/vue-table';
import {
  SelectorMode,
  SelectorSelectionStrategy,
  SelectorSelectionType,
} from '#shared/types';

// PROPS
const props = withDefaults(
  defineProps<{
    entities: SelectorEntity[];
    entityName?: string;
    mode?: SelectorMode;
    selectionStrategy?: SelectorSelectionStrategy;
    allowExclusions?: boolean;
  }>(),
  {
    entityName: 'product',
    mode: SelectorMode.Advanced,
    selectionStrategy: SelectorSelectionStrategy.All,
    allowExclusions: true,
  },
);

// TWO-WAY BINDING FOR SELECTION VIA V-MODEL
const selection = defineModel<SelectorSelectionBase>('selection', {
  required: true,
});

// GLOBALS
const entities = toRef(props, 'entities');
const mode: Ref<SelectorMode> = toRef(props, 'mode');
const entityName = toRef(props, 'entityName');
const selectionStrategy = toRef(props, 'selectionStrategy');
const allowExclusions = toRef(props, 'allowExclusions');
const accountStore = useAccountStore();
const { currentCurrency } = storeToRefs(accountStore);
const { toast } = useToast();
const { t } = useI18n();
const { getFallbackSelection, convertToApiSelections } = useSelector();

// SETUP REFS FOR INCLUDE/EXCLUDE SELECTION
const includeSelection = ref<SelectorSelection>(
  selection.value.include?.[0]?.selections?.[0] || getFallbackSelection(),
);
const excludeSelection = ref<SelectorSelection>(
  selection.value.exclude?.[0]?.selections?.[0] || getFallbackSelection(),
);
const resetSelections = () => {
  includeSelection.value = getFallbackSelection();
  excludeSelection.value = getFallbackSelection();
};
const showExclude = ref(!!excludeSelection.value.ids?.length);

// WATCH AND UPDATE SELECTION ON INCLUDE/EXCLUDE SELECTION CHANGE
watch(
  includeSelection,
  (value) => {
    const newSelections =
      mode.value === SelectorMode.Advanced
        ? convertToApiSelections(value)
        : [value];

    selection.value.include = [{ selections: newSelections }];
  },
  { deep: true },
);
watch(
  excludeSelection,
  (value) => {
    showExclude.value = !!value.ids?.length;
    const newSelections =
      mode.value === SelectorMode.Advanced
        ? convertToApiSelections(value)
        : [value];
    selection.value.exclude = [{ selections: newSelections }];
  },
  { deep: true },
);
watch(mode, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    resetSelections();
  }
});

// HANDLERS FOR MANUALLY SELECTED ENTITIES
const addToManuallySelected = (id: string) => {
  includeSelection.value?.ids?.push(id);
  toast({
    title: t('entity_with_id_added_to_selection', {
      entityName: props.entityName,
      id,
    }),
    variant: 'positive',
  });
};
const removeFromManuallySelected = (id: string) => {
  const index = includeSelection.value?.ids?.indexOf(id);
  if (index !== -1 && index !== undefined) {
    includeSelection.value?.ids?.splice(index, 1);
  } else {
    excludeSelection.value?.ids?.push(id);
  }
};

// SETUP TABLE FOR SELECTED ENTITIES
const { getColumns, orderAndFilterColumns, addActionsColumn } = useColumns();
let columns: ColumnDef<object>[] = [];

const setupColumns = () => {
  columns = getColumns(entities.value);
  columns = orderAndFilterColumns(columns, ['_id', 'name', 'slug', 'price']);
  addActionsColumn(
    columns,
    {
      onDelete: (entity: SelectorEntity) =>
        removeFromManuallySelected(entity._id),
    },
    'delete',
  );
};

watch(
  entities,
  () => {
    setupColumns();
    resetSelections();
  },
  { immediate: true },
);

const _selectionMade = computed(() => {
  return !!(
    includeSelection.value.ids?.length || excludeSelection.value.ids?.length
  );
});

// SELECTED ENTITIES
const selectedEntitiesSimple = computed(() => {
  const noSelectionMadeSelection =
    selectionStrategy.value === SelectorSelectionStrategy.All
      ? entities.value
      : [];
  const included = includeSelection.value.ids?.length
    ? entities.value.filter((entity) =>
        includeSelection.value?.ids?.includes(entity._id),
      )
    : noSelectionMadeSelection;
  const excludedIds = excludeSelection.value?.ids || [];
  const selected = included.filter(
    (entity) => !excludedIds.includes(entity._id),
  );
  return selected;
});

const api = repo.global(useNuxtApp().$geinsApi);
const selectedProducts = ref<Product[]>([]);
const { transformProducts } = useProductsStore();
const selectionMade = computed(() => {
  return (
    includeSelection.value.categoryIds?.length ||
    includeSelection.value.brandIds?.length ||
    includeSelection.value.ids?.length ||
    //Object.keys(includeSelection.value.price)?.length ||
    //Object.keys(includeSelection.value.stock)?.length ||
    excludeSelection.value.categoryIds?.length ||
    excludeSelection.value.brandIds?.length ||
    excludeSelection.value.ids?.length
    //Object.keys(excludeSelection.value.price)?.length ||
    //Object.keys(excludeSelection.value.stock)?.length
  );
});
watchEffect(async () => {
  let products = null;
  if (selectionMade.value && mode.value === SelectorMode.Advanced) {
    products = await api.product.list.query(
      selection.value,
      'localizations,images,prices',
    );
    selectedProducts.value = transformProducts(products?.items);
  } else {
    selectedProducts.value = selectedEntitiesSimple.value as Product[];
  }
});

const selectedEntities = computed(() => {
  return mode.value === SelectorMode.Simple
    ? selectedEntitiesSimple.value
    : selectedProducts.value;
});
</script>
<template>
  <div>
    <div class="mb-6 flex items-start justify-between">
      <slot name="header">
        <SelectorHeader
          :entities="entities"
          :entity-name="entityName"
          :selection="includeSelection"
          :title="t('entity_selection', { entityName })"
          :description="t('selector_include_description')"
          @add="addToManuallySelected($event)"
          @remove="removeFromManuallySelected($event)"
        />
      </slot>
    </div>
    <div>
      <div class="mb-4 space-y-4">
        <slot name="selection">
          <SelectorSelection
            v-model:selection="includeSelection"
            :type="SelectorSelectionType.Include"
            :mode="mode"
            :currency="currentCurrency"
            :entity-name="entityName"
            :entities="entities"
            :selection-strategy="selectionStrategy"
          />
          <ContentSwitch
            v-if="allowExclusions"
            v-model="showExclude"
            :label="$t('exclude_entity_from_selection', { entityName }, 2)"
            :description="$t('selector_exclude_description')"
          >
            <SelectorSelection
              v-model:selection="excludeSelection"
              :type="SelectorSelectionType.Exclude"
              :mode="mode"
              :currency="currentCurrency"
              :entity-name="entityName"
              :entities="entities"
            />
          </ContentSwitch>
        </slot>
      </div>
      <slot />
      <slot name="list">
        <ContentHeading>
          {{ $t('selected_entity', { entityName }, 2) }}
        </ContentHeading>
        <TableView
          :columns="columns"
          :data="selectedEntities"
          :entity-name="entityName"
          :empty-text="$t('no_entity_selected', { entityName }, 2)"
          :mode="TableMode.Simple"
          :page-size="15"
        />
      </slot>
    </div>
  </div>
</template>
