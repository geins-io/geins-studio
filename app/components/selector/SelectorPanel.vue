<script setup lang="ts">
const _props = withDefaults(
  defineProps<{
    selection: SelectorSelection;
    currency?: string;
    type?: SelectorSelectionType;
    options?: SelectorSelectionOption[];
  }>(),
  {
    type: 'include',
  },
);
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
            <SidebarNavItem id="product">Products</SidebarNavItem>
            <SidebarNavItem id="category">Categories</SidebarNavItem>
            <SidebarNavItem id="brand">Brands</SidebarNavItem>
            <SidebarNavItem id="price">Product prices</SidebarNavItem>
            <SidebarNavItem id="stock">Stock</SidebarNavItem>
            <SidebarNavItem id="import">Import</SidebarNavItem>
          </SidebarNav>
        </div>
        <div class="col-span-3 flex flex-col border-x p-2">
          <ContentHeading>Select</ContentHeading>
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
