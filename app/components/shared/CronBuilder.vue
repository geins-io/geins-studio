<script setup lang="ts">
import cronstrue from 'cronstrue'
import 'cronstrue/locales/sv'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
}>(), {
  modelValue: '',
  placeholder: '0 * * * * *',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { locale } = useI18n()

type Frequency = 'every-minute' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom'

const PRESETS: Record<string, { label: string; cron: string }> = {
  'every-minute': { label: 'Every minute', cron: '0 * * * * *' },
  'hourly': { label: 'Every hour', cron: '0 0 * * * *' },
  'daily': { label: 'Every day', cron: '0 0 0 * * *' },
  'weekly': { label: 'Every week', cron: '0 0 0 * * 1' },
  'monthly': { label: 'Every month', cron: '0 0 0 1 * *' },
  'custom': { label: 'Custom', cron: '' },
}

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }))
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ value: i, label: String(i).padStart(2, '0') }))

const showAdvanced = ref(false)
const rawInput = ref(props.modelValue)

const frequency = ref<Frequency>('every-minute')
const selectedMinute = ref(0)
const selectedHour = ref(0)
const selectedDays = ref<number[]>([1])
const selectedDayOfMonth = ref(1)
const lastDayOfMonth = ref(false)

function parseCronToState(cron: string) {
  if (!cron) return
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 6) return

  const [_sec, min, hour, dom, _month, dow] = parts as [string, string, string, string, string, string]

  for (const [key, preset] of Object.entries(PRESETS)) {
    if (key !== 'custom' && preset.cron === cron) {
      frequency.value = key as Frequency
      if (min !== '*') selectedMinute.value = Number.parseInt(min) || 0
      if (hour !== '*') selectedHour.value = Number.parseInt(hour) || 0
      if (dow !== '*') selectedDays.value = dow.split(',').map(Number)
      if (dom !== '*') selectedDayOfMonth.value = Number.parseInt(dom) || 1
      return
    }
  }

  if (dom === 'L' && _month === '*' && dow === '*') {
    frequency.value = 'monthly'
    lastDayOfMonth.value = true
    if (min !== '*') selectedMinute.value = Number.parseInt(min) || 0
    if (hour !== '*') selectedHour.value = Number.parseInt(hour) || 0
    return
  }

  frequency.value = 'custom'
  if (min !== '*') selectedMinute.value = Number.parseInt(min) || 0
  if (hour !== '*') selectedHour.value = Number.parseInt(hour) || 0
  if (dow !== '*') selectedDays.value = dow.split(',').map(Number)
  if (dom !== '*' && dom !== 'L') selectedDayOfMonth.value = Number.parseInt(dom) || 1
  lastDayOfMonth.value = dom === 'L'
}

function buildCron(): string {
  switch (frequency.value) {
    case 'every-minute':
      return '0 * * * * *'
    case 'hourly':
      return `0 ${selectedMinute.value} * * * *`
    case 'daily':
      return `0 ${selectedMinute.value} ${selectedHour.value} * * *`
    case 'weekly': {
      const days = selectedDays.value.length > 0 ? selectedDays.value.sort((a, b) => a - b).join(',') : '1'
      return `0 ${selectedMinute.value} ${selectedHour.value} * * ${days}`
    }
    case 'monthly': {
      const dom = lastDayOfMonth.value ? 'L' : String(selectedDayOfMonth.value)
      return `0 ${selectedMinute.value} ${selectedHour.value} ${dom} * *`
    }
    case 'custom':
      return rawInput.value
  }
}

function emitCron(cron: string) {
  rawInput.value = cron
  emit('update:modelValue', cron)
}

const description = computed(() => {
  const cron = frequency.value === 'custom' ? rawInput.value : buildCron()
  if (!cron?.trim()) return ''
  try {
    return cronstrue.toString(cron, { locale: locale.value, use24HourTimeFormat: true })
  }
  catch {
    return ''
  }
})

const cronError = computed(() => {
  if (frequency.value !== 'custom') return ''
  const cron = rawInput.value?.trim()
  if (!cron) return ''
  try {
    cronstrue.toString(cron)
    return ''
  }
  catch (err) {
    return err instanceof Error ? err.message : 'Invalid cron expression'
  }
})

