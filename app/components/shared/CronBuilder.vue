<script setup lang="ts">
import cronstrue from 'cronstrue';
import 'cronstrue/locales/sv';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
  }>(),
  {
    modelValue: '',
    placeholder: '0 * * * * *',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// When bound via vee-validate's `componentField`, the field's native `onChange`/
// `onInput` handlers would otherwise fall through onto this component's root. reka's
// <Select> renders a hidden BubbleSelect that dispatches a bubbling native `change`
// carrying the raw field value (e.g. "16"); caught by that fallthrough handler it
// overwrites the bound cron with the raw value. This component syncs only via
// `update:modelValue`, so it must not inherit stray native listeners.
defineOptions({ inheritAttrs: false });

const { locale, t } = useI18n();

type Frequency =
  | 'every-minute'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'custom';

// `label` holds an i18n key (resolved with $t in the template), not display text.
const PRESETS: Record<string, { label: string; cron: string }> = {
  'every-minute': { label: 'cron.every_minute', cron: '0 * * * * *' },
  hourly: { label: 'cron.every_hour', cron: '0 0 * * * *' },
  daily: { label: 'cron.every_day', cron: '0 0 0 * * *' },
  weekly: { label: 'cron.every_week', cron: '0 0 0 * * 1' },
  monthly: { label: 'cron.every_month', cron: '0 0 0 1 * *' },
  custom: { label: 'cron.custom', cron: '' },
};

const DAYS = [
  { value: 0, label: 'cron.days.sun' },
  { value: 1, label: 'cron.days.mon' },
  { value: 2, label: 'cron.days.tue' },
  { value: 3, label: 'cron.days.wed' },
  { value: 4, label: 'cron.days.thu' },
  { value: 5, label: 'cron.days.fri' },
  { value: 6, label: 'cron.days.sat' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));
const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));

const showAdvanced = ref(false);
const rawInput = ref(props.modelValue);

const frequency = ref<Frequency>('every-minute');
const selectedMinute = ref(0);
const selectedHour = ref(0);
const selectedDays = ref<number[]>([1]);
const selectedDayOfMonth = ref(1);
const lastDayOfMonth = ref(false);

const isInt = (v: string) => /^\d+$/.test(v);
const isIntList = (v: string) => v.split(',').every(isInt);
const toInt = (v: string, fallback: number) => {
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
};

// Recognize a preset by cron *shape* (seconds fixed at 0, month = *), not by an
// exact string match. A customized preset like `0 16 * * * *` (hourly at minute 16)
// must stay on its preset tab instead of falling through to the raw "custom" editor
// — otherwise it renders as custom on reload, and the edit round-trip flips to
// custom and leaks the bare field value. Fields with ranges/steps/lists the builder
// can't represent still fall through to custom.
function parseCronToState(cron: string) {
  if (!cron) return;
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 6) {
    frequency.value = 'custom';
    rawInput.value = cron;
    return;
  }

  const [, min, hour, dom, month, dow] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];

  if (month === '*') {
    if (hour === '*' && dom === '*' && dow === '*') {
      if (min === '*') {
        frequency.value = 'every-minute';
        return;
      }
      if (isInt(min)) {
        frequency.value = 'hourly';
        selectedMinute.value = toInt(min, 0);
        return;
      }
    } else if (dom === '*' && dow === '*' && isInt(min) && isInt(hour)) {
      frequency.value = 'daily';
      selectedMinute.value = toInt(min, 0);
      selectedHour.value = toInt(hour, 0);
      return;
    } else if (
      dom === '*' &&
      dow !== '*' &&
      isInt(min) &&
      isInt(hour) &&
      isIntList(dow)
    ) {
      frequency.value = 'weekly';
      selectedMinute.value = toInt(min, 0);
      selectedHour.value = toInt(hour, 0);
      selectedDays.value = dow.split(',').map((d) => toInt(d, 0));
      return;
    } else if (
      dow === '*' &&
      (dom === 'L' || isInt(dom)) &&
      isInt(min) &&
      isInt(hour)
    ) {
      frequency.value = 'monthly';
      selectedMinute.value = toInt(min, 0);
      selectedHour.value = toInt(hour, 0);
      lastDayOfMonth.value = dom === 'L';
      if (dom !== 'L') selectedDayOfMonth.value = toInt(dom, 1);
      return;
    }
  }

  frequency.value = 'custom';
  rawInput.value = cron;
}

