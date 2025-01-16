<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    selection: SelectorSelection;
    currency?: string;
    type?: SelectorSelectionType;
    options?: SelectorSelectionOption[];
  }>(),
  {
    type: 'include',
    options: () => [
      {
        id: 'product',
        label: 'Products',
        group: 'ids',
      },
      {
        id: 'category',
        label: 'Categories',
        group: 'categories',
      },
      {
        id: 'brand',
        label: 'Brands',
        group: 'brands',
      },
      {
        id: 'price',
        label: 'Prices',
        group: 'price',
      },
      {
        id: 'stock',
        label: 'Stock',
        group: 'stock',
      },
      {
        id: 'import',
        label: 'Import',
        group: 'ids',
      },
    ],
  },
);

const currentSelection = ref(props.selection);
const currentOption = ref(props.options?.[0]?.id ?? '');
const currentSelectionGroup = computed(
  () => props.options.find((o) => o.id === currentOption.value)?.group || 'ids',
);

const selectOption = (id: SelectorSelectionOptionsId) => {
  currentOption.value = id;
};

const { products } = useProductsStore();
const entityName = 'product';
const { getColumns, orderAndFilterColumns } = useColumns();
const columnOptions: ColumnOptions<Product> = {
  selectable: true,
};
let columns = getColumns(products, columnOptions);
columns = orderAndFilterColumns(columns, [
  'select',
  'image',
  'id',
  'name',
  'price',
]);

const onSelection = (selection: object[]) => {
  currentSelection.value = {
    ...currentSelection.value,
    [currentSelectionGroup.value]: selection,
  };
  console.log(
    '🚀 ~ onSelection ~ currentSelection.value:',
    currentSelection.value,
  );
};
</script>
<template>
  <Sheet>
    <SheetTrigger as-child>
      <slot />
    </SheetTrigger>
    <SheetContent width="wide">
      <SheetHeader>
        <SheetTitle>Product selection</SheetTitle>
        <SheetDescription> Make your selection </SheetDescription>
      </SheetHeader>
      <div class="grid h-full grid-cols-6 rounded-lg border">
        <div class="flex flex-col p-2">
          <ContentHeading>Select from</ContentHeading>
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
        <div class="col-span-4 flex flex-col border-x p-2">
          <ContentHeading>Select</ContentHeading>
          <!-- PRODUCT -->
          <div v-if="currentOption === 'product'">
            <TableView
              :columns="columns"
              :data="products"
              :entity-name="entityName"
              :page-size="20"
              :show-search="true"
              :pinned-state="{}"
              max-height="calc(100vh - 23rem)"
              mode="simple"
              @selection="onSelection"
            />
          </div>
          <!-- END PRODUCT -->
        </div>
        <div class="flex flex-col p-2">
          <ContentHeading>Selected</ContentHeading>
        </div>
      </div>
      <SheetBody>
        <SheetFooter>
          <SheetClose as-child>
            <Button variant="outline"> Cancel </Button>
          </SheetClose>
          <SheetClose as-child>
            <Button>Add selected</Button>
          </SheetClose>
        </SheetFooter>
      </SheetBody>
    </SheetContent>
  </Sheet>
</template>