watch(frequency, () => {
  if (frequency.value !== 'custom') {
    emitCron(buildCron())
  }
})

watch([selectedMinute, selectedHour, selectedDays, selectedDayOfMonth, lastDayOfMonth], () => {
  if (frequency.value !== 'custom') {
    emitCron(buildCron())
  }
}, { deep: true })

function onRawInput(val: string | number) {
  rawInput.value = String(val)
  emit('update:modelValue', String(val))
}

function toggleDay(day: number) {
  const idx = selectedDays.value.indexOf(day)
  if (idx >= 0) {
    if (selectedDays.value.length > 1) {
      selectedDays.value.splice(idx, 1)
    }
  }
  else {
    selectedDays.value.push(day)
  }
}

onMounted(() => {
  if (props.modelValue) {
    parseCronToState(props.modelValue)
  }
})

watch(() => props.modelValue, (val) => {
  if (val !== buildCron() && val !== rawInput.value) {
    parseCronToState(val || '')
  }
})
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
        @click="frequency = key as Frequency"
      >
        {{ preset.label }}
      </button>
    </div>

    <div v-if="frequency === 'hourly'" class="flex items-center gap-2">
      <span class="text-muted-foreground text-xs">at minute</span>
      <Select :model-value="String(selectedMinute)" @update:model-value="selectedMinute = Number($event)">
        <SelectTrigger class="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="m in MINUTES" :key="m.value" :value="String(m.value)">
            {{ m.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div v-if="frequency === 'daily'" class="flex items-center gap-2">
      <span class="text-muted-foreground text-xs">at</span>
      <Select :model-value="String(selectedHour)" @update:model-value="selectedHour = Number($event)">
        <SelectTrigger class="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="h in HOURS" :key="h.value" :value="String(h.value)">
            {{ h.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <span class="text-muted-foreground text-xs">:</span>
      <Select :model-value="String(selectedMinute)" @update:model-value="selectedMinute = Number($event)">
        <SelectTrigger class="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="m in MINUTES" :key="m.value" :value="String(m.value)">
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
          {{ day.label }}
        </button>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground text-xs">at</span>
        <Select :model-value="String(selectedHour)" @update:model-value="selectedHour = Number($event)">
          <SelectTrigger class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="h in HOURS" :key="h.value" :value="String(h.value)">
              {{ h.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <span class="text-muted-foreground text-xs">:</span>
        <Select :model-value="String(selectedMinute)" @update:model-value="selectedMinute = Number($event)">
          <SelectTrigger class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="m in MINUTES" :key="m.value" :value="String(m.value)">
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
          Last day
        </button>
        <span class="text-muted-foreground text-xs">or on day</span>
        <Select
          :model-value="String(selectedDayOfMonth)"
          @update:model-value="lastDayOfMonth = false; selectedDayOfMonth = Number($event)"
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
      <p v-if="!lastDayOfMonth && selectedDayOfMonth >= 29" class="flex items-center gap-1 text-xs text-amber-600">
        <LucideTriangleAlert class="h-3 w-3 shrink-0" />
        Day {{ selectedDayOfMonth }} doesn't exist in all months — the workflow will skip those months.
      </p>
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground text-xs">at</span>
        <Select :model-value="String(selectedHour)" @update:model-value="selectedHour = Number($event)">
          <SelectTrigger class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="h in HOURS" :key="h.value" :value="String(h.value)">
              {{ h.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <span class="text-muted-foreground text-xs">:</span>
        <Select :model-value="String(selectedMinute)" @update:model-value="selectedMinute = Number($event)">
          <SelectTrigger class="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="m in MINUTES" :key="m.value" :value="String(m.value)">
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

    <div v-if="description" class="text-muted-foreground flex items-start gap-1.5 text-xs">
      <LucideClock class="mt-0.5 h-3 w-3 shrink-0" />
      <span>{{ description }}</span>
    </div>

    <div v-if="frequency !== 'custom'">
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
        @click="showAdvanced = !showAdvanced"
      >
        {{ showAdvanced ? 'Hide' : 'Show' }} cron expression
      </button>
      <div v-if="showAdvanced" class="mt-1.5">
        <code class="bg-muted text-foreground rounded px-2 py-1 text-xs">{{ buildCron() }}</code>
      </div>
    </div>
  </div>
</template>
