<script setup lang="ts" generic="T">
import type { Column } from '@tanstack/vue-table';

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
    <div
      class="ml-1 flex size-5 flex-col items-center gap-0.5 text-muted-foreground"
    >
      <LucideChevronUp
        :class="
          cn(
            `${column.getIsSorted() === 'desc' ? 'text-muted' : ''}`,
            `${column.getIsSorted() === 'asc' ? 'text-primary' : ''}`,
            '-mb-1',
          )
        "
      />
      <LucideChevronDown
        :class="
          cn(
            `${column.getIsSorted() === 'desc' ? 'text-primary' : ''}`,
            `${column.getIsSorted() === 'asc' ? 'text-muted' : ''}`,
            '-mt-1',
          )
        "
      />
    </div>
  </Button>
</template>
