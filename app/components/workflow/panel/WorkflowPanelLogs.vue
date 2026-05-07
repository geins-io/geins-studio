<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch, nextTick } from 'vue'
import JsonCodeEditor from '@/components/shared/JsonCodeEditor.vue'

type NodeEvent = {
  seq: number
  nodeId: string
  status: string
  startTime?: string
  endTime?: string
  error?: string | null
  input?: Record<string, unknown> | null
  output?: Record<string, unknown> | null
}

const props = defineProps<{
  executionId?: string | null
}>()

const emit = defineEmits<{
  'select:node': [nodeId: string]
}>()

const { orchestratorApi } = useGeinsRepository()

const STORAGE_KEY_HEIGHT = 'workflow.logsPanel.height'
const MIN_HEIGHT = 160
const MAX_HEIGHT_RATIO = 0.8
const DEFAULT_HEIGHT = 280

function readNumber(key: string, fallback: number) {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  const n = raw ? Number(raw) : NaN
  return Number.isFinite(n) ? n : fallback
}

const isOpen = ref(false)
const hasBeenOpened = ref(false)
const height = ref(readNumber(STORAGE_KEY_HEIGHT, DEFAULT_HEIGHT))

watch(height, (v) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY_HEIGHT, String(Math.round(v)))
})

function toggle() {
  isOpen.value = !isOpen.value
}

// --- Live execution tracking (poll execution details) ---
const events = ref<NodeEvent[]>([])
const streamStatus = ref<'idle' | 'connecting' | 'live' | 'done' | 'error'>('idle')
const streamError = ref<string | null>(null)
const executionStatus = ref<string | null>(null)
let pollTimer: ReturnType<typeof setTimeout> | null = null
let activeExecutionId: string | null = null
const POLL_INTERVAL_MS = 800
const TERMINAL_STATUSES = new Set(['completed', 'failed', 'canceled', 'cancelled', 'timedout'])

const eventsSorted = computed(() =>
  [...events.value].sort((a, b) => a.seq - b.seq),
)

const runningCount = computed(
  () => events.value.filter(e => statusKind(e.status) === 'running').length,
)

const expandedNodeId = ref<string | null>(null)
const expandedTab = ref<'input' | 'output'>('output')

function toggleExpand(nodeId: string) {
  expandedNodeId.value = expandedNodeId.value === nodeId ? null : nodeId
  expandedTab.value = 'output'
}

function hasRunData(event: NodeEvent): boolean {
  return event.input != null || event.output != null
}

function formatJson(data: unknown): string {
  if (data == null) return '{}'
  return JSON.stringify(data, null, 2)
}


function statusKind(status: string): 'running' | 'success' | 'error' | 'other' {
  const s = (status || '').toLowerCase()
  if (s === 'completed' || s === 'success' || s === 'succeeded') return 'success'
  if (s === 'failed' || s === 'error' || s === 'timedout' || s === 'canceled' || s === 'cancelled') return 'error'
  if (s === 'running' || s === 'started' || s === 'pending' || s === 'active') return 'running'
  return 'other'
}