function buildCron(): string {
  switch (frequency.value) {
    case 'every-minute':
      return '0 * * * * *';
    case 'hourly':
      return `0 ${selectedMinute.value} * * * *`;
    case 'daily':
      return `0 ${selectedMinute.value} ${selectedHour.value} * * *`;
    case 'weekly': {
      const days =
        selectedDays.value.length > 0
          ? [...selectedDays.value].sort((a, b) => a - b).join(',')
          : '1';
      return `0 ${selectedMinute.value} ${selectedHour.value} * * ${days}`;
    }
    case 'monthly': {
      const dom = lastDayOfMonth.value ? 'L' : String(selectedDayOfMonth.value);
      return `0 ${selectedMinute.value} ${selectedHour.value} ${dom} * *`;
    }
    case 'custom':
      return rawInput.value;
  }
}

function emitCron(cron: string) {
  rawInput.value = cron;
  emit('update:modelValue', cron);
}

const description = computed(() => {
  const cron = frequency.value === 'custom' ? rawInput.value : buildCron();
  if (!cron?.trim()) return '';
  try {
    return cronstrue.toString(cron, {
      locale: locale.value,
      use24HourTimeFormat: true,
    });
  } catch {
    return '';
  }
});

const cronError = computed(() => {
  if (frequency.value !== 'custom') return '';
  const cron = rawInput.value?.trim();
  if (!cron) return '';
  try {
    cronstrue.toString(cron);
    return '';
  } catch (err) {
    return err instanceof Error ? err.message : t('cron.invalid_expression');
  }
});

watch(frequency, () => {
  if (frequency.value !== 'custom') {
    emitCron(buildCron());
  }
});

watch(
  [
    selectedMinute,
    selectedHour,
    selectedDays,
    selectedDayOfMonth,
    lastDayOfMonth,
  ],
  () => {
    if (frequency.value !== 'custom') {
      emitCron(buildCron());
    }
  },
  { deep: true },
);

function selectPreset(key: Frequency) {
  // watch(frequency) emits only when the value actually changes, so re-selecting
  // the already-active preset would commit nothing and leave a stale value.
  // Emit here so the model always reflects the clicked preset (harmless
  // duplicate emit when the frequency did change).
  frequency.value = key;
  if (key !== 'custom') {
    emitCron(buildCron());
  }
}

function onRawInput(val: string | number) {
  rawInput.value = String(val);
  emit('update:modelValue', String(val));
}

function toggleDay(day: number) {
  const idx = selectedDays.value.indexOf(day);
  if (idx >= 0) {
    if (selectedDays.value.length > 1) {
      selectedDays.value.splice(idx, 1);
    }
  } else {
    selectedDays.value.push(day);
  }
}

// Reka's <Select> can emit `undefined`/empty on some change interactions; a bare
// `Number(undefined)` yields NaN (corrupting the cron into `0 NaN * * * *`, which
// then fails validation on save) and `Number('')` silently resets to 0. Ignore any
// payload that isn't a real number so a spurious emit can't clobber the value.
function toNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function setMinute(value: unknown) {
  const n = toNumber(value);
  if (n !== null) selectedMinute.value = n;
}
function setHour(value: unknown) {
  const n = toNumber(value);
  if (n !== null) selectedHour.value = n;
}
function setDayOfMonth(value: unknown) {
  const n = toNumber(value);
  if (n !== null) {
    lastDayOfMonth.value = false;
    selectedDayOfMonth.value = n;
  }
}

onMounted(() => {
  if (props.modelValue) {
    parseCronToState(props.modelValue);
    return;
  }
  // No incoming value (e.g. the trigger just switched to Scheduled): commit the
  // default preset so the model matches the highlighted preset. Without this the
  // form's cron stays empty and validation fails on the very first save.
  emitCron(buildCron());
});

