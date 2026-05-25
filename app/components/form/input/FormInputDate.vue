<script setup lang="ts">
import { cn } from '@/utils/index';
import type { DateValue } from '@internationalized/date';

const model = defineModel<string>();

withDefaults(
  defineProps<{
    placeholder?: string;
    minValue?: DateValue;
    allowClear?: boolean;
  }>(),
  {
    placeholder: 'Pick a date',
    allowClear: false,
  },
);

const { t } = useI18n();
const { formatDate } = useDate();

const handleDateUpdate = (v: unknown) => {
  model.value = v ? new Date(v.toString()).toISOString() : '';
};

const clearDate = (e: Event) => {
  e.stopPropagation();
  e.preventDefault();
  model.value = '';
};
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="
          cn(
            'bg-input focus-within:border-primary hover:bg-input h-10 w-full rounded-lg border px-3 text-left text-sm font-normal transition-colors',
            !model && 'text-muted-foreground',
          )
        "
      >
        <span>
          {{ model ? formatDate(model) : placeholder }}
        </span>
        <span
          v-if="allowClear && model"
          role="button"
          tabindex="0"
          :aria-label="t('clear_date')"
          class="text-muted-foreground hover:text-foreground ml-auto inline-flex size-5 items-center justify-center rounded transition-colors"
          @click="clearDate"
          @keydown.enter.prevent="clearDate"
          @keydown.space.prevent="clearDate"
        >
          <LucideX class="size-4" />
        </span>
        <LucideCalendar v-else class="ml-auto size-4 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar
        layout="month-and-year"
        :min-value="minValue"
        @update:model-value="handleDateUpdate"
      />
    </PopoverContent>
  </Popover>
</template>
