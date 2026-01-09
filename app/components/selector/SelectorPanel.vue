<script setup lang="ts" generic="T extends SelectorEntity">
import type { ColumnDef, Row, Table } from '@tanstack/vue-table';
import {
  type SelectorEntity,
  type SelectorMode,
  type SelectorSelectionInternal,
  SelectorEntityType,
  TableMode,
} from '#shared/types';

// PROPS
const props = withDefaults(
  defineProps<{
    selection: SelectorSelectionInternal;
    mode: SelectorMode;
    currency?: string;
    options: SelectorSelectionOption[];
    entityName: string;
    entities: T[];
    entityType?: SelectorEntityType;
  }>(),
  {
    entityType: SelectorEntityType.Product,
  },
);

// EMITS
const emit = defineEmits<{
  (event: 'save', selection: SelectorSelectionInternal): void;
}>();

// GLOBALS
const { t } = useI18n();
const productsStore = useProductsStore();
const { categories, brands } = storeToRefs(productsStore);

const entityName = toRef(props, 'entityName');
const entities = toRef(props, 'entities');
const entityType = toRef(props, 'entityType');
/* const type = toRef(props, 'type');
const currency = toRef(props, 'currency');
const mode = toRef(props, 'mode'); */
const entityIsProduct = computed(
  () => entityType.value === SelectorEntityType.Product,
);
const entityIsSku = computed(() => entityType.value === SelectorEntityType.Sku);

const hasMultipleSkus = computed(() => {
  if (!entityIsSku.value) return false;
  return entities.value.some(
    (product) => ((product.skus as T[]) || []).length > 1,
  );
});

const currentSelection = ref<SelectorSelectionInternal>(
  toRef(props, 'selection').value,
);

// WATCH AND KEEP SELECTION IN SYNC
watch(
  () => props.selection,
  (value) => {
    currentSelection.value = value;
  },
  { deep: true },
);

const options = toRef(props, 'options');
const currentOption = ref(options.value?.[0]?.id ?? '');

watch(
  options,
  (value) => {
    currentOption.value = value?.[0]?.id ?? '';
  },
  { deep: true },
);
const currentSelectionGroup = computed(
  () => options.value.find((o) => o.id === currentOption.value)?.group || 'ids',
);
const selectedEntities: ComputedRef<
  { _id: string; name: string; productId?: string; isCollapsed?: boolean }[]
> = computed(() => {
  switch (currentSelectionGroup.value) {
    case 'categoryIds':
      return categories.value.filter((e) =>
        currentSelection.value.categoryIds?.includes(e._id),
      );
    case 'brandIds':
      return brands.value.filter((e) =>
        currentSelection.value.brandIds?.includes(e._id),
      );
    default:
      if (entityIsSku.value) {
        const selectedSkus: T[] = [];
        entities.value.forEach((product) => {
          if (product.skus === undefined) {
            if (currentSelection.value.ids?.includes(product._id)) {
              selectedSkus.push(product);
            }
          } else {
            ((product.skus as T[]) || []).forEach((sku) => {
              if (currentSelection.value.ids?.includes(sku._id)) {
                selectedSkus.push(sku);
              }
            });
          }
        });
        return selectedSkus;
      }
      return entities.value.filter((e) =>
        currentSelection.value.ids?.includes(e._id),
      );
  }
});
const selectedIds = computed(() => currentSelection.value.ids);

const selectOption = (id: SelectorSelectionOptionsId) => {
  currentOption.value = id;
};

const searchableFields: Array<keyof T> = [
  '_id',
  'name',
  'articleNumber',
  'productId',
];

// Columns for Entity
const {
  getColumns,
  orderAndFilterColumns,
  addExpandingColumn,
  getBasicCellStyle,
} = useColumns<T>();

let columns: ColumnDef<T>[] = [];
const columnOptions: ColumnOptions<T> = {
  selectable: true,
  columnTitles: {
    _id: 'Sku id',
  } as Partial<Record<Extract<keyof T, string>, string>>,
};

