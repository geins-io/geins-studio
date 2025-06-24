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
  placeholder?: string;
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

const emit = defineEmits<{
  (e: 'change' | 'blur', newValue: string | number, row: Row<T>): void;
}>();

watch(inputValue, (newValue) => {
  if (initValue.value === newValue) return;
  emit('change', newValue, props.row);
});

const handleBlur = () => {
  if (initValue.value !== inputValue.value) {
    initValue.value = inputValue.value;
    emit('blur', inputValue.value, props.row);
  }
};
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
      :placeholder="placeholder"
      @blur="handleBlur"
    >
      <template v-if="valueDesc" #valueDescriptor>
        {{ valueDesc }}
      </template>
    </Input>
  </div>
</template>
