<script setup lang="ts">
import {
  fromDate,
  getLocalTimeZone,
  toCalendarDate,
  today as todayDate,
  type CalendarDate,
} from '@internationalized/date';
import { createReusableTemplate, useMediaQuery } from '@vueuse/core';
import type { DashboardPeriodPreset } from '#shared/types';
import { DASHBOARD_PERIOD_PRESETS } from '@/lib/dashboard';
import type { DateRange } from 'reka-ui';

const { t } = useI18n();
const { formatDate } = useDate();
const locale = useCookieLocale();
const { period, setPeriodPreset, setCustomPeriod } = useDashboardFilters();

const [DefineCalendar, ReuseCalendar] = createReusableTemplate();

const timeZone = getLocalTimeZone();
const toCalendar = (date: Date) => toCalendarDate(fromDate(date, timeZone));
const formatDay = (date: Date) =>
  formatDate(date, { day: 'numeric', month: 'short' });

// Wide screens: the custom calendar. Below `lg`: the one-button menu, whose
// presets view turns into the calendar.
const customOpen = ref(false);
const menuOpen = ref(false);
const menuView = ref<'presets' | 'custom'>('presets');
const twoMonths = useMediaQuery('(min-width: 640px)');

// The calendar starts on the current period, as in the prototype
const draft = shallowRef<DateRange>({ start: undefined, end: undefined });
const maxDate = shallowRef<CalendarDate>(todayDate(timeZone));
const resetDraft = () => {
  draft.value = {
    start: toCalendar(period.value.from),
    end: toCalendar(period.value.to),
  };
  maxDate.value = todayDate(timeZone);
};
// The last month in view is the period's end, so past periods aren't
// spent showing next month
const firstMonth = computed(() => {
  const end = draft.value.end ?? maxDate.value;
  return twoMonths.value ? end.subtract({ months: 1 }) : end;
});

watch(customOpen, (open) => {
  if (open) resetDraft();
});
watch(menuOpen, (open) => {
  if (!open) return;
  menuView.value = 'presets';
  resetDraft();
});

const pickPreset = (preset: DashboardPeriodPreset) => {
  setPeriodPreset(preset);
  menuOpen.value = false;
};
const applyCustom = () => {
  const { start, end } = draft.value;
  if (!start || !end) return;
  setCustomPeriod(start.toDate(timeZone), end.toDate(timeZone));
  customOpen.value = false;
  menuOpen.value = false;
};
// The menu goes back to its presets; the wide popover closes
const cancelCustom = () => {
  customOpen.value = false;
  menuView.value = 'presets';
  resetDraft();
};

const draftLabel = computed(() => {
  const { start, end } = draft.value;
  if (!start) return t('dashboards.period.pick_range');
  const from = formatDay(start.toDate(timeZone));
  return end ? `${from} – ${formatDay(end.toDate(timeZone))}` : from;
});
const customLabel = computed(() =>
  period.value.preset === 'custom'
    ? `${formatDay(period.value.from)} – ${formatDay(period.value.to)}`
    : t('dashboards.period.custom'),
);
const currentLabel = computed(() => {
  const preset = DASHBOARD_PERIOD_PRESETS.find(
    (p) => p.key === period.value.preset,
  );
  return preset ? t(preset.labelKey) : customLabel.value;
});

const segmentClass = (active: boolean) =>
  cn(
    'focus-visible:ring-ring inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:outline-hidden',
    active
      ? 'bg-card text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground',
  );
const menuItemClass =
  'hover:bg-accent hover:text-accent-foreground flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm';
</script>

<template>
  <DefineCalendar>
    <RangeCalendar
      v-model="draft"
      :locale="locale"
      :week-starts-on="1"
      :number-of-months="twoMonths ? 2 : 1"
      :default-placeholder="firstMonth"
      :max-value="maxDate"
    />
    <div class="flex items-center justify-between gap-3 border-t p-3">
      <span class="text-muted-foreground text-xs">{{ draftLabel }}</span>
      <div class="flex shrink-0 gap-2">
        <Button size="sm" variant="ghost" @click="cancelCustom">
          {{ t('cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="!draft.start || !draft.end"
          @click="applyCustom"
        >
          {{ t('apply') }}
        </Button>
      </div>
    </div>
  </DefineCalendar>

  <!-- A toggle group, not tabs: there are no panels to switch between. Shown
       by the filter row's width (`@container`), not the viewport's: the
       sidebar narrows the row and the Swedish labels need ~1000px. -->

  <div
    role="group"
    :aria-label="t('dashboards.period.label')"
    class="bg-secondary hidden max-w-full items-center gap-0.5 overflow-x-auto rounded-lg p-1 @5xl:inline-flex"
    data-test="dashboard-period-bar"
  >
    <button
      v-for="item in DASHBOARD_PERIOD_PRESETS"
      :key="item.key"
      type="button"
      :aria-pressed="period.preset === item.key"
      :class="segmentClass(period.preset === item.key)"
      @click="setPeriodPreset(item.key)"
    >
      {{ t(item.labelKey) }}
    </button>
    <Popover v-model:open="customOpen">
      <PopoverTrigger as-child>
        <button
          type="button"
          :aria-pressed="period.preset === 'custom'"
          :class="segmentClass(period.preset === 'custom')"
        >
          <LucideCalendarDays class="size-4" aria-hidden="true" />
          {{ customLabel }}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" class="w-auto p-0">
        <ReuseCalendar />
      </PopoverContent>
    </Popover>
  </div>

  <!-- Narrow screens: one button with a menu, never sideways scrolling -->
  <Popover v-model:open="menuOpen">
    <PopoverTrigger as-child>
      <Button
        variant="secondary"
        class="shrink-0 gap-1.5 @5xl:hidden"
        :aria-label="t('dashboards.period.current', { period: currentLabel })"
        data-test="dashboard-period-menu"
      >
        <LucideCalendarDays
          class="text-muted-foreground size-4"
          aria-hidden="true"
        />
        {{ currentLabel }}
        <LucideChevronDown class="size-3.5 opacity-60" aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      :class="menuView === 'custom' ? 'w-auto p-0' : 'w-56 p-1.5'"
    >
      <div v-if="menuView === 'presets'" class="flex flex-col">
        <button
          v-for="item in DASHBOARD_PERIOD_PRESETS"
          :key="item.key"
          type="button"
          :aria-pressed="period.preset === item.key"
          :class="menuItemClass"
          @click="pickPreset(item.key)"
        >
          {{ t(item.labelKey) }}
          <LucideCheck
            v-if="period.preset === item.key"
            class="size-4"
            aria-hidden="true"
          />
        </button>
        <Separator class="my-1" />
        <button
          type="button"
          :aria-pressed="period.preset === 'custom'"
          :class="menuItemClass"
          @click="menuView = 'custom'"
        >
          {{ t('dashboards.period.custom_range') }}
          <LucideCheck
            v-if="period.preset === 'custom'"
            class="size-4"
            aria-hidden="true"
          />
        </button>
      </div>
      <ReuseCalendar v-else />
    </PopoverContent>
  </Popover>
</template>
