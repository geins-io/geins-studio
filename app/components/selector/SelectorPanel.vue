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
        selection: 'ids',
      },
      {
        id: 'category',
        label: 'Categories',
        selection: 'categories',
      },
      {
        id: 'brand',
        label: 'Brands',
        selection: 'brands',
      },
      {
        id: 'price',
        label: 'Prices',
        selection: 'price',
      },
      {
        id: 'stock',
        label: 'Stock',
        selection: 'stock',
      },
      {
        id: 'import',
        label: 'Import',
        selection: 'ids',
      },
    ],
  },
);

const currentOption = ref(props.options?.[0]?.id ?? '');

const selectOption = (id: SelectorSelectionOptionsId) => {
  currentOption.value = id;
};

const { products } = useProductsStore();
const entityName = 'product';
const { getColumns } = useColumns();
const columnOptions: ColumnOptions<Product> = {
  selectable: true,
  columnTitles: { price: 'Default price' },
  columnTypes: { price: 'currency', image: 'image' },
};
const columns = getColumns(products, columnOptions);
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
      <div class="grid h-full grid-cols-5 rounded-lg border">
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
        <div class="col-span-3 flex flex-col border-x p-2">
          <ContentHeading>Select</ContentHeading>
          <!-- PRODUCT -->
          <div v-if="currentOption === 'product'">
            <TableView
              :columns="columns"
              :data="products"
              :entity-name="entityName"
              mode="simple"
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
