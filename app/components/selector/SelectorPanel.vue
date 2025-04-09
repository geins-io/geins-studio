<script setup lang="ts">
import {
  type SelectorMode,
  SelectorSelectionType,
  TableMode,
} from '#shared/types';

// PROPS
const props = withDefaults(
  defineProps<{
    selection: SelectorSelection;
    mode: SelectorMode;
    currency?: string;
    type?: SelectorSelectionType;
    options: SelectorSelectionOption[];
    entityName: string;
    entities: SelectorEntity[];
  }>(),
  {
    type: SelectorSelectionType.Include,
  },
);

// EMITS
const emit = defineEmits<{
  (event: 'save', selection: SelectorSelection): void;
}>();

// GLOBALS
const { t } = useI18n();
const productsStore = useProductsStore();
const { categories, brands } = storeToRefs(productsStore);

const entityName = toRef(props, 'entityName');
const entities = toRef(props, 'entities');
/* const type = toRef(props, 'type');
const currency = toRef(props, 'currency');
const mode = toRef(props, 'mode'); */
const entityIsProduct = computed(() => entityName.value === 'product');
const currentSelection = ref<SelectorSelection>(
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
//watch options and set new current option to the first if changed
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
const selectedEntities = computed(() => {
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
      return entities.value.filter((e) =>
        currentSelection.value.ids?.includes(e._id),
      );
  }
});
const selectedIds = computed(() => currentSelection.value.ids);

const selectOption = (id: SelectorSelectionOptionsId) => {
  currentOption.value = id;
};

// Columns for Entity
const { getColumns, orderAndFilterColumns } = useColumns();
const columnOptions: ColumnOptions<Product> = {
  selectable: true,
};
let columns = getColumns(entities.value, columnOptions);
if (entityIsProduct.value) {
  columns = orderAndFilterColumns(columns, ['select', '_id', 'name', 'slug']);
}

// watch entitites, if they change, update columns
watchEffect(() => {
  columns = getColumns(entities.value, columnOptions);
  if (entityIsProduct.value) {
    columns = orderAndFilterColumns(columns, ['select', '_id', 'name', 'slug']);
  }
});

// Columns for categories
const columnOptionsCategories: ColumnOptions<Category> = {
  selectable: true,
};
let categoriesColumns = getColumns(categories.value, columnOptionsCategories);
if (entityIsProduct.value) {
  categoriesColumns = orderAndFilterColumns(categoriesColumns, [
    'select',
    '_id',
    'name',
    'slug',
  ]);
}

// Columns for brands
const columnOptionsBrands: ColumnOptions<Brand> = {
  selectable: true,
};
let brandsColumns = getColumns(brands.value, columnOptionsBrands);
if (entityIsProduct.value) {
  brandsColumns = orderAndFilterColumns(brandsColumns, [
    'select',
    '_id',
    'name',
    'slug',
  ]);
}

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
        <SheetTitle>{{ t('entity_selection', { entityName }) }}</SheetTitle>
        <SheetDescription>
          {{ t('selector_panel_description') }}
        </SheetDescription>
      </SheetHeader>
      <div class="flex h-[calc(100vh-10.1rem)] grid-cols-12">
        <div class="w-[170px] shrink-0 px-4 py-3">
          <ContentHeading>{{ t('select_from') }}</ContentHeading>
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
        <div class="w-full border-x px-4 py-3">
          <ContentHeading>{{ t('select') }}</ContentHeading>
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
              :selected-ids="currentSelection.brandIds"
              max-height="calc(100vh - 20rem)"
              :mode="TableMode.Simple"
              @selection="onSelection"
            />
          </div>
          <!-- END BRANDS -->
        </div>
        <div class="h-full w-80 shrink-0 px-4 py-3">
          <ContentHeading>{{ t('selected') }}</ContentHeading>
          <!-- IDS -->
          <ul
            v-if="currentSelectionGroup === 'ids'"
            class="h-[calc(100%-26px)] overflow-auto"
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
                class="ml-auto mr-1 size-5 shrink-0 hover:text-negative"
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
            class="h-[calc(100%-26px)] overflow-auto"
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
                class="ml-auto mr-1 size-5 shrink-0 hover:text-negative"
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
            class="h-[calc(100%-26px)] overflow-auto"
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
                class="ml-auto mr-1 size-5 shrink-0 hover:text-negative"
                @click="removeSelected(entity._id)"
              >
                <LucideX class="size-3" />
              </Button>
            </li>
          </ul>
          <!-- END BRANDS -->
        </div>
      </div>
      <SheetBody>
        <SheetFooter>
          <SheetClose as-child>
            <Button variant="outline" @click="handleCancel">
              {{ t('cancel') }}
            </Button>
          </SheetClose>
          <SheetClose as-child>
            <Button @click="handleSave">
              {{ t('add_selected') }}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetBody>
    </SheetContent>
  </Sheet>
</template>
