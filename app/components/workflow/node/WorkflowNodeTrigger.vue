<script setup lang="ts">
import cronstrue from 'cronstrue'
import 'cronstrue/locales/sv'
import { LucideClock, LucideMousePointerClick, LucideWebhook, LucideZap } from '#components'
import WorkflowHandlePlus from './handle/WorkflowHandlePlus.vue'

// Trigger node renders the workflow's configured trigger (scheduled / event /
// onDemand / webhook). The trigger itself is workflow-level metadata — the
// node is a read-only visualization fed by the builder from the current
// workflow object.
const props = defineProps<{
  data: {
    triggerType?: string
    cronExpression?: string
    eventEntity?: string
    eventAction?: string
    eventName?: string
    label?: string
    description?: string
  }
  selected?: boolean
}>()

const { locale, t } = useI18n()

const normalizedType = computed(() => (props.data.triggerType ?? 'onDemand').toLowerCase())

const IconComponent = computed(() => {
  switch (normalizedType.value) {
    case 'scheduled': return LucideClock
    case 'event': return LucideZap
    case 'webhook': return LucideWebhook
    default: return LucideMousePointerClick
  }
})

const TYPE_I18N_KEYS: Record<string, string> = {
  scheduled: 'workflows.scheduled',
  event: 'workflows.event',
  webhook: 'workflows.webhook',
  ondemand: 'workflows.manual',
}

const typeDisplayName = computed(() => {
  const key = TYPE_I18N_KEYS[normalizedType.value]
  return key ? t(key) : t('workflows.manual')
})

const title = computed(() => props.data.label?.trim() || typeDisplayName.value)

const cronHuman = computed(() => {
  const expr = (props.data.cronExpression ?? '').trim()
  if (!expr) return ''
  try {
    return cronstrue.toString(expr, { locale: locale.value, use24HourTimeFormat: true })
  }
  catch {
    return expr
  }
})

const eventPattern = computed(() => {
  if (normalizedType.value !== 'event') return ''
  const entity = props.data.eventEntity || props.data.eventName
  const action = props.data.eventAction
  if (entity && action) return `${entity} / ${action}`
  return entity || ''
})

const subtitle = computed(() => {
  if (props.data.description?.trim()) return props.data.description.trim()
  switch (normalizedType.value) {
    case 'scheduled':
      return cronHuman.value || 'No schedule set'
    case 'event':
      return eventPattern.value ? '' : 'No event configured'
    case 'webhook':
      return 'HTTP trigger'
    default:
      return 'Triggered on demand'
  }
})
</script>

<template>
  <div
    class="bg-background flex min-w-[230px] items-stretch overflow-hidden rounded-l-full rounded-r-xl border-2 pr-3 shadow-md transition-all"
    :class="selected ? 'border-green-500 ring-[6px] ring-green-500/20' : 'border-green-500/50'"
  >
    <div class="flex w-14 shrink-0 items-center justify-center bg-green-500/10 text-green-600 dark:text-green-400">
      <component :is="IconComponent" class="h-6 w-6" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 pl-3">
      <div class="text-[9px] font-semibold tracking-wider text-green-600 uppercase dark:text-green-400">
        Trigger
      </div>
      <div class="truncate text-sm leading-tight font-semibold">
        {{ title }}
      </div>
      <div v-if="subtitle" class="text-muted-foreground truncate text-xs leading-tight">
        {{ subtitle }}
      </div>
      <div v-if="eventPattern" class="mt-0.5 flex">
        <span class="bg-muted text-muted-foreground inline-block max-w-full truncate rounded-full px-2 py-0.5 font-mono text-[10px] leading-tight">
          {{ eventPattern }}
        </span>
      </div>
    </div>

    <WorkflowHandlePlus
      handle-class="!border-background !h-3 !w-3 !border-2 !bg-green-500"
    />
  </div>
</template>
