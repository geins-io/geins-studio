<script setup lang="ts" generic="T">
import type { Table, Row, Column } from '@tanstack/vue-table';
const props = defineProps<{
  table: Table<T>;
  row: Row<T>;
  column: Column<T>;
  colKey: string;
  type: EditableColumnType;
}>();

const initialValue = props.row.getValue(props.colKey);
const inputValue = ref<string>(String(initialValue));

const accountStore = useAccountStore();
const { currentCurrency } = storeToRefs(accountStore);

const valueTypeIcon = computed(() => {
  switch (props.type) {
    case 'currency':
      return currentCurrency.value;
    case 'percentage':
      return '%';
    default:
      return '';
  }
});
</script>
<template>
  <div>
    <div
      class="flex h-[30px] w-[105px] items-center rounded-lg border bg-input px-2 focus-within:border-primary focus-within:outline-none"
    >
      <span v-if="valueTypeIcon" class="mr-2 border-r pr-2 text-xs">
        {{ valueTypeIcon }}
      </span>
      <input
        v-model="inputValue"
        class="size-full rounded-lg bg-transparent text-xs focus-within:border-transparent focus-within:outline-none"
      />
    </div>
  </div>
</template>
