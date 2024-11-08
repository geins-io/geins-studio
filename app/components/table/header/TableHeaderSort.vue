<script setup lang="ts" generic="T">
import type { Column } from '@tanstack/vue-table';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-vue-next';
import { defineProps } from 'vue';

interface DataTableColumnHeaderProps {
  column: Column<T>;
  title: string;
  className?: string;
}

const props = defineProps<DataTableColumnHeaderProps>();

const handleClick = () => {
  const currentSort = props.column.getIsSorted();
  if (currentSort === 'asc') {
    props.column.toggleSorting(true); // Set to descending
  } else if (currentSort === 'desc') {
    props.column.clearSorting(); // Set to none
  } else {
    props.column.toggleSorting(false); // Set to ascending
  }
};
</script>
<template>
  <Button
    v-if="column.getCanSort()"
    :variant="'ghost'"
    :size="'sm'"
    :class="cn(className, `${column.getIsSorted() ? 'border-border' : ''}`)"
    @click="handleClick"
  >
    {{ title }}
    <ArrowUp v-if="column.getIsSorted() === 'asc'" class="ml-2.5 size-3" />
    <ArrowDown
      v-else-if="column.getIsSorted() === 'desc'"
      class="ml-2.5 size-3"
    />
    <ArrowUpDown v-else class="ml-2.5 size-3 text-muted-foreground" />
  </Button>
</template>
