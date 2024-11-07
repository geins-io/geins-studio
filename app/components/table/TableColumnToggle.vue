<script setup lang="ts" generic="TData">
import draggable from 'vuedraggable';
import type { Table } from '@tanstack/vue-table';

import { Settings2, SearchIcon, XIcon, GripVertical } from 'lucide-vue-next';

interface TableColumnToggleProps {
  table: Table<TData>;
  choices?: number;
  staticColumns?: string[];
}
const props = withDefaults(defineProps<TableColumnToggleProps>(), {
  staticColumns: () => ['select', 'actions'],
});

const search = ref('');

const columns = computed(() =>
  props.table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    ),
);

console.log('🚀 ~ columns:', props.table.getAllColumns());

const availableColumns = computed(() =>
  columns.value.filter((column) =>
    column.id.toLowerCase().includes(search.value.toLowerCase()),
  ),
);

const visibleColumns = computed(() =>
  columns.value.filter((column) => column.getIsVisible()),
);

const currentOrder = ref(visibleColumns.value.map((column) => column.id));
console.log('🚀 ~ currentOrder:', currentOrder);
console.log('columOrder', props.table.getState().columnOrder);

// watch visible columns to update current order
watch(visibleColumns, (newColumns) => {
  currentOrder.value = newColumns.map((column) => column.id);
});

const drag = ref(false);

const onDragEnd = (event) => {
  // console.log('🚀 ~ onDragEnd ~ event:', event);
  // const newOrder = event.to.children.map(
  //   (child: HTMLElement) => child.dataset.id,
  // );
  // const newOrder = () => [
  //   'image',
  //   'id',
  //   'name',
  //   'description',
  //   'category',
  //   'categories',
  //   'price',
  // ];
  // props.table.setColumnOrder(newOrder);
};
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <Button variant="secondary" class="ml-auto hidden lg:flex">
        <Settings2 class="mr-2 size-4" />
        Column options
      </Button>
    </SheetTrigger>
    <SheetContent class="w-[784px] bg-card sm:w-[784px] sm:max-w-[784px]">
      <SheetHeader>
        <SheetTitle class="mb-1 text-lg font-semibold"
          >Colums option</SheetTitle
        >
        <SheetDescription class="mb-6 text-sm text-muted-foreground">
          Choose which columns you want to see in this list view
        </SheetDescription>
        <div class="w-full px-4 py-6">
          <div class="grid gap-8 md:grid-cols-2">
            <!-- Available Columns -->
            <div>
              <h4 class="mb-4 text-sm font-medium">Availble colums</h4>
              <div class="relative mb-4">
                <SearchIcon
                  class="absolute left-2 top-2.5 size-4 text-muted-foreground"
                />
                <Input
                  v-model="search"
                  placeholder="Search colums"
                  class="pl-8"
                />
              </div>
              <div class="space-y-3">
                <div
                  v-for="column in columns"
                  :key="column.id"
                  class="flex items-center space-x-2"
                >
                  <Checkbox
                    :id="column.id"
                    :checked="column.getIsVisible()"
                    @update:checked="
                      (value) => column.toggleVisibility(!!value)
                    "
                  />
                  <label
                    :for="column.id"
                    class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {{ column.id }}
                  </label>
                </div>
              </div>
            </div>

            <!-- Chosen Columns -->
            <div>
              <h4 class="mb-4 text-sm font-medium">Chosen columns</h4>
              <draggable
                v-model="currentOrder"
                item-key="id"
                class="space-y-2"
                ghost-class="opacity-50"
                @start="drag = true"
                @end="drag = false"
              >
                <template #item="{ element }">
                  <div
                    class="flex cursor-move items-center justify-between rounded-md bg-background px-4 py-2"
                  >
                    <div class="flex items-center space-x-2">
                      <GripVertical class="size-4 text-muted-foreground" />
                      <span class="text-sm">{{ element }}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-8"
                      @click="element.toggleVisibility()"
                    >
                      <XIcon class="size-4" />
                    </Button>
                  </div>
                </template>
              </draggable>
            </div>
          </div>

          <div class="mt-8 flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Deploy</Button>
          </div>
        </div>
      </SheetHeader>
    </SheetContent>
  </Sheet>
</template>
