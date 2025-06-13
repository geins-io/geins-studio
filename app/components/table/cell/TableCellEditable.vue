<script setup lang="ts" generic="T">
import type { Table, Row, Column } from '@tanstack/vue-table';
const props = defineProps<{
  table: Table<T>;
  row: Row<T>;
  column: Column<T>;
  colKey: string;
  type: EditableColumnType;
  valueDescriptor?: string;
  initialValue?: string | number;
}>();
let value: string | number = String(props.row.getValue(props.colKey));
const valueDesc = ref(props.valueDescriptor);
if (props.type === 'number') {
  value = parseFloat(value);
}
if (props.type === 'percentage') {
  valueDesc.value = '%';
}
const initValue = ref<string | number>(props.initialValue ?? value);
const inputValue = ref<string | number>(initValue.value);
</script>
<template>
  <div>
    <div
      class="flex h-[30px] w-[105px] items-center rounded-lg border bg-input px-2 focus-within:border-primary focus-within:outline-none"
    >
      <label
        :for="`${row.id}-${column.id}-${colKey}`"
        :class="
          cn(
            'mr-2 border-r pr-2 text-xs text-muted-foreground',
            valueDesc ? '' : 'hidden',
          )
        "
      >
        {{ valueDesc || colKey }}
      </label>
      <input
        :id="`${row.id}-${column.id}-${colKey}`"
        v-model="inputValue"
        class="size-full rounded-lg bg-transparent text-xs focus-within:border-transparent focus-within:outline-none"
      />
    </div>
  </div>
</template>