const setupEntityColumns = () => {
  columns = getColumns(entities.value, columnOptions);

  if (entityIsSku.value) {
    // Only add expander column if at least one product has multiple skus
    if (hasMultipleSkus.value) {
      columns = addExpandingColumn(columns);
    }
    columns = columns.map((col) => {
      if (col.id === 'select') {
        const originalCell = col.cell;
        return {
          ...col,
          id: 'select' as string,
          header: () => null,
          cell: (props: { table: Table<T>; row: Row<T> }) => {
            const { table, row } = props;
            // Hide checkbox for parent rows (rows that CAN expand)
            if (row.getCanExpand()) {
              return h(
                'div',
                {
                  class: cn(
                    getBasicCellStyle(table),
                    'px-3 flex items-center justify-center text-2xl!',
                  ),
                },
                row.getIsSomeSelected() ? '▣' : '',
              );
            }
            // Show checkbox for child rows
            if (typeof originalCell === 'function') {
              const selectCell = row
                .getAllCells()
                .find((c) => c.column.id === 'select');
              if (!selectCell) return null;
              return originalCell(selectCell.getContext());
            }
            return null;
          },
        } as ColumnDef<T>;
      }

      if (col.id === '_id') {
        // it is a parent (canexpand) row, show show no value, otherwise, show the id
        return {
          ...col,
          cell: (props: { row: Row<T>; table: Table<T> }) => {
            const { row, table } = props;
            if (row.getCanExpand()) {
              return h('div', {});
            }
            return h(
              'div',
              {
                class: cn(getBasicCellStyle(table)),
              },
              row.getValue('_id'),
            );
          },
        };
      }
      if (col.id === 'productId') {
        return {
          ...col,
          cell: (props: { row: Row<T>; table: Table<T> }) => {
            const { row, table } = props;
            if (row.depth > 0) {
              return h('div', {});
            }
            return h(
              'div',
              {
                class: cn(getBasicCellStyle(table)),
              },
              row.getValue('productId'),
            );
          },
        };
      }

      return col;
    }) as ColumnDef<T>[];
  }

  let columnKeys: ColumnKey<T>[] = [
    'select',
    'thumbnail',
    '_id',
    'name',
    'articleNumber',
  ];

  if (entityIsSku.value) {
    columnKeys = [
      'select',
      'thumbnail',
      'productId',
      '_id',
      'name',
      'articleNumber',
    ];
    // Only include expander if at least one product has multiple skus
    if (hasMultipleSkus.value) {
      columnKeys.unshift('expander');
    }
  }
  columns = orderAndFilterColumns(columns, columnKeys);
};

watch(
  entities,

  () => {
    setupEntityColumns();
  },
  { immediate: true },
);

let categoriesColumns: ColumnDef<Category>[] = [];
let brandsColumns: ColumnDef<Brand>[] = [];
// Columns for categories
const setupCategoryColumns = () => {
  const {
    getColumns: getCategoryColumns,
    orderAndFilterColumns: orderAndFilterCategoryColumns,
  } = useColumns<Category>();
  const columnOptionsCategories: ColumnOptions<Category> = {
    selectable: true,
  };
  categoriesColumns = getCategoryColumns(
    categories.value,
    columnOptionsCategories,
  );
  categoriesColumns = orderAndFilterCategoryColumns(categoriesColumns, [
    'select',
    '_id',
    'name',
  ]);
};

const setupBrandsColumns = () => {
  const {
    getColumns: getBrandColumns,
    orderAndFilterColumns: orderAndFilterBrandColumns,
  } = useColumns<Brand>();
  const columnOptionsBrands: ColumnOptions<Brand> = {
    selectable: true,
  };
  brandsColumns = getBrandColumns(brands.value, columnOptionsBrands);
  brandsColumns = orderAndFilterBrandColumns(brandsColumns, [
    'select',
    '_id',
    'name',
  ]);
};

if (entityIsProduct.value) {
  watch(
    categories,
    () => {
      setupCategoryColumns();
    },
    { immediate: true },
  );
  watch(
    brands,
    () => {
      setupBrandsColumns();
    },
    { immediate: true },
  );
}

const showSelectedList = ref(true);

const getSkuSubRows = (row: T) => {
  return entityIsSku.value ? (row.skus as T[]) || [] : undefined;
};

const onSelection = (selection: { _id?: string }[]) => {
  const ids = selection.map((s) => s._id);
  currentSelection.value = {
    ...currentSelection.value,
    [currentSelectionGroup.value]: ids,
  };
};
const removeSelected = (id: string) => {
  currentSelection.value = {
    ...currentSelection.value,
    [currentSelectionGroup.value]: currentSelection.value.ids?.filter(
      (i) => i !== id,
    ),
  };
};

const getProductNameByProductId = (productId: string) => {
  const product = entities.value.find((e) => e.productId === productId);
  return product ? product.name : '';
};

