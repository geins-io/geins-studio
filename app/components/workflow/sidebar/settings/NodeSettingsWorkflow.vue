<script setup lang="ts">
import type { WorkflowSummary, WorkflowInput, WorkflowDefinition } from '#shared/types'

const props = defineProps<{
  nodeData: Record<string, unknown>
  nodeConfig: Record<string, unknown>
  nodeInput: Record<string, unknown>
  updateConfig: (name: string, value: unknown) => void
  updateInput: (name: string, value: unknown) => void
}>()

const route = useRoute()
const { orchestratorApi } = useGeinsRepository()

// Migrate legacy data: old code stored workflowId/workflowName in config instead of input
onMounted(() => {
  for (const key of ['workflowId', 'workflowName'] as const) {
    if (!props.nodeInput[key] && props.nodeConfig[key]) {
      props.updateInput(key, props.nodeConfig[key])
    }
  }
})

// ─── Workflow selector ───────────────────────────────────────────
const currentWorkflowId = computed(() => route.params.id as string)

const { data: allWorkflows } = await useAsyncData<WorkflowSummary[]>(
  'workflows-list-for-selector',
  () => orchestratorApi.workflow.list(),
  { default: () => [] },
)

const onDemandWorkflows = computed(() => {
  const list = Array.isArray(allWorkflows.value) ? allWorkflows.value : []
  return list.filter(
    wf => wf.enabled
      && wf.type?.toLowerCase() === 'ondemand'
      && wf.id !== currentWorkflowId.value,
  )
})

// ─── Fetch input definitions for on-demand workflows ─────────────
const workflowInputDefs = ref<Map<string, WorkflowInput[]>>(new Map())

const fetchWorkflowInputs = async () => {
  const ids = onDemandWorkflows.value.map(wf => wf.id)
  const results = await Promise.allSettled(
    ids.map(id => orchestratorApi.workflow.get(id)),
  )
  const map = new Map<string, WorkflowInput[]>()
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value) {
      const def = result.value as WorkflowDefinition
      if (def.input?.length) map.set(ids[i], def.input)
    }
  })
  workflowInputDefs.value = map
}

watch(onDemandWorkflows, () => { fetchWorkflowInputs() }, { immediate: true })

const getWorkflowInputs = (id: string): WorkflowInput[] =>
  workflowInputDefs.value.get(id) ?? []

const selectedWorkflowInputs = computed(() => {
  const id = props.nodeInput.workflowId as string | undefined
  if (!id) return []
  return getWorkflowInputs(id)
})

// ─── Popover state ───────────────────────────────────────────────
const selectorOpen = ref(false)
const selectorSearch = ref('')

const filteredWorkflows = computed(() => {
  const q = selectorSearch.value.toLowerCase().trim()
  if (!q) return onDemandWorkflows.value
  return onDemandWorkflows.value.filter(
    wf => wf.name.toLowerCase().includes(q)
      || wf.id.toLowerCase().includes(q)
      || wf.description?.toLowerCase().includes(q),
  )
})

const selectedWorkflowName = computed(() => {
  const id = props.nodeInput.workflowId as string | undefined
  if (!id) return ''
  const wf = onDemandWorkflows.value.find(w => w.id === id)
  return wf?.name ?? ''
})

function selectWorkflow(wf: WorkflowSummary) {
  props.updateInput('workflowId', wf.id)
  props.updateInput('workflowName', wf.name)
  selectorOpen.value = false
  selectorSearch.value = ''

  // Auto-populate input parameters from the selected workflow's expected inputs
  const expectedInputs = getWorkflowInputs(wf.id)
  if (expectedInputs.length) {
    const existing = (props.nodeInput.input ?? {}) as Record<string, unknown>
    const merged: Record<string, string> = {}
    for (const inp of expectedInputs) {
      merged[inp.name] = String(existing[inp.name] ?? inp.defaultValue ?? '')
    }
    // Keep any extra keys the user already added that aren't in the expected inputs
    for (const [k, v] of Object.entries(existing)) {
      if (!(k in merged) && k.trim()) merged[k] = String(v ?? '')
    }
    props.updateInput('input', merged)
  }
}

function clearWorkflow() {
  props.updateInput('workflowId', '')
  props.updateInput('workflowName', '')
}

// ─── Input parameters (key-value editor) ─────────────────────────
const inputRaw = computed(() => (props.nodeInput.input ?? {}) as Record<string, unknown>)

