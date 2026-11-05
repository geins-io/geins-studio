<script setup lang="ts" generic="T">
import { createReusableTemplate } from '@vueuse/core';
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
  /** Disables the input; a function decides per row. */
  disabled?: boolean | ((row: Row<T>) => boolean);
  /** Tooltip on the disabled input, saying why. */
  disabledTooltip?: string;
  /** Shows the input's loader; a function decides per row. */
  loading?: boolean | ((row: Row<T>) => boolean);
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

const isDisabled = computed(() =>
  typeof props.disabled === 'function'
    ? props.disabled(props.row)
    : !!props.disabled,
);

const isLoading = computed(() =>
  typeof props.loading === 'function'
    ? props.loading(props.row)
    : !!props.loading,
);

const [DefineInput, ReuseInput] = createReusableTemplate();

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
    <DefineInput>
      <Input
        :id="`${row.id}-${column.id}-${colKey}`"
        v-model="inputValue"
        size="sm"
        :valid="true"
        class="w-full min-w-[105px]"
        :placeholder="placeholder"
        :disabled="isDisabled"
        :loading="isLoading"
        @blur="handleBlur"
        @keydown.enter.prevent="$event.target?.blur()"
      >
        <template v-if="valueDesc" #valueDescriptor>
          {{ valueDesc }}
        </template>
      </Input>
    </DefineInput>
    <Label :for="`${row.id}-${column.id}-${colKey}`" class="hidden">
      >
      {{ colKey }}
    </Label>
    <!-- A disabled input fires no pointer events, so the span is the trigger. -->
    <TooltipProvider v-if="isDisabled && disabledTooltip" :delay-duration="100">
      <Tooltip>
        <TooltipTrigger as-child>
          <span class="block">
            <ReuseInput />
          </span>
        </TooltipTrigger>
        <TooltipContent>{{ disabledTooltip }}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <ReuseInput v-else />
  </div>
</template>