const handleSave = () => {
  emit('save', currentSelection.value);
};
const handleCancel = () => {
  currentSelection.value = props.selection;
};
</script>
<template>
  <Sheet>
    <SheetTrigger as-child>
      <slot />
    </SheetTrigger>
    <SheetContent width="wide">
      <SheetHeader>
        <SheetTitle>{{ $t('entity_selection', { entityName }) }}</SheetTitle>
        <SheetDescription>
          {{ $t('selector_panel_description') }}
        </SheetDescription>
      </SheetHeader>
      <SheetBody
        class="p-0 max-md:pb-14 md:flex md:h-[calc(100vh-10.1rem)] md:p-0"
      >
        <div class="w-full shrink-0 px-4 pt-3 md:w-[170px] md:py-3">
          <ContentHeading>{{ $t('select_from') }}</ContentHeading>
          <SidebarNav>
            <SidebarNavItem
              v-for="option in options"
              :id="option.id"
              :key="option.id"
              :current="option.id === currentOption"
              @click="selectOption(option.id)"
            >
              {{ option.label }}
            </SidebarNavItem>
          </SidebarNav>
        </div>
        <div class="@container w-full border-x px-4 py-3">
          <ContentHeading>{{ $t('select') }}</ContentHeading>
          <!-- IDS -->
          <div v-if="currentSelectionGroup === 'ids'">
            <TableView
              :columns="columns"
              :data="entities"
              :entity-name="entityName"
              :show-search="true"
              :pinned-state="{}"
              :selected-ids="selectedIds"
              max-height="calc(100vh - 20rem)"
              :mode="TableMode.Simple"
              :searchable-fields="searchableFields"
              :enable-expanding="entityIsSku && hasMultipleSkus"
              :get-sub-rows="getSkuSubRows"
              @selection="onSelection"
            />
          </div>
          <!-- END IDS -->
          <!-- CATEGORIES -->
          <div v-else-if="currentSelectionGroup === 'categoryIds'">
            <TableView
              :columns="categoriesColumns"
              :data="categories"
              entity-name="category"
              :pinned-state="{}"
              :show-search="true"
              :selected-ids="currentSelection.categoryIds"
              max-height="calc(100vh - 20rem)"
              :mode="TableMode.Simple"
              @selection="onSelection"
            />
          </div>
          <!-- END CATEGORIES -->
          <!-- BRANDS -->
          <div v-else-if="currentSelectionGroup === 'brandIds'">
            <TableView
              :columns="brandsColumns"
              :data="brands"
              entity-name="brand"
              :pinned-state="{}"
              :show-search="true"
              :selected-ids="currentSelection.brandIds"
              max-height="calc(100vh - 20rem)"
              :mode="TableMode.Simple"
              @selection="onSelection"
            />
          </div>
          <!-- END BRANDS -->
        </div>
        <div
          :class="
            cn(
              'max-md:bg-card shrink-0 px-4 py-3 max-md:fixed max-md:bottom-16 max-md:z-50 max-md:w-full max-md:overflow-hidden max-md:border-t max-md:border-b max-md:transition-all md:h-full md:w-[200px] lg:w-80',
              !showSelectedList && 'max-md:max-h-11',
              showSelectedList && 'max-md:max-h-[50vh]',
            )
          "
        >
          <Button
            size="icon"
            variant="outline"
            class="absolute top-1.5 right-3 md:hidden"
            @click="showSelectedList = !showSelectedList"
          >
            <LucideChevronUp
              :class="cn('size-4', { 'rotate-180': showSelectedList })"
            />
          </Button>
          <ContentHeading
            >{{ $t('selected') }} ({{
              selectedEntities.length
            }})</ContentHeading
          >
          <!-- IDS -->
          <ul
            v-if="currentSelectionGroup === 'ids'"
            class="overflow-auto md:h-[calc(100%-26px)]"
          >
            <li
              v-for="entity in selectedEntities"
              :key="entity._id"
              class="flex items-center gap-2.5 py-1.5 text-xs"
            >
              <span class="font-semibold">{{ entity._id }}</span>
              <span v-if="entityIsSku && !entity.isCollapsed" class="truncate"
                >{{ getProductNameByProductId(String(entity.productId)) }} ({{
                  entity.name
                }})</span
              >
              <span v-else class="truncate">{{ entity.name }}</span>
              <Button
                size="icon"
                variant="outline"
                class="hover:text-negative mr-1 ml-auto shrink-0 sm:size-6"
                @click="removeSelected(entity._id)"
              >
                <LucideX class="size-3" />
              </Button>
            </li>
          </ul>
          <!-- END IDS -->
          <!-- CATEGORIES -->
          <ul
            v-else-if="currentSelectionGroup === 'categoryIds'"
            class="overflow-auto md:h-[calc(100%-26px)]"
          >
            <li
              v-for="entity in selectedEntities"
              :key="entity._id"
              class="flex items-center gap-2.5 py-1.5 text-xs"
            >
              <span class="font-semibold">{{ entity._id }}</span>
              <span class="truncate">{{ entity.name }}</span>
              <Button
                size="icon"
                variant="outline"
                class="hover:text-negative mr-1 ml-auto shrink-0 sm:size-6"
                @click="removeSelected(entity._id)"
              >
                <LucideX class="size-3" />
              </Button>
            </li>
          </ul>
          <!-- END CATEGORIES -->
          <!-- BRANDS -->
          <ul
            v-else-if="currentSelectionGroup === 'brandIds'"
            class="overflow-auto md:h-[calc(100%-26px)]"
          >
            <li
              v-for="entity in selectedEntities"
              :key="entity._id"
              class="flex items-center gap-2.5 py-1.5 text-xs"
            >
              <span class="font-semibold">{{ entity._id }}</span>
              <span class="truncate">{{ entity.name }}</span>
              <Button
                size="icon"
                variant="outline"
                class="hover:text-negative mr-1 ml-auto shrink-0 sm:size-6"
                @click="removeSelected(entity._id)"
              >
                <LucideX class="size-3" />
              </Button>
            </li>
          </ul>
          <!-- END BRANDS -->
        </div>
      </SheetBody>
      <SheetFooter>
        <SheetClose as-child>
          <Button variant="outline" @click="handleCancel">
            {{ $t('cancel') }}
          </Button>
        </SheetClose>
        <SheetClose as-child>
          <Button @click="handleSave">
            {{ $t('add_selected') }}
          </Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
