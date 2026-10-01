<script setup lang="ts" generic="TFilters extends object">
import {
  fromDate,
  getLocalTimeZone,
  toCalendarDate,
  type DateValue,
} from '@internationalized/date';
import type {
  ListDateRangePreset,
  ListFilterDateRangeDefinition,
} from '#shared/types';
import type { ListFilterEditor } from '@/composables/useListFilters';
import type { DateRange } from 'reka-ui';

type Choice = ListDateRangePreset | 'custom';

const props = defineProps<{
  definition: ListFilterDateRangeDefinition<TFilters>;
  listFilters: ListFilterEditor<TFilters>;
}>();

const { t } = useI18n();
const { formatDate } = useDate();
const locale = useCookieLocale();

const choices: { value: Choice; label: string }[] = [
  { value: 'today', label: 'today' },
  { value: 'week', label: 'this_week' },
  { value: 'month', label: 'this_month' },
  { value: 'custom', label: 'custom_range' },
];

const range = computed(() => props.listFilters.range(props.definition.name));

// "Custom range" is picked before any dates exist, so it can't live in the
// filter value alone.
const customPicked = ref(false);
watch(range, (value) => {
  if (!value) customPicked.value = false;
});

const isChoice = (value: unknown): value is Choice =>
  choices.some((c) => c.value === value);

const choice = computed<Choice | undefined>({
  get: () => {
    if (customPicked.value) return 'custom';
    if (range.value?.preset) return range.value.preset;
    return range.value?.from || range.value?.to ? 'custom' : undefined;
  },
  set: (value) => {
    if (!value) return;
    customPicked.value = value === 'custom';
    if (value !== 'custom')
      props.listFilters.setRange(props.definition.name, { preset: value });
  },
});

const timeZone = getLocalTimeZone();
const toDateValue = (iso?: string): DateValue | undefined =>
  iso ? toCalendarDate(fromDate(new Date(iso), timeZone)) : undefined;

const calendarValue = shallowRef<DateRange>({
  start: undefined,
  end: undefined,
});
watch(
  range,
  (value) => {
    if (value?.preset) return;
    calendarValue.value = {
      start: toDateValue(value?.from),
      end: toDateValue(value?.to),
    };
  },
  { immediate: true },
);

// Written once both ends are picked; `to` covers the whole last day.
const onCalendarUpdate = (value: DateRange) => {
  calendarValue.value = value;
  if (!value.start || !value.end) return;
  const to = value.end.toDate(timeZone);
  to.setHours(23, 59, 59, 999);
  props.listFilters.setRange(props.definition.name, {
    from: value.start.toDate(timeZone).toISOString(),
    to: to.toISOString(),
  });
};

const customSummary = computed(() => {
  const value = range.value;
  if (!value || value.preset || (!value.from && !value.to)) return '';
  const format = (iso?: string) =>
    iso ? formatDate(iso, { dateStyle: 'medium' }) : '…';
  return `${format(value.from)} – ${format(value.to)}`;
});
</script>

<template>
  <div class="px-3 py-2">
    <RadioGroup
      :model-value="choice"
      class="gap-0.5"
      @update:model-value="(value) => isChoice(value) && (choice = value)"
    >
      <label
        v-for="item in choices"
        :key="item.value"
        class="hover:bg-muted flex cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-sm"
      >
        <RadioGroupItem :value="item.value" />
        <span>{{ t(item.label) }}</span>
        <span
          v-if="item.value === 'custom' && customSummary"
          class="text-muted-foreground ml-auto text-xs"
        >
          {{ customSummary }}
        </span>
      </label>
    </RadioGroup>
    <RangeCalendar
      v-if="choice === 'custom'"
      :model-value="calendarValue"
      :locale="locale"
      :week-starts-on="1"
      class="mt-1 border-t px-0 pb-0"
      @update:model-value="onCalendarUpdate"
    />
  </div>
</template>
