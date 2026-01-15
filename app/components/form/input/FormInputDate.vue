<script setup lang="ts">
import { CalendarIcon } from 'lucide-vue-next';
import { DateFormatter } from '@internationalized/date';
import { cn } from '@/utils/index';

const model = defineModel<string>();

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    locale?: string;
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
  }>(),
  {
    placeholder: 'Pick a date',
    locale: 'en-US',
    dateStyle: 'long',
  },
);

const df = new DateFormatter(props.locale, {
  dateStyle: props.dateStyle,
});

const handleDateUpdate = (v: any) => {
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
          {{ model ? df.format(new Date(model)) : placeholder }}
        </span>
        <CalendarIcon class="ml-auto size-4 opacity-50" />
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
