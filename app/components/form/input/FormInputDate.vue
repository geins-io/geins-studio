<script setup lang="ts">
import type { DateValue } from 'reka-ui';
import { getLocalTimeZone } from '@internationalized/date';
import { useDateFormatter } from 'reka-ui';
import { toDate } from 'reka-ui/date';

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    minValue?: DateValue;
    maxValue?: DateValue;
    disabled?: boolean;
  }>(),
  {
    placeholder: undefined,
    minValue: undefined,
    maxValue: undefined,
    disabled: false,
  },
);

const modelValue = defineModel<DateValue | undefined>();
const open = ref(false);

const formatter = useDateFormatter(getLocalTimeZone());

const displayValue = computed(() => {
  if (!modelValue.value) return null;
  return formatter.custom(toDate(modelValue.value), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :disabled="disabled"
        :class="
          cn(
            'w-full justify-start text-left font-normal',
            !modelValue && 'text-muted-foreground',
          )
        "
      >
        <LucideCalendar class="mr-2 size-4 shrink-0" />
        <span>{{ displayValue ?? placeholder ?? $t('select') }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        v-model="modelValue"
        layout="month-and-year"
        :min-value="minValue"
        :max-value="maxValue"
        @update:model-value="open = false"
      />
    </PopoverContent>
  </Popover>
</template>
