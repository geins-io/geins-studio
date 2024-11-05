<script setup lang="ts" generic="TData">
import type { Table } from '@tanstack/vue-table';
import { ListTodo } from 'lucide-vue-next';

interface TableColumnToggleProps {
  table: Table<TData>;
  choices?: number;
}

const props = defineProps<TableColumnToggleProps>();

const columns = computed(() =>
  props.table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    ),
);
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="secondary" class="ml-auto hidden lg:flex">
        <ListTodo class="mr-2 size-4" />
        Toggle columns
        <Badge v-if="choices" class="ml-2">
          {{ choices }}
        </Badge>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-[150px]">
      <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
      <DropdownMenuSeparator />

      <DropdownMenuCheckboxItem
        v-for="column in columns"
        :key="column.id"
        class="capitalize"
        :checked="column.getIsVisible()"
        @update:checked="(value) => column.toggleVisibility(!!value)"
      >
        {{ column.id }}
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
