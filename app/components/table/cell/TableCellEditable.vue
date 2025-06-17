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
    <Label :for="`${row.id}-${column.id}-${colKey}`" class="hidden">
      >
      {{ colKey }}
    </Label>
    <Input
      :id="`${row.id}-${column.id}-${colKey}`"
      v-model="inputValue"
      size="sm"
      :valid="true"
      class="w-full min-w-[105px]"
    >
      <template v-if="valueDesc" #valueDescriptor>
        {{ valueDesc }}
      </template>
    </Input>
  </div>
</template>
