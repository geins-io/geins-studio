<script setup lang="ts">
import { cn } from '@/utils/index';

const model = defineModel<string>();

withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  {
    placeholder: 'Pick a date',
  },
);

const { formatDate } = useDate();

const handleDateUpdate = (v: unknown) => {
  if (v) {
    model.value = new Date(v.toString()).toISOString();
  }
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
        <LucideCalendar class="ml-auto size-4 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar
        layout="month-and-year"
        @update:model-value="handleDateUpdate"
      />
    </PopoverContent>
  </Popover>
</template>
