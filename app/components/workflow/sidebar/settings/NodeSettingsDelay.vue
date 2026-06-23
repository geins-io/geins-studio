<script setup lang="ts">
import ExpressionInput from '@/components/workflow/shared/ExpressionInput.vue';

const { t } = useI18n();

const props = defineProps<{
  nodeData: Record<string, unknown>;
  nodeConfig: Record<string, unknown>;
  nodeInput: Record<string, unknown>;
  updateConfig: (name: string, value: unknown) => void;
  updateInput: (name: string, value: unknown) => void;
}>();

type DelayMode = 'duration' | 'waitUntil';

const initialMode: DelayMode =
  props.nodeInput.waitUntil !== undefined && props.nodeInput.waitUntil !== null
    ? 'waitUntil'
    : 'duration';

const mode = ref<DelayMode>(initialMode);

if (initialMode === 'duration' && !props.nodeInput.duration) {
  props.updateInput('duration', 'PT5M');
}

const setMode = (newMode: DelayMode) => {
  mode.value = newMode;
  if (newMode === 'duration') {
    props.updateInput('waitUntil', undefined);
    if (!props.nodeInput.duration) {
      props.updateInput('duration', 'PT5M');
    }
  } else {
    props.updateInput('duration', undefined);
  }
};

const UNITS = [
  { value: 'S', label: t('node.settings.delay.seconds'), short: 'sec' },
  { value: 'M', label: t('node.settings.delay.minutes'), short: 'min' },
  { value: 'H', label: t('node.settings.delay.hours'), short: 'hr' },
] as const;

type UnitValue = (typeof UNITS)[number]['value'];

function parseIsoDuration(iso: string): { amount: number; unit: UnitValue } {
  const match = String(iso).match(/^PT?(\d+)(S|M|H)$/i);
  if (match && match[1] && match[2]) {
    return {
      amount: Number(match[1]),
      unit: match[2].toUpperCase() as UnitValue,
    };
  }
  return { amount: 5, unit: 'M' };
}

function toIsoDuration(amount: number, unit: UnitValue): string {
  return `PT${amount}${unit}`;
}

const parsed = computed(() =>
  parseIsoDuration(String(props.nodeInput.duration ?? 'PT5M')),
);
const durationAmount = computed(() => parsed.value.amount);
const durationUnit = computed(() => parsed.value.unit);

const updateDuration = (amount: number, unit: UnitValue) => {
  if (amount > 0) {
    props.updateInput('duration', toIsoDuration(amount, unit));
  }
};

const waitUntil = computed(() => String(props.nodeInput.waitUntil ?? ''));
const reason = computed(() => String(props.nodeInput.reason ?? ''));

const isExpression = (val: string) => /\{\{.+\}\}/.test(val);
const ISO_DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

function validateWaitUntil(val: string): string | null {
  if (!val) return null;
  if (isExpression(val)) return null;
  if (!ISO_DATETIME_RE.test(val)) return t('node.settings.delay.invalid_iso');
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return t('node.settings.delay.invalid_date');
  return null;
}

const waitUntilError = computed(() => validateWaitUntil(waitUntil.value));

const waitUntilPlaceholder = computed(() => {
  const d = new Date(Date.now() + 10 * 60 * 1000);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
});

function humanReadableDuration(amount: number, unit: UnitValue): string {
  const keys: Record<UnitValue, string> = {
    S: 'node.settings.delay.seconds_count',
    M: 'node.settings.delay.minutes_count',
    H: 'node.settings.delay.hours_count',
  };
  return t(keys[unit], { count: amount }, amount);
}
</script>

<template>
  <div class="space-y-4">
    <!-- Mode toggle -->
    <div class="space-y-1.5">
      <label class="text-muted-foreground text-xs font-medium">
        {{ $t('node.settings.delay.delay_type') }}
      </label>
      <div class="bg-muted flex rounded-md p-0.5">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            mode === 'duration'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="setMode('duration')"
        >
          <LucideTimer class="h-3.5 w-3.5" />
          {{ $t('node.settings.delay.fixed_duration') }}
        </button>
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            mode === 'waitUntil'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="setMode('waitUntil')"
        >
          <LucideCalendarClock class="h-3.5 w-3.5" />
          {{ $t('node.settings.delay.wait_until') }}
        </button>
      </div>
    </div>

    <!-- Duration mode -->
    <template v-if="mode === 'duration'">
      <div class="space-y-1.5">
        <label class="text-sm font-medium">
          {{ $t('node.settings.delay.duration') }}
        </label>
        <div class="flex gap-2">
          <Input
            type="number"
            :model-value="durationAmount"
            min="1"
            class="flex-1"
            @update:model-value="
              updateDuration(Number($event) || 1, durationUnit)
            "
          />
          <Select
            :model-value="durationUnit"
            @update:model-value="
              updateDuration(durationAmount, $event as UnitValue)
            "
          >
            <SelectTrigger class="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="u in UNITS" :key="u.value" :value="u.value">
                {{ u.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p class="text-muted-foreground text-xs">
          {{
            $t('node.settings.delay.pauses_for', {
              duration: humanReadableDuration(durationAmount, durationUnit),
            })
          }}
        </p>
      </div>
    </template>

    <!-- Wait Until mode -->
    <template v-else>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">
          {{ $t('node.settings.delay.wait_until') }}
        </label>
        <ExpressionInput
          :model-value="waitUntil"
          :placeholder="waitUntilPlaceholder"
          @update:model-value="updateInput('waitUntil', $event)"
        />
        <p v-if="waitUntilError" class="text-destructive text-xs">
          {{ waitUntilError }}
        </p>
        <p v-else class="text-muted-foreground text-xs">
          {{ $t('node.settings.delay.utc_datetime_eg') }}
          <code class="bg-muted rounded px-1">{{ waitUntilPlaceholder }}</code>
          {{ $t('node.settings.delay.or_expression_like') }}
          <code
            class="rounded bg-emerald-500/10 px-1 text-emerald-700 dark:text-emerald-400"
            v-text="'{{output.nodeId.scheduledAt}}'"
          />
        </p>
      </div>
    </template>

    <!-- Reason -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">
        {{ $t('node.settings.delay.reason') }}
      </label>
      <Input
        :model-value="reason"
        :placeholder="$t('node.settings.delay.reason_placeholder')"
        @update:model-value="updateInput('reason', $event || undefined)"
      />
      <p class="text-muted-foreground text-xs">
        {{ $t('node.settings.delay.reason_help') }}
      </p>
    </div>
  </div>
</template>
