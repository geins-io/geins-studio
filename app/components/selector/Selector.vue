<script setup lang="ts" generic="T extends SelectorEntity">
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
    entities: T[];
    entityName?: string;
    mode?: SelectorMode;
    selectionStrategy?: SelectorSelectionStrategy;
    allowExclusions?: boolean;
    productQueryParams?: Record<string, string>;
    currency?: string;
    fetchEntitiesExternally?: boolean;
  }>(),
  {
    entityName: 'product',
    mode: SelectorMode.Advanced,
    selectionStrategy: SelectorSelectionStrategy.All,
    allowExclusions: true,
    productQueryParams: () => ({ fields: 'localizations,media,prices' }),
    fetchEntitiesExternally: false,
  },
);

const productQueryParams = toRef(props, 'productQueryParams');

const {
  getFallbackSelection,
  getEmptyInternalSelectionBase,
  convertToQuerySelection,
  convertToInternalSelectionBase,
  convertToSimpleSelection,
  convertSimpleToInternalSelectionBase,
} = useSelector();

const selection = defineModel<SelectorSelectionQueryBase>('selection');
const simpleSelection =
  defineModel<SelectorSelectionSimpleBase>('simple-selection');

const internalSelection = ref<SelectorSelectionInternalBase>(
  getEmptyInternalSelectionBase(),
);

watch(
  [selection, simpleSelection],
  ([sel, simpleSel]) => {
    if (props.mode === SelectorMode.Simple && simpleSel) {
      internalSelection.value = convertSimpleToInternalSelectionBase(simpleSel);
    } else if (sel) {
      internalSelection.value = convertToInternalSelectionBase(sel);
    } else {
      internalSelection.value = getEmptyInternalSelectionBase();
    }
  },
  { immediate: true, deep: true },
);

// GLOBALS
const entities = toRef(props, 'entities');
const mode: Ref<SelectorMode> = toRef(props, 'mode');
const entityName = toRef(props, 'entityName');
const selectionStrategy = toRef(props, 'selectionStrategy');
const allowExclusions = toRef(props, 'allowExclusions');
const accountStore = useAccountStore();
const { currentCurrency } = storeToRefs(accountStore);
const selectorCurrency = ref<string>(props.currency || currentCurrency.value);

const { toast } = useToast();
const { t } = useI18n();

const productsStore = useProductsStore();

if (props.mode == SelectorMode.Advanced) {
  productsStore.init();
}

// SETUP REFS FOR INCLUDE/EXCLUDE SELECTION
const includeSelection = ref<SelectorSelectionInternal>(
  internalSelection.value.include || getFallbackSelection(),
);
const excludeSelection = ref<SelectorSelectionInternal>(
  internalSelection.value.exclude || getFallbackSelection(),
);
const resetSelections = () => {
  includeSelection.value = getFallbackSelection();
  excludeSelection.value = getFallbackSelection();
};

// WATCH AND UPDATE SELECTION ON INCLUDE/EXCLUDE SELECTION CHANGE
watch(
  includeSelection,
  (value) => {
    if (mode.value === SelectorMode.Simple && simpleSelection.value) {
      simpleSelection.value.include = convertToSimpleSelection(value);
    } else if (selection.value) {
      selection.value.include = [
        {
          selections: convertToQuerySelection(value),
        },
      ];
    }
  },
  { deep: true },
);
watch(
  excludeSelection,
  (value) => {
    if (mode.value === SelectorMode.Simple && simpleSelection.value) {
      simpleSelection.value.exclude = convertToSimpleSelection(value);
    } else if (selection.value) {
      selection.value.exclude = [
        {
          selections: convertToQuerySelection(value),
        },
      ];
    }
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
  (oldVal, newVal) => {
    setupColumns();
    if (oldVal && oldVal.length && oldVal.length !== newVal?.length) {
      // If entities changed, reset selections
      //resetSelections();
    }
  },
  { immediate: true },
);

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

const { productApi } = useGeinsRepository();
const selectedProducts = ref<Product[]>([]);
const { transformProducts } = useProductsStore();
const selectionMade = computed(() => {
  return !!(
    (
      includeSelection.value.categoryIds?.length ||
      includeSelection.value.brandIds?.length ||
      includeSelection.value.ids?.length ||
      //Object.keys(includeSelection.value.price)?.length ||
      //Object.keys(includeSelection.value.stock)?.length ||
      excludeSelection.value.categoryIds?.length ||
      excludeSelection.value.brandIds?.length ||
      excludeSelection.value.ids?.length
    )
    //Object.keys(excludeSelection.value.price)?.length ||
    //Object.keys(excludeSelection.value.stock)?.length
  );
});

const excludeSelectionMade = computed(() => {
  return !!(
    (
      excludeSelection.value.categoryIds?.length ||
      excludeSelection.value.brandIds?.length ||
      excludeSelection.value.ids?.length
    )
    //Object.keys(excludeSelection.value.price)?.length ||
    //Object.keys(excludeSelection.value.stock)?.length
  );
});

const showExclude = ref(excludeSelectionMade.value);

watch(excludeSelectionMade, (newVal) => {
  showExclude.value = newVal;
});

if (!props.fetchEntitiesExternally) {
  watchEffect(async () => {
    let products = null;
    if (selectionMade.value && mode.value === SelectorMode.Advanced) {
      products = await productApi.query(
        selection.value,
        productQueryParams.value,
      );
      selectedProducts.value = transformProducts(products?.items);
    } else if (!selectionMade.value) {
      selectedProducts.value = [];
    }
  });
}

const selectedEntities = computed(() => {
  return mode.value === SelectorMode.Simple
    ? selectedEntitiesSimple.value
    : selectedProducts.value;
});

defineExpose({
  resetSelections,
  includeSelection,
  excludeSelection,
  selectedEntities,
  selectionMade,
  addToManuallySelected,
  removeFromManuallySelected,
});
</script>
<template>
  <div>
    <div class="mb-4 items-start justify-between @2xl:mb-6 @3xl:flex">
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
            :currency="selectorCurrency"
            :entity-name="entityName"
            :entities="entities"
            :selection-strategy="selectionStrategy"
          />
          <ContentSwitch
            v-if="allowExclusions"
            v-model:checked="showExclude"
            :label="$t('exclude_entity_from_selection', { entityName }, 2)"
            :description="$t('selector_exclude_description')"
          >
            <SelectorSelection
              v-model:selection="excludeSelection"
              :type="SelectorSelectionType.Exclude"
              :mode="mode"
              :currency="selectorCurrency"
              :entity-name="entityName"
              :entities="entities"
            />
          </ContentSwitch>
        </slot>
      </div>
      <slot />
      <slot name="list" :selector-entity-name="entityName">
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