watch(
  () => props.modelValue,
  (val) => {
    if (val !== buildCron() && val !== rawInput.value) {
      parseCronToState(val || '');
    }
  },
);
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="(preset, key) in PRESETS"
        :key="key"
        type="button"
        :class="[
          'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
          frequency === key
            ? 'bg-primary text-primary-foreground border-transparent'
            : 'bg-input text-foreground hover:bg-accent border-border',
        ]"
        @click="selectPreset(key as Frequency)"
      >
        {{ $t(preset.label) }}
      </button>
    </div>

    <div v-if="frequency === 'hourly'" class="flex items-center gap-2">
      <span class="text-muted-foreground text-xs">
        {{ $t('cron.at_minute') }}
      </span>
      <Select
        :model-value="String(selectedMinute)"
        @update:model-value="setMinute($event)"
      >
        <SelectTrigger class="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="m in MINUTES"
            :key="m.value"
            :value="String(m.value)"
          >
            {{ m.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div v-if="frequency === 'daily'" class="flex items-center gap-2">
      <span class="text-muted-foreground text-xs">{{ $t('cron.at') }}</span>
      <Select
        :model-value="String(selectedHour)"
        @update:model-value="setHour($event)"
      >
        <SelectTrigger class="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="h in HOURS"
            :key="h.value"
            :value="String(h.value)"
          >
            {{ h.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <span class="text-muted-foreground text-xs">:</span>
      <Select
        :model-value="String(selectedMinute)"
        @update:model-value="setMinute($event)"
      >
        <SelectTrigger class="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="m in MINUTES"
            :key="m.value"
            :value="String(m.value)"
          >
            {{ m.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div v-if="frequency === 'weekly'" class="space-y-2">
      <div class="flex flex-wrap gap-1">
        <button
          v-for="day in DAYS"
          :key="day.value"
          type="button"
          :class="[
            'h-8 w-10 rounded-md border text-xs font-medium transition-colors',
            selectedDays.includes(day.value)
              ? 'bg-primary text-primary-foreground border-transparent'
              : 'bg-input text-foreground hover:bg-accent border-border',
          ]"
          @click="toggleDay(day.value)"
        >
          {{ $t(day.label) }}
        </button>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground text-xs">{{ $t('cron.at') }}</span>
        <Select
          :model-value="String(selectedHour)"
          @update:model-value="setHour($event)"
        >
          <SelectTrigger class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="h in HOURS"
              :key="h.value"
              :value="String(h.value)"
            >
              {{ h.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <span class="text-muted-foreground text-xs">:</span>
        <Select
          :model-value="String(selectedMinute)"
          @update:model-value="setMinute($event)"
        >
          <SelectTrigger class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="m in MINUTES"
              :key="m.value"
              :value="String(m.value)"
            >
              {{ m.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div v-if="frequency === 'monthly'" class="space-y-2">
      <div class="flex items-center gap-2">
        <button
          type="button"
          :class="[
            'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
            lastDayOfMonth
              ? 'bg-primary text-primary-foreground border-transparent'
              : 'bg-input text-foreground hover:bg-accent border-border',
          ]"
          @click="lastDayOfMonth = true"
        >
          {{ $t('cron.last_day') }}
        </button>
        <span class="text-muted-foreground text-xs">
          {{ $t('cron.or_on_day') }}
        </span>
        <Select
          :model-value="String(selectedDayOfMonth)"
          @update:model-value="setDayOfMonth($event)"
        >
          <SelectTrigger class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="d in 31" :key="d" :value="String(d)">
              {{ d }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p
        v-if="!lastDayOfMonth && selectedDayOfMonth >= 29"
        class="flex items-center gap-1 text-xs text-amber-600"
      >
        <LucideTriangleAlert class="h-3 w-3 shrink-0" />
        {{ $t('cron.day_missing_warning', { day: selectedDayOfMonth }) }}
      </p>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground text-xs">{{ $t('cron.at') }}</span>
        <Select
          :model-value="String(selectedHour)"
          @update:model-value="setHour($event)"
        >
          <SelectTrigger class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="h in HOURS"
              :key="h.value"
              :value="String(h.value)"
            >
              {{ h.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <span class="text-muted-foreground text-xs">:</span>
        <Select
          :model-value="String(selectedMinute)"
          @update:model-value="setMinute($event)"
        >
          <SelectTrigger class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="m in MINUTES"
              :key="m.value"
              :value="String(m.value)"
            >
              {{ m.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div v-if="frequency === 'custom'" class="space-y-1.5">
      <Input
        :model-value="rawInput"
        :placeholder="props.placeholder"
        @update:model-value="onRawInput"
      />
      <p v-if="cronError" class="text-destructive text-xs">{{ cronError }}</p>
    </div>

    <div
      v-if="description"
      class="text-muted-foreground flex items-start gap-1.5 text-xs"
    >
      <LucideClock class="mt-0.5 h-3 w-3 shrink-0" />
      <span>{{ description }}</span>
    </div>

    <div v-if="frequency !== 'custom'">
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
        @click="showAdvanced = !showAdvanced"
      >
        {{
          showAdvanced ? $t('cron.hide_expression') : $t('cron.show_expression')
        }}
      </button>
      <div v-if="showAdvanced" class="mt-1.5">
        <code class="bg-muted text-foreground rounded px-2 py-1 text-xs">
          {{ buildCron() }}
        </code>
      </div>
    </div>
  </div>
</template>