const inputPairs = ref<Array<{ key: string, value: string }>>([])

const syncInputFromData = () => {
  const entries = Object.entries(inputRaw.value).filter(([k]) => k !== '')
  inputPairs.value = entries.length > 0
    ? entries.map(([k, v]) => ({ key: k, value: String(v ?? '') }))
    : []
}
syncInputFromData()
watch(inputRaw, syncInputFromData, { deep: true })

const commitInput = () => {
  const obj: Record<string, string> = {}
  for (const p of inputPairs.value) {
    if (p.key.trim()) obj[p.key.trim()] = p.value
  }
  props.updateInput('input', Object.keys(obj).length > 0 ? obj : undefined)
}

const addInputRow = () => {
  inputPairs.value.push({ key: '', value: '' })
}

const removeInputRow = (index: number) => {
  inputPairs.value.splice(index, 1)
  commitInput()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Workflow selector -->
    <div class="space-y-1">
      <label class="text-sm font-medium">
        Workflow
        <span class="text-destructive">*</span>
      </label>
      <p class="text-muted-foreground text-xs">Select an active on-demand workflow to execute</p>

      <Popover v-model:open="selectorOpen">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="bg-background hover:bg-muted flex h-9 w-full items-center gap-2 rounded-md border px-3 text-left text-sm transition-colors"
          >
            <LucideWorkflow class="text-muted-foreground h-4 w-4 shrink-0" />
            <span v-if="nodeInput.workflowId" class="min-w-0 flex-1 truncate">
              {{ selectedWorkflowName || nodeInput.workflowId }}
            </span>
            <span v-else class="text-muted-foreground min-w-0 flex-1 truncate">Select workflow…</span>
            <button
              v-if="nodeInput.workflowId"
              type="button"
              class="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5"
              @click.stop="clearWorkflow"
            >
              <LucideX class="h-3 w-3" />
            </button>
            <LucideChevronsUpDown class="text-muted-foreground h-3.5 w-3.5 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent class="p-0" align="start" :style="{ width: 'var(--reka-popover-trigger-width)' }">
          <div class="border-b p-2">
            <div class="relative">
              <LucideSearch class="text-muted-foreground pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2" />
              <input
                v-model="selectorSearch"
                type="text"
                placeholder="Search workflows…"
                class="bg-muted focus:ring-ring w-full rounded-md py-1.5 pr-2 pl-7 text-xs focus:ring-2 focus:outline-none"
              />
            </div>
          </div>
          <div class="max-h-72 overflow-y-auto p-1">
            <template v-if="filteredWorkflows.length">
              <button
                v-for="wf in filteredWorkflows"
                :key="wf.id"
                type="button"
                class="hover:bg-accent flex w-full flex-col rounded-sm px-2 py-2 text-left text-xs transition-colors"
                :class="nodeInput.workflowId === wf.id ? 'bg-accent' : ''"
                @click="selectWorkflow(wf)"
              >
                <div class="flex w-full items-center gap-2">
                  <LucideCheck
                    v-if="nodeInput.workflowId === wf.id"
                    class="h-3 w-3 shrink-0 text-green-500"
                  />
                  <LucideWorkflow v-else class="text-muted-foreground h-3 w-3 shrink-0" />
                  <span class="min-w-0 flex-1 truncate font-medium">{{ wf.name }}</span>
                  <span v-if="wf.group" class="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px]">{{ wf.group }}</span>
                </div>
                <span v-if="wf.description" class="text-muted-foreground mt-0.5 pl-5 text-[10px]">{{ wf.description }}</span>
                <!-- Input parameters info -->
                <div v-if="getWorkflowInputs(wf.id).length" class="mt-1 flex flex-wrap gap-1 pl-5">
                  <span
                    v-for="inp in getWorkflowInputs(wf.id).slice(0, 5)"
                    :key="inp.name"
                    class="bg-primary/10 text-primary inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px]"
                  >
                    {{ inp.name }}
                    <span class="opacity-50">{{ inp.type }}</span>
                    <span v-if="inp.required" class="text-destructive">*</span>
                  </span>
                  <span
                    v-if="getWorkflowInputs(wf.id).length > 5"
                    class="text-muted-foreground inline-flex items-center px-1 text-[10px]"
                  >
                    +{{ getWorkflowInputs(wf.id).length - 5 }} more
                  </span>
                </div>
                <span class="text-muted-foreground mt-0.5 pl-5 font-mono text-[10px]">{{ wf.id }}</span>
              </button>
            </template>
            <div v-else class="text-muted-foreground px-2 py-4 text-center text-xs">
              <p>No matching workflows</p>
              <p class="mt-1 opacity-60">Only active on-demand workflows are shown</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <!-- Show selected ID for reference -->
      <div v-if="nodeInput.workflowId" class="text-muted-foreground flex items-center gap-1 px-0.5 font-mono text-[10px]">
        <span class="opacity-50">ID:</span>
        <span class="truncate">{{ nodeInput.workflowId }}</span>
      </div>
    </div>

    <!-- Expected inputs from selected workflow -->
    <div v-if="selectedWorkflowInputs.length" class="space-y-2">
      <label class="text-sm font-medium">Expected inputs</label>
      <p class="text-muted-foreground text-xs">The selected workflow declares these input parameters</p>
      <div class="bg-muted/50 space-y-1 rounded-md border px-3 py-2">
        <div
          v-for="inp in selectedWorkflowInputs"
          :key="inp.name"
          class="flex items-center gap-2 text-xs"
        >
          <span class="font-mono font-medium">{{ inp.name }}</span>
          <span class="text-muted-foreground bg-muted rounded px-1 py-0.5 font-mono text-[10px]">{{ inp.type }}</span>
          <span v-if="inp.required" class="text-destructive text-[10px] font-medium">required</span>
          <span v-if="inp.description" class="text-muted-foreground ml-auto truncate text-[10px]">{{ inp.description }}</span>
        </div>
      </div>
    </div>

    <!-- Input parameters -->
    <div class="space-y-2">
      <label class="text-sm font-medium">Input parameters</label>
      <p class="text-muted-foreground text-xs">Key-value pairs passed as input to the child workflow</p>
      <div v-if="inputPairs.length" class="space-y-2">
        <div v-for="(pair, i) in inputPairs" :key="i" class="flex items-center gap-1">
          <input
            v-model="pair.key"
            placeholder="Key"
            class="bg-background focus:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1.5 font-mono text-xs focus:ring-2 focus:outline-none"
            @blur="commitInput()"
          />
          <input
            v-model="pair.value"
            placeholder="Value or {{expression}}"
            class="bg-background focus:ring-ring min-w-0 flex-1 rounded-md border px-2 py-1.5 font-mono text-xs focus:ring-2 focus:outline-none"
            @blur="commitInput()"
          />
          <button class="hover:bg-muted shrink-0 rounded p-1" @click="removeInputRow(i)">
            <LucideX class="text-muted-foreground h-3 w-3" />
          </button>
        </div>
      </div>
      <button
        class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
        @click="addInputRow"
      >
        <LucidePlus class="h-3 w-3" />
        Add parameter
      </button>
    </div>

    <!-- Behaviour options -->
    <div class="border-t pt-4">
      <label class="mb-2 block text-sm font-medium">Behaviour</label>
      <div class="space-y-3">
        <div class="flex items-start gap-2">
          <input
            type="checkbox"
            :checked="Boolean(nodeConfig.waitForCompletion ?? true)"
            class="mt-0.5 rounded border"
            @change="updateConfig('waitForCompletion', ($event.target as HTMLInputElement).checked)"
          />
          <div>
            <label class="text-sm">Wait for completion</label>
            <p class="text-muted-foreground text-xs">Wait for child workflow to finish before continuing</p>
          </div>
        </div>

        <div class="flex items-start gap-2">
          <input
            type="checkbox"
            :checked="Boolean(nodeConfig.cascadeCancellation ?? true)"
            class="mt-0.5 rounded border"
            @change="updateConfig('cascadeCancellation', ($event.target as HTMLInputElement).checked)"
          />
          <div>
            <label class="text-sm">Cascade cancellation</label>
            <p class="text-muted-foreground text-xs">Cancel child workflow if parent is cancelled</p>
          </div>
        </div>

        <div class="flex items-start gap-2">
          <input
            type="checkbox"
            :checked="Boolean(nodeConfig.inheritVariables ?? false)"
            class="mt-0.5 rounded border"
            @change="updateConfig('inheritVariables', ($event.target as HTMLInputElement).checked)"
          />
          <div>
            <label class="text-sm">Inherit variables</label>
            <p class="text-muted-foreground text-xs">Pass parent workflow variables to child</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