function formatEventTime(iso?: string): string {
  if (!iso) return '–'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString(undefined, { hour12: false }) + '.'
    + String(d.getMilliseconds()).padStart(3, '0')
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return '–'
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  if (Number.isNaN(s) || Number.isNaN(e)) return '–'
  const ms = e - s
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function upsertEvent(raw: Record<string, unknown>) {
  const seq = typeof raw.seq === 'number' ? raw.seq : -1
  const nodeId = typeof raw.nodeId === 'string' ? raw.nodeId : ''
  const status = typeof raw.status === 'string' ? raw.status : 'unknown'
  if (!nodeId) return
  const startTime = typeof raw.startTime === 'string' ? raw.startTime : undefined
  const endTime = typeof raw.endTime === 'string' ? raw.endTime : undefined
  const error = typeof raw.error === 'string' ? raw.error : (typeof raw.errorMessage === 'string' ? raw.errorMessage : (typeof raw.message === 'string' ? raw.message : null))
  const input = (raw.input != null && typeof raw.input === 'object') ? raw.input as Record<string, unknown> : null
  const output = (raw.output != null && typeof raw.output === 'object') ? raw.output as Record<string, unknown> : null
  const key = seq >= 0 ? `seq:${seq}` : `node:${nodeId}:${startTime ?? ''}`
  const idx = events.value.findIndex(e =>
    (e.seq >= 0 && `seq:${e.seq}` === key)
    || (e.seq < 0 && `node:${e.nodeId}:${e.startTime ?? ''}` === key),
  )
  const next: NodeEvent = { seq, nodeId, status, startTime, endTime, error, input, output }
  if (idx >= 0) events.value[idx] = { ...events.value[idx], ...next }
  else events.value.push(next)
}

async function pollOnce(execId: string): Promise<boolean> {
  try {
    const details = await orchestratorApi.execution.get(execId) as any
    // normalizeKeys wraps the response; node data lives on details.execution.nodeExecutions
    // and the orchestration status can be either at the top or on the inner execution.
    const inner = details?.execution ?? details
    const statusStr = String(
      details?.orchestrationStatus
      ?? inner?.status
      ?? details?.status
      ?? '',
    ).toLowerCase()
    executionStatus.value = statusStr
    const nodes: any[] = Array.isArray(inner?.nodeExecutions)
      ? inner.nodeExecutions
      : Array.isArray(details?.nodeExecutions)
        ? details.nodeExecutions
        : []

    // Build a nodeId→error lookup from nodeResults (if the API returns them)
    const nodeResults: any[] = Array.isArray(inner?.nodeResults)
      ? inner.nodeResults
      : Array.isArray(details?.nodeResults)
        ? details.nodeResults
        : []
    const nodeResultErrors = new Map<string, string>()
    for (const nr of nodeResults) {
      if (nr.error && nr.nodeId) nodeResultErrors.set(nr.nodeId as string, nr.error as string)
    }

    // Execution-level errors (fallback when per-node error is unavailable)
    const execErrors: string[] = Array.isArray(inner?.errors) ? inner.errors : []

    for (const [idx, n] of nodes.entries()) {
      const nodeError = n.error
        ?? n.errorMessage
        ?? n.message
        ?? nodeResultErrors.get(n.nodeId)
        ?? (Array.isArray(n.retryErrors) && n.retryErrors.length > 0 ? n.retryErrors[n.retryErrors.length - 1] : null)
        ?? null

      upsertEvent({
        nodeId: n.nodeId,
        status: n.status,
        seq: typeof n.executionOrder === 'number' ? n.executionOrder : idx,
        startTime: n.startTime,
        endTime: n.endTime,
        error: nodeError,
        input: n.input,
        output: n.output,
      })
    }

    // If we have execution-level errors but no per-node errors, attach to the first failed node
    if (execErrors.length > 0) {
      const failedEvent = events.value.find(e => statusKind(e.status) === 'error' && !e.error)
      if (failedEvent) {
        failedEvent.error = execErrors.join('\n')
      }
    }
    return TERMINAL_STATUSES.has(statusStr)
  }
  catch (err) {
    streamStatus.value = 'error'
    streamError.value = (err as Error).message
    return true
  }
}

async function startStream(execId: string) {
  stopStream()
  events.value = []
  streamError.value = null
  executionStatus.value = null
  activeExecutionId = execId
  streamStatus.value = 'connecting'

  // First poll immediately so we can flip to 'live' as soon as any data is seen.
  const finished = await pollOnce(execId)
  if (activeExecutionId !== execId) return
  streamStatus.value = finished ? 'done' : 'live'
  if (finished) return

  const tick = async () => {
    if (activeExecutionId !== execId) return
    const done = await pollOnce(execId)
    if (activeExecutionId !== execId) return
    if (done) {
      streamStatus.value = 'done'
      pollTimer = null
      return
    }
    pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
  }
  pollTimer = setTimeout(tick, POLL_INTERVAL_MS)
}

function stopStream() {
  activeExecutionId = null
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

function clearEvents() {
  events.value = []
}

watch(
  () => props.executionId,
  (execId) => {
    if (execId) startStream(execId)
    else stopStream()
  },
)

defineExpose({
  open: () => {
    hasBeenOpened.value = true
    isOpen.value = true
  },
  close: () => {
    isOpen.value = false
  },
  toggle,
})

// --- Resize (top-edge drag) ---
const isResizing = ref(false)
let startY = 0
let startHeight = 0

function onResizeStart(e: PointerEvent) {
  if (isPoppedOut.value) return
  isResizing.value = true
  startY = e.clientY
  startHeight = height.value
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', onResizeEnd, { once: true })
  e.preventDefault()
}

function onResizeMove(e: PointerEvent) {
  const delta = startY - e.clientY
  const max = Math.max(MIN_HEIGHT, Math.floor(window.innerHeight * MAX_HEIGHT_RATIO))
  height.value = Math.min(max, Math.max(MIN_HEIGHT, startHeight + delta))
}

function onResizeEnd() {
  isResizing.value = false
  window.removeEventListener('pointermove', onResizeMove)
}

// --- Pop-out window ---
const isPoppedOut = ref(false)
const popoutContainer = ref<HTMLElement | null>(null)
let popWindow: Window | null = null

function copyStyles(target: Document) {
  Array.from(document.styleSheets).forEach((sheet) => {
    try {
      if (sheet.href) {
        const link = target.createElement('link')
        link.rel = 'stylesheet'
        link.href = sheet.href
        target.head.appendChild(link)
      } else {
        const node = sheet.ownerNode as HTMLStyleElement | null
        if (node?.textContent) {
          const style = target.createElement('style')
          style.textContent = node.textContent
          target.head.appendChild(style)
        }
      }
    } catch {
      // Cross-origin stylesheet — skipped
    }
  })
}

async function popOut() {
  if (isPoppedOut.value) return
  const w = window.open('', 'workflow-logs-panel', 'width=1000,height=640')
  if (!w) return
  w.document.title = 'Workflow Logs'
  copyStyles(w.document)
  w.document.documentElement.className = document.documentElement.className
  w.document.body.className = document.body.className
  w.document.body.style.margin = '0'
  w.document.body.style.height = '100vh'
  const root = w.document.createElement('div')
  root.id = 'logs-popout-root'
  root.style.cssText = 'height:100vh; display:flex; flex-direction:column; background:var(--background);'
  w.document.body.appendChild(root)

  popWindow = w
  popoutContainer.value = root
  isPoppedOut.value = true
  if (!isOpen.value) isOpen.value = true

  const handleClose = () => {
    isPoppedOut.value = false
    popoutContainer.value = null
    popWindow = null
  }
  w.addEventListener('beforeunload', handleClose)
  // Close the popout if the parent unloads
  window.addEventListener('beforeunload', () => w.close(), { once: true })
  await nextTick()
}

function dockBack() {
  popWindow?.close()
  isPoppedOut.value = false
  popoutContainer.value = null
  popWindow = null
}

onBeforeUnmount(() => {
  popWindow?.close()
  window.removeEventListener('pointermove', onResizeMove)
  stopStream()
})

const bodyStyle = computed(() => ({
  height: `${height.value}px`,
}))
</script>

<template>
  <div class="bg-background flex shrink-0 flex-col border-t">
    <!-- Header -->
    <div
      class="flex h-9 shrink-0 cursor-pointer items-center justify-between border-b px-3 select-none"
      @click="toggle">
      <div class="flex items-center gap-2">
        <LucideChevronDown v-if="isOpen && !isPoppedOut" class="text-muted-foreground size-4" />
        <LucideChevronUp v-else-if="!isPoppedOut" class="text-muted-foreground size-4" />
        <LucideExternalLink v-else class="text-muted-foreground size-4" />
        <span class="text-sm font-medium">Logs</span>
        <span v-if="isPoppedOut" class="text-muted-foreground text-xs">(popped out)</span>
      </div>
      <div class="flex items-center gap-1" @click.stop>
        <button
          v-if="!isPoppedOut"
          class="hover:bg-accent text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded"
          title="Open in new window"
          @click="popOut">
          <LucideExternalLink class="size-3.5" />
        </button>
        <button
          v-else
          class="hover:bg-accent text-muted-foreground hover:text-foreground flex h-7 w-7 items-center justify-center rounded"
          title="Dock back"
          @click="dockBack">
          <LucidePanelBottomClose class="size-3.5" />
        </button>
      </div>
    </div>

    <!-- Inline body: visible when open and not popped out. -->
    <div
      v-if="isOpen && !isPoppedOut"
      class="bg-background relative shrink-0"
      :style="bodyStyle">
      <div
        class="hover:bg-primary/40 absolute inset-x-0 -top-0.5 z-10 h-1 cursor-ns-resize"
        :class="{ 'bg-primary/40': isResizing }"
        @pointerdown="onResizeStart" />
      <Teleport :to="popoutContainer ?? undefined" :disabled="!isPoppedOut">
        <div class="bg-background flex h-full flex-col overflow-hidden">
          <slot>
            <!-- Live stream toolbar -->
            <div class="bg-muted/30 flex h-9 shrink-0 items-center justify-between border-b px-3 text-xs">
              <div class="flex items-center gap-2">
                <template v-if="props.executionId">
                  <LucideLoader2 v-if="streamStatus === 'connecting' || streamStatus === 'live'" class="h-3 w-3 animate-spin" />
                  <LucideCheckCircle2 v-else-if="streamStatus === 'done'" class="h-3 w-3 text-green-500" />
                  <LucideCircleAlert v-else-if="streamStatus === 'error'" class="text-destructive h-3 w-3" />
                  <span class="text-muted-foreground">
                    <template v-if="streamStatus === 'connecting'">Connecting…</template>
                    <template v-else-if="streamStatus === 'live'">Live · {{ events.length }} events{{ runningCount ? ` · ${runningCount} running` : '' }}</template>
                    <template v-else-if="streamStatus === 'done'">Completed · {{ events.length }} events</template>
                    <template v-else-if="streamStatus === 'error'">Stream error: {{ streamError }}</template>
                    <template v-else>Idle</template>
                  </span>
                  <NuxtLink
                    :to="`/orchestrator/executions/${props.executionId}`"
                    target="_blank"
                    class="bg-muted text-muted-foreground hover:text-foreground ml-1 rounded px-1.5 py-0.5 font-mono text-[10px] underline-offset-2 hover:underline"
                  >{{ props.executionId }}</NuxtLink>
                </template>
                <template v-else>
                  <span class="text-muted-foreground">Run a workflow to see live events</span>
                </template>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="events.length"
                  class="hover:bg-accent text-muted-foreground hover:text-foreground flex h-6 items-center gap-1 rounded px-1.5"
                  title="Clear events" @click="clearEvents">
                  <LucideTrash2 class="h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>
            <div class="min-h-0 flex-1 overflow-auto">
              <div v-if="events.length === 0" class="text-muted-foreground flex h-full items-center justify-center p-6 text-xs">
                {{ props.executionId ? 'Waiting for node events…' : 'No execution running' }}
              </div>
              <table v-else class="w-full text-xs">
                <thead class="bg-muted/50 sticky top-0">
                  <tr class="text-muted-foreground text-left">
                    <th class="w-12 px-3 py-1.5 font-medium">#</th>
                    <th class="px-3 py-1.5 font-medium">Node</th>
                    <th class="w-24 px-3 py-1.5 font-medium">Status</th>
                    <th class="w-32 px-3 py-1.5 font-medium">Started</th>
                    <th class="w-24 px-3 py-1.5 font-medium">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="event in eventsSorted" :key="`${event.seq}:${event.nodeId}`">
                    <tr
                      class="hover:bg-muted/30 cursor-pointer border-b last:border-b-0"
                      :class="{
                        '!border-b-0': (event.error && statusKind(event.status) === 'error') || expandedNodeId === event.nodeId,
                        'bg-muted/20': expandedNodeId === event.nodeId,
                      }"
                      @click="toggleExpand(event.nodeId); emit('select:node', event.nodeId)">
                      <td class="text-muted-foreground px-3 py-1 font-mono">{{ event.seq >= 0 ? event.seq : '–' }}</td>
                      <td class="px-3 py-1 font-mono">
                        <span class="flex items-center gap-1">
                          <LucideChevronRight v-if="hasRunData(event)" class="text-muted-foreground h-3 w-3 shrink-0 transition-transform" :class="{ 'rotate-90': expandedNodeId === event.nodeId }" />
                          {{ event.nodeId }}
                        </span>
                      </td>
                      <td class="px-3 py-1">
                        <span
                          class="inline-flex items-center gap-1"
                          :class="{
                            'text-green-600 dark:text-green-500': statusKind(event.status) === 'success',
                            'text-red-600 dark:text-red-500': statusKind(event.status) === 'error',
                            'text-blue-600 dark:text-blue-400': statusKind(event.status) === 'running',
                            'text-muted-foreground': statusKind(event.status) === 'other',
                          }">
                          <span
                            class="h-1.5 w-1.5 rounded-full"
                            :class="{
                              'bg-green-500': statusKind(event.status) === 'success',
                              'bg-red-500': statusKind(event.status) === 'error',
                              'animate-pulse bg-blue-500': statusKind(event.status) === 'running',
                              'bg-muted-foreground': statusKind(event.status) === 'other',
                            }" />
                          {{ event.status }}
                        </span>
                      </td>
                      <td class="text-muted-foreground px-3 py-1 font-mono">{{ formatEventTime(event.startTime) }}</td>
                      <td class="text-muted-foreground px-3 py-1 font-mono">{{ formatDuration(event.startTime, event.endTime) }}</td>
                    </tr>
                    <tr v-if="event.error && statusKind(event.status) === 'error'" class="border-b last:border-b-0" :class="{ '!border-b-0': expandedNodeId === event.nodeId }">
                      <td />
                      <td colspan="4" class="px-3 pt-0.5 pb-2">
                        <div class="flex items-start gap-1.5 rounded bg-red-500/10 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400">
                          <LucideTriangleAlert class="mt-0.5 h-3 w-3 shrink-0" />
                          <span class="break-all whitespace-pre-wrap">{{ event.error }}</span>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="expandedNodeId === event.nodeId && hasRunData(event)" class="border-b last:border-b-0">
                      <td />
                      <td colspan="4" class="px-3 pt-0.5 pb-2">
                        <div class="bg-muted/30 flex flex-col overflow-hidden rounded border">
                          <div class="flex items-center gap-0.5 border-b px-2 py-1">
                            <button
                              v-if="event.input != null"
                              class="rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
                              :class="expandedTab === 'input' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                              @click.stop="expandedTab = 'input'">
                              Input
                            </button>
                            <button
                              v-if="event.output != null"
                              class="rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
                              :class="expandedTab === 'output' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                              @click.stop="expandedTab = 'output'">
                              Output
                            </button>
                          </div>
                          <div class="h-48">
                            <JsonCodeEditor
                              v-if="expandedTab === 'input' && event.input != null"
                              :model-value="formatJson(event.input)"
                              :readonly="true"
                              :line-numbers="false"
                              :line-wrapping="true"
                              :expandable="true"
                            />
                            <JsonCodeEditor
                              v-else-if="expandedTab === 'output' && event.output != null"
                              :model-value="formatJson(event.output)"
                              :readonly="true"
                              :line-numbers="false"
                              :line-wrapping="true"
                              :expandable="true"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </slot>
        </div>
      </Teleport>
    </div>

    <!-- When popped out, mount the content in the external window. -->
    <Teleport v-if="isPoppedOut && popoutContainer" :to="popoutContainer">
      <div class="bg-background flex h-full flex-col overflow-auto">
        <slot>
          <!-- Live stream toolbar -->
          <div class="bg-muted/30 flex h-9 shrink-0 items-center justify-between border-b px-3 text-xs">
            <div class="flex items-center gap-2">
              <template v-if="props.executionId">
                <LucideLoader2 v-if="streamStatus === 'connecting' || streamStatus === 'live'" class="h-3 w-3 animate-spin" />
                <LucideCheckCircle2 v-else-if="streamStatus === 'done'" class="h-3 w-3 text-green-500" />
                <LucideCircleAlert v-else-if="streamStatus === 'error'" class="text-destructive h-3 w-3" />
                <span class="text-muted-foreground">
                  <template v-if="streamStatus === 'connecting'">Connecting…</template>
                  <template v-else-if="streamStatus === 'live'">Live · {{ events.length }} events{{ runningCount ? ` · ${runningCount} running` : '' }}</template>
                  <template v-else-if="streamStatus === 'done'">Completed · {{ events.length }} events</template>
                  <template v-else-if="streamStatus === 'error'">Stream error: {{ streamError }}</template>
                  <template v-else>Idle</template>
                </span>
                <NuxtLink
                  :to="`/orchestrator/executions/${props.executionId}`"
                  target="_blank"
                  class="bg-muted text-muted-foreground hover:text-foreground ml-1 rounded px-1.5 py-0.5 font-mono text-[10px] underline-offset-2 hover:underline"
                >{{ props.executionId }}</NuxtLink>
              </template>
              <template v-else>
                <span class="text-muted-foreground">Run a workflow to see live events</span>
              </template>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="events.length"
                class="hover:bg-accent text-muted-foreground hover:text-foreground flex h-6 items-center gap-1 rounded px-1.5"
                title="Clear events" @click="clearEvents">
                <LucideTrash2 class="h-3 w-3" />
                Clear
              </button>
            </div>
          </div>

          <!-- Events list -->
          <div class="min-h-0 flex-1 overflow-auto">
            <div v-if="events.length === 0" class="text-muted-foreground flex h-full items-center justify-center p-6 text-xs">
              {{ props.executionId ? 'Waiting for node events…' : 'No execution running' }}
            </div>
            <table v-else class="w-full text-xs">
              <thead class="bg-muted/50 sticky top-0">
                <tr class="text-muted-foreground text-left">
                  <th class="w-12 px-3 py-1.5 font-medium">#</th>
                  <th class="px-3 py-1.5 font-medium">Node</th>
                  <th class="w-24 px-3 py-1.5 font-medium">Status</th>
                  <th class="w-32 px-3 py-1.5 font-medium">Started</th>
                  <th class="w-24 px-3 py-1.5 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="event in eventsSorted" :key="`${event.seq}:${event.nodeId}`">
                  <tr
                    class="hover:bg-muted/30 cursor-pointer border-b last:border-b-0"
                    :class="{
                      '!border-b-0': (event.error && statusKind(event.status) === 'error') || expandedNodeId === event.nodeId,
                      'bg-muted/20': expandedNodeId === event.nodeId,
                    }"
                    @click="toggleExpand(event.nodeId)">
                    <td class="text-muted-foreground px-3 py-1 font-mono">{{ event.seq >= 0 ? event.seq : '–' }}</td>
                    <td class="px-3 py-1 font-mono">
                      <span class="flex items-center gap-1">
                        <LucideChevronRight v-if="hasRunData(event)" class="text-muted-foreground h-3 w-3 shrink-0 transition-transform" :class="{ 'rotate-90': expandedNodeId === event.nodeId }" />
                        {{ event.nodeId }}
                      </span>
                    </td>
                    <td class="px-3 py-1">
                      <span
                        class="inline-flex items-center gap-1"
                        :class="{
                          'text-green-600 dark:text-green-500': statusKind(event.status) === 'success',
                          'text-red-600 dark:text-red-500': statusKind(event.status) === 'error',
                          'text-blue-600 dark:text-blue-400': statusKind(event.status) === 'running',
                          'text-muted-foreground': statusKind(event.status) === 'other',
                        }">
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          :class="{
                            'bg-green-500': statusKind(event.status) === 'success',
                            'bg-red-500': statusKind(event.status) === 'error',
                            'animate-pulse bg-blue-500': statusKind(event.status) === 'running',
                            'bg-muted-foreground': statusKind(event.status) === 'other',
                          }" />
                        {{ event.status }}
                      </span>
                    </td>
                    <td class="text-muted-foreground px-3 py-1 font-mono">{{ formatEventTime(event.startTime) }}</td>
                    <td class="text-muted-foreground px-3 py-1 font-mono">{{ formatDuration(event.startTime, event.endTime) }}</td>
                  </tr>
                  <tr v-if="event.error && statusKind(event.status) === 'error'" class="border-b last:border-b-0" :class="{ '!border-b-0': expandedNodeId === event.nodeId }">
                    <td />
                    <td colspan="4" class="px-3 pt-0.5 pb-2">
                      <div class="flex items-start gap-1.5 rounded bg-red-500/10 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400">
                        <LucideTriangleAlert class="mt-0.5 h-3 w-3 shrink-0" />
                        <span class="break-all whitespace-pre-wrap">{{ event.error }}</span>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="expandedNodeId === event.nodeId && hasRunData(event)" class="border-b last:border-b-0">
                    <td />
                    <td colspan="4" class="px-3 pt-0.5 pb-2">
                      <div class="bg-muted/30 flex flex-col overflow-hidden rounded border">
                        <div class="flex items-center gap-0.5 border-b px-2 py-1">
                          <button
                            v-if="event.input != null"
                            class="rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
                            :class="expandedTab === 'input' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                            @click.stop="expandedTab = 'input'">
                            Input
                          </button>
                          <button
                            v-if="event.output != null"
                            class="rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
                            :class="expandedTab === 'output' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                            @click.stop="expandedTab = 'output'">
                            Output
                          </button>
                        </div>
                        <div class="h-48">
                          <JsonCodeEditor
                            v-if="expandedTab === 'input' && event.input != null"
                            :model-value="formatJson(event.input)"
                            :readonly="true"
                            :line-numbers="false"
                            :line-wrapping="true"
                          />
                          <JsonCodeEditor
                            v-else-if="expandedTab === 'output' && event.output != null"
                            :model-value="formatJson(event.output)"
                            :readonly="true"
                            :line-numbers="false"
                            :line-wrapping="true"
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </slot>
      </div>
    </Teleport>
  </div>
</template>
