<script setup lang="ts">
const props = defineProps<{
  workflowId: string
  isNew: boolean
}>()

defineExpose({ refresh: () => refreshExecutions() })

const { orchestratorApi } = useGeinsRepository()

const pad = (n: number, len = 2) => String(n).padStart(len, '0')

const formatStartedAt = (iso: string | undefined): string => {
  if (!iso) return '–'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

const formatDuration = (ms: number | undefined): string => {
  if (ms === undefined || ms === null) return '–'
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

const mapStatus = (status: string | undefined): 'success' | 'failed' | 'running' | string => {
  const s = (status ?? '').toLowerCase()
  if (s === 'completed') return 'success'
  if (s === 'failed' || s === 'timedout' || s === 'canceled' || s === 'cancelled') return 'failed'
  if (s === 'running' || s === 'pending' || s === 'suspended') return 'running'
  return s || 'unknown'
}

const { data: executionsRaw, pending: executionsLoading, refresh: refreshExecutions } = useLazyAsyncData(
  () => `workflow-executions-${props.workflowId}`,
  () => props.isNew
    ? Promise.resolve([])
    : orchestratorApi.execution.list({ workflowId: props.workflowId }),
  { default: () => [] },
)

const executions = computed(() =>
  (executionsRaw.value ?? []).map((e: any) => ({
    id: e.id,
    status: mapStatus(e.status),
    startedAt: formatStartedAt(e.startTime),
    duration: formatDuration(e.durationMs),
    trigger: e.startedBy || (e.isTestRun ? 'Test run' : 'Scheduled'),
    error: Array.isArray(e.errors) && e.errors.length > 0 ? e.errors[0] : undefined,
  })),
)
</script>

<template>
  <ContentEditMainContent>
    <ContentEditCard title="Executions" :description="`(${executions.length})`">
      <template #header-action>
        <Button variant="secondary" size="sm" :disabled="executionsLoading" @click="refreshExecutions()">
          <LucideRefreshCw class="mr-2 h-3.5 w-3.5" :class="{ 'animate-spin': executionsLoading }" />
          Refresh
        </Button>
      </template>
      <div v-if="executionsLoading && executions.length === 0" class="space-y-3">
        <div v-for="n in 5" :key="n" class="rounded-lg border p-3">
          <Skeleton class="mb-2 h-4 w-32" />
          <Skeleton class="h-3 w-48" />
        </div>
      </div>
      <div v-else class="space-y-2">
        <NuxtLink
          v-for="execution in executions" :key="execution.id"
          :to="`/orchestrator/executions/${execution.id}`"
          class="hover:bg-muted/50 grid grid-cols-[6rem_1fr_10rem_8rem] items-center gap-4 rounded-lg border p-3 transition-colors">
          <div class="flex items-center gap-2">
            <div
              class="h-2 w-2 rounded-full" :class="{
                'bg-green-500': execution.status === 'success',
                'bg-red-500': execution.status === 'failed',
                'animate-pulse bg-yellow-500': execution.status === 'running',
              }" />
            <span class="text-sm font-medium capitalize">{{ execution.status }}</span>
          </div>
          <div class="text-muted-foreground truncate font-mono text-xs">{{ execution.startedAt }}</div>
          <div class="text-muted-foreground truncate text-xs">Trigger: {{ execution.trigger }}</div>
          <div class="text-muted-foreground text-right font-mono text-xs">{{ execution.duration }}</div>
        </NuxtLink>
        <div v-if="executions.length === 0" class="text-muted-foreground py-12 text-center text-sm">
          No executions yet
        </div>
      </div>
    </ContentEditCard>
  </ContentEditMainContent>
</template>
