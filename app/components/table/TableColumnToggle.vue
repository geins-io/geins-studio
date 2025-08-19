<script setup lang="ts" generic="TData">
import draggable from 'vuedraggable';
import type { Table, Column } from '@tanstack/vue-table';

interface TableColumnToggleProps {
  table: Table<TData>;
  staticColumns?: string[];
}
const props = withDefaults(defineProps<TableColumnToggleProps>(), {
  staticColumns: () => ['select', 'actions'],
});

const columns = computed(() =>
  props.table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    ),
);

const selectableColumns = ref(
  columns.value.map((column) => {
    return {
      ...column,
      isVisible: column.getIsVisible(),
    };
  }),
);

const setIsVisible = (id: string, isVisible: boolean) => {
  const column = selectableColumns.value.find((column) => column.id === id);
  if (column) {
    column.isVisible = isVisible;
  }
};

const visibleColumns = computed(() =>
  selectableColumns.value.filter((column) => column.isVisible),
);

const mapColumns = (columns: Column<TData>[]) =>
  columns.map((column) => {
    return { id: column.id, title: column?.columnDef.meta?.title };
  });

const orderColumns = (
  columns: Column<TData>[],
  order: Record<number, string>,
) => {
  const orderedColumns = [];
  const orderedColumnIds = new Set(Object.values(order));

  // Add columns based on the order array
  for (const key in order) {
    const column = columns.find((col) => col.id === order[key]);
    if (column) {
      orderedColumns.push(column);
    }
  }

  // Add any additional columns that are not in the order array
  columns.forEach((column) => {
    if (!orderedColumnIds.has(column.id)) {
      orderedColumns.push(column);
    }
  });

  return orderedColumns;
};

const orderFromState = props.table.getState().columnOrder;
const currentOrder = ref(
  mapColumns(
    orderColumns(visibleColumns.value as Column<TData>[], orderFromState),
  ),
);

watch(visibleColumns, (newColumns) => {
  // if there is already a column order, first order the columns according to that
  const orderedNewColumns = orderColumns(
    newColumns as Column<TData>[],
    currentOrder.value.reduce(
      (acc, col, index) => {
        acc[index] = col.id;
        return acc;
      },
      {} as Record<number, string>,
    ),
  );
  currentOrder.value = mapColumns(orderedNewColumns);
});

const hideProductColumn = (id: string) => {
  const column = selectableColumns.value.find((column) => column.id === id);
  if (column) {
    column.isVisible = false;
  }
};

const saveOrderAndVisibility = () => {
  const newOrder = currentOrder.value.map((column) => column.id);
  newOrder.unshift('select');
  newOrder.push('actions');
  props.table.setColumnOrder(newOrder);
  selectableColumns.value.forEach((col) => {
    const newVisibility = col.isVisible;
    const column = props.table.getColumn(col.id);
    column?.toggleVisibility(newVisibility);
  });
};

const resetOrderAndVisibility = () => {
  selectableColumns.value = columns.value.map((column) => {
    return {
      ...column,
      isVisible: column.getIsVisible(),
    };
  });
  currentOrder.value = mapColumns(visibleColumns.value as Column<TData>[]);
};
</script>

<template>
  <Sheet>
    <SheetTrigger as-child>
      <ButtonIcon
        icon="settings"
        variant="secondary"
        class="ml-auto hidden lg:flex"
      >
        Column options
      </ButtonIcon>
    </SheetTrigger>
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>Colums option</SheetTitle>
        <SheetDescription>
          Choose which columns you want to see in this list view
        </SheetDescription>
      </SheetHeader>
      <SheetBody class="grid p-4 md:grid-cols-2">
        <!-- Available Columns -->
        <div class="mr-8 border-r pr-8">
          <h4 class="mb-4 text-base font-semibold">Availble colums</h4>
          <!--      <div class="relative mb-4">
                <SearchIcon
                  class="absolute left-2 top-2.5 size-4 text-muted-foreground"
                />
                <Input
                  v-model="search"
                  placeholder="Search colums"
                  class="pl-8"
                />
              </div> -->
          <div class="space-y-4">
            <div
              v-for="column in selectableColumns"
              :key="column.id"
              class="flex items-center space-x-3"
            >
              <Checkbox
                :id="column.id"
                :model-value="column.isVisible"
                @update:model-value="setIsVisible(column.id, !!$event)"
              />
              <label
                :for="column.id"
                class="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {{ column.columnDef.meta?.title }}
              </label>
            </div>
          </div>
        </div>

        <!-- Chosen Columns -->
        <div>
          <h4 class="mb-4 text-base font-semibold">Chosen columns</h4>
          <draggable
            v-model="currentOrder"
            item-key="id"
            class="space-y-2"
            ghost-class="opacity-50"
          >
            <template #item="{ element }">
              <div
                class="bg-background flex cursor-move items-center justify-between rounded-md px-4 py-2"
              >
                <div class="flex items-center space-x-2">
                  <LucideGripVertical class="text-muted-foreground size-4" />
                  <span class="text-sm">{{ element.title }}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  @click="hideProductColumn(element.id)"
                >
                  <LucideX class="size-4" />
                </Button>
              </div>
            </template>
          </draggable>
        </div>
      </SheetBody>
      <SheetFooter>
        <SheetClose as-child>
          <Button variant="outline" @click="resetOrderAndVisibility">
            Cancel
          </Button>
        </SheetClose>
        <SheetClose as-child>
          <Button @click="saveOrderAndVisibility">Save options</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
