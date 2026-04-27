<script setup lang="ts">
import type { ManifestActionOutput, ManifestNodeTypeConfig } from '#shared/types'
import type { ManifestAction } from '@/composables/useWorkflowManifest'

type NodeExecution = {
  input?: Record<string, unknown> | null
  output?: Record<string, unknown> | null
  status?: string
} | null

const props = defineProps<{
  node: Record<string, unknown> | null
  nodeExecution?: NodeExecution
}>()

const emit = defineEmits<{
  close: []
  delete: []
}>()

const isOpen = computed(() => props.node !== null)

const manifestStore = useWorkflowManifest()

const nodeData = computed(() => (props.node?.data ?? {}) as Record<string, unknown>)
const nodeType = computed(() => (props.node?.type ?? '') as string)

const manifestNodeType = computed(() => manifestStore.getNodeType(nodeType.value))
const manifestAction = computed<ManifestAction | undefined>(() => {
  if (nodeType.value !== 'action') return undefined
  return manifestStore.getAction(nodeData.value.actionName as string | undefined)
})

const nodeTypeConfig = computed<ManifestNodeTypeConfig[]>(
  () => manifestNodeType.value?.config ?? [],
)

const actionInputFields = computed(() => manifestAction.value?.input ?? [])
const actionOutputFields = computed<ManifestActionOutput[]>(() => manifestAction.value?.output ?? [])

const nodeConfig = computed(() => (nodeData.value.config ?? {}) as Record<string, unknown>)
const nodeInput = computed(() => (nodeData.value.input ?? {}) as Record<string, unknown>)

// --- Tabs (n8n-style: Settings / Input / Output) ---
const tabs = computed(() => {
  if (nodeType.value === 'trigger') return ['Settings']
  return ['Settings', 'Input', 'Output']
})
const activeTab = ref(0)

watch(isOpen, (open) => {
  if (!open) activeTab.value = 0
})

const updateConfig = (name: string, value: unknown) => {
  const config = nodeConfig.value
  config[name] = value
}

const updateInput = (name: string, value: unknown) => {
  const input = nodeInput.value
  input[name] = value
}

const prettyLabel = (name: string): string =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ')

const inputTypeToHtml = (type: string): string => {
  const lower = type.toLowerCase()
  if (lower === 'number' || lower === 'integer' || lower === 'int') return 'number'
  if (lower === 'boolean' || lower === 'bool') return 'checkbox'
  return 'text'
}

const isTextarea = (field: { editorHint?: string, type: string }): boolean =>
  field.editorHint === 'textarea'
  || field.editorHint === 'json'
  || field.editorHint === 'expression'
  || field.type.toLowerCase() === 'object'
  || field.type.toLowerCase() === 'json'

const isSelect = (field: { allowedValues?: unknown[] }): boolean =>
  Array.isArray(field.allowedValues) && field.allowedValues.length > 0

const formatJson = (value: unknown): string => {
  if (value == null) return '–'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  }
  catch {
    return String(value)
  }
}

const hasExecutionInput = computed(() => props.nodeExecution?.input != null)
const hasExecutionOutput = computed(() => props.nodeExecution?.output != null)
</script>

<template>
  <div
    class="bg-background absolute inset-y-0 right-0 z-20 flex w-[calc(100%-20px)] flex-col border-l shadow-lg transition-transform duration-200 ease-in-out"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div class="flex items-center gap-2">
        <LucideSettings class="h-4 w-4" />
        <span class="text-sm font-medium">{{ (nodeData.label as string) || 'Node properties' }}</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="node && nodeType !== 'trigger'"
          class="hover:bg-destructive/10 text-destructive rounded p-1.5"
          title="Delete node"
          @click="emit('delete')"
        >
          <LucideTrash2 class="h-4 w-4" />
        </button>
        <button class="hover:bg-accent rounded p-1.5" title="Close" @click="emit('close')">
          <LucideX class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Tab bar -->
    <div v-if="tabs.length > 1" class="flex border-b px-2">
      <button
        v-for="(tab, i) in tabs"
        :key="tab"
        class="relative px-3 py-2 text-xs font-medium transition-colors"
        :class="activeTab === i ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
        @click="activeTab = i"
      >
        {{ tab }}
        <span
          v-if="activeTab === i"
          class="bg-primary absolute inset-x-0 bottom-0 h-0.5 rounded-full"
        />
        <!-- Dot indicators for execution data -->
        <span
          v-if="tab === 'Input' && hasExecutionInput"
          class="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-blue-500"
        />
        <span
          v-if="tab === 'Output' && hasExecutionOutput"
          class="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-green-500"
        />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto" style="scrollbar-gutter: stable;">
      <div v-if="node" class="space-y-4 p-4">
        <!-- ═══════════════════════════════════════════════════
             TAB: Settings
             ═══════════════════════════════════════════════════ -->
        <template v-if="activeTab === 0">
          <!-- Common fields: name + description (not for trigger) -->
          <template v-if="nodeType !== 'trigger'">
            <div class="space-y-2">
              <label class="text-sm font-medium">Name</label>
              <input
                v-model="(nodeData as Record<string, string>).label"
                type="text"
                class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium">Description</label>
              <textarea
                v-model="(nodeData as Record<string, string>).description"
                rows="2"
                class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
          </template>

          <div class="space-y-2">
            <label class="text-sm font-medium">Type</label>
            <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 text-sm capitalize">
              {{ manifestNodeType?.displayName ?? nodeType }}
            </div>
          </div>

          <!-- Trigger (read-only) -->
          <template v-if="nodeType === 'trigger'">
            <div class="border-t pt-4">
              <h4 class="mb-3 text-sm font-medium">Trigger</h4>
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">Trigger type</span>
                  <span class="font-medium capitalize">{{ nodeData.triggerType || 'onDemand' }}</span>
                </div>
                <div v-if="nodeData.cronExpression" class="flex items-center justify-between gap-2">
                  <span class="text-muted-foreground">Cron</span>
                  <span class="font-mono text-xs">{{ nodeData.cronExpression }}</span>
                </div>
                <div
                  v-if="nodeData.eventEntity || nodeData.eventName"
                  class="flex items-center justify-between gap-2"
                >
                  <span class="text-muted-foreground">Event</span>
                  <span class="font-medium">
                    {{ nodeData.eventEntity || nodeData.eventName }}{{ nodeData.eventAction ? ` / ${nodeData.eventAction}` : '' }}
                  </span>
                </div>
                <p class="text-muted-foreground border-t pt-3 text-xs">
                  Trigger configuration is managed in the General tab.
                </p>
              </div>
            </div>
          </template>

          <!-- Action node: actionName + manifest input fields -->
          <template v-if="nodeType === 'action'">
            <div v-if="nodeData.actionName" class="space-y-2">
              <label class="text-sm font-medium">Action</label>
              <div class="text-muted-foreground bg-muted rounded-md px-3 py-2 font-mono text-xs">
                {{ nodeData.actionName }}
              </div>
            </div>

            <div v-if="actionInputFields.length" class="border-t pt-4">
              <h4 class="mb-3 text-sm font-medium">Parameters</h4>
              <div class="space-y-3">
                <div v-for="field in actionInputFields" :key="field.name" class="space-y-1">
                  <label class="text-muted-foreground flex items-center gap-1 text-sm">
                    {{ prettyLabel(field.name) }}
                    <span v-if="field.required" class="text-destructive">*</span>
                  </label>
                  <p v-if="field.description" class="text-muted-foreground text-xs">
                    {{ field.description }}
                  </p>
                  <select
                    v-if="isSelect(field)"
                    :value="nodeInput[field.name] ?? field.default ?? ''"
                    class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    @change="updateInput(field.name, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="">
                      Select…
                    </option>
                    <option
                      v-for="opt in field.allowedValues"
                      :key="String(opt)"
                      :value="opt"
                    >
                      {{ opt }}
                    </option>
                  </select>
                  <textarea
                    v-else-if="isTextarea(field)"
                    :value="typeof nodeInput[field.name] === 'object' ? JSON.stringify(nodeInput[field.name], null, 2) : String(nodeInput[field.name] ?? field.default ?? '')"
                    rows="3"
                    :placeholder="field.editorHint === 'expression' ? '{{ expression }}' : ''"
                    class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
                    @input="updateInput(field.name, ($event.target as HTMLTextAreaElement).value)"
                  />
                  <div
                    v-else-if="inputTypeToHtml(field.type) === 'checkbox'"
                    class="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      :checked="Boolean(nodeInput[field.name] ?? field.default)"
                      class="rounded border"
                      @change="updateInput(field.name, ($event.target as HTMLInputElement).checked)"
                    />
                  </div>
                  <input
                    v-else
                    :type="inputTypeToHtml(field.type)"
                    :value="nodeInput[field.name] ?? field.default ?? ''"
                    :placeholder="String(field.default ?? '')"
                    class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    @input="updateInput(field.name, ($event.target as HTMLInputElement).value)"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- Structural node types: manifest config fields -->
          <template v-if="nodeType !== 'trigger' && nodeType !== 'action' && nodeTypeConfig.length">
            <div class="border-t pt-4">
              <h4 class="mb-3 text-sm font-medium">
                {{ manifestNodeType?.displayName ?? prettyLabel(nodeType) }} Settings
              </h4>
              <div class="space-y-3">
                <div v-for="field in nodeTypeConfig" :key="field.name" class="space-y-1">
                  <label class="text-muted-foreground flex items-center gap-1 text-sm">
                    {{ prettyLabel(field.name) }}
                    <span v-if="field.required" class="text-destructive">*</span>
                  </label>
                  <p v-if="field.description" class="text-muted-foreground text-xs">
                    {{ field.description }}
                  </p>
                  <textarea
                    v-if="isTextarea(field)"
                    :value="typeof nodeConfig[field.name] === 'object' ? JSON.stringify(nodeConfig[field.name], null, 2) : String(nodeConfig[field.name] ?? field.defaultValue ?? '')"
                    rows="3"
                    :placeholder="field.editorHint === 'expression' ? '{{ expression }}' : ''"
                    class="bg-background focus:ring-ring w-full resize-none rounded-md border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
                    @input="updateConfig(field.name, ($event.target as HTMLTextAreaElement).value)"
                  />
                  <div
                    v-else-if="inputTypeToHtml(field.type) === 'checkbox'"
                    class="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      :checked="Boolean(nodeConfig[field.name] ?? field.defaultValue)"
                      class="rounded border"
                      @change="updateConfig(field.name, ($event.target as HTMLInputElement).checked)"
                    />
                  </div>
                  <input
                    v-else
                    :type="inputTypeToHtml(field.type)"
                    :value="nodeConfig[field.name] ?? field.defaultValue ?? ''"
                    :placeholder="String(field.defaultValue ?? '')"
                    class="bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                    @input="updateConfig(field.name, ($event.target as HTMLInputElement).value)"
                  />
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- ═══════════════════════════════════════════════════
             TAB: Input
             ═══════════════════════════════════════════════════ -->
        <template v-if="activeTab === 1">
          <!-- Schema from manifest -->
          <div v-if="actionInputFields.length" class="space-y-3">
            <h4 class="text-sm font-medium">Schema</h4>
            <div class="space-y-1">
              <div
                v-for="field in actionInputFields"
                :key="field.name"
                class="flex items-center justify-between rounded px-2 py-1.5 text-xs odd:bg-transparent even:bg-transparent"
              >
                <div class="flex items-center gap-1.5">
                  <span class="font-mono font-medium">{{ field.name }}</span>
                  <span v-if="field.required" class="text-destructive text-[10px]">required</span>
                </div>
                <span class="text-muted-foreground font-mono">{{ field.type }}</span>
              </div>
            </div>
          </div>

          <!-- Node type config schema for structural nodes -->
          <div v-else-if="nodeTypeConfig.length" class="space-y-3">
            <h4 class="text-sm font-medium">Schema</h4>
            <div class="space-y-1">
              <div
                v-for="field in nodeTypeConfig"
                :key="field.name"
                class="flex items-center justify-between rounded px-2 py-1.5 text-xs"
              >
                <div class="flex items-center gap-1.5">
                  <span class="font-mono font-medium">{{ field.name }}</span>
                  <span v-if="field.required" class="text-destructive text-[10px]">required</span>
                </div>
                <span class="text-muted-foreground font-mono">{{ field.type }}</span>
              </div>
            </div>
          </div>

          <!-- Execution input data -->
          <div class="border-t pt-4">
            <div class="mb-2 flex items-center justify-between">
              <h4 class="text-sm font-medium">Run data</h4>
              <span
                v-if="nodeExecution?.status"
                class="rounded px-1.5 py-0.5 text-[10px] font-medium capitalize"
                :class="{
                  'bg-green-500/10 text-green-600 dark:text-green-400': nodeExecution.status === 'completed' || nodeExecution.status === 'succeeded',
                  'bg-red-500/10 text-red-600 dark:text-red-400': nodeExecution.status === 'failed',
                  'bg-blue-500/10 text-blue-600 dark:text-blue-400': nodeExecution.status === 'running',
                  'bg-muted text-muted-foreground': !['completed', 'succeeded', 'failed', 'running'].includes(nodeExecution.status ?? ''),
                }"
              >
                {{ nodeExecution.status }}
              </span>
            </div>
            <template v-if="hasExecutionInput">
              <pre class="bg-muted max-h-60 overflow-auto rounded-md p-3 font-mono text-xs leading-relaxed">{{ formatJson(nodeExecution?.input) }}</pre>
            </template>
            <div
              v-else
              class="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed p-4 text-xs"
            >
              <LucideInbox class="h-4 w-4 shrink-0" />
              <span>Run the workflow to see input data</span>
            </div>
          </div>
        </template>

        <!-- ═══════════════════════════════════════════════════
             TAB: Output
             ═══════════════════════════════════════════════════ -->
        <template v-if="activeTab === 2">
          <!-- Output schema from manifest (action nodes) -->
          <div v-if="actionOutputFields.length" class="space-y-3">
            <h4 class="text-sm font-medium">Schema</h4>
            <div class="space-y-1">
              <div
                v-for="field in actionOutputFields"
                :key="field.name"
                class="flex items-center justify-between rounded px-2 py-1.5 text-xs"
              >
                <div class="flex items-center gap-1.5">
                  <span class="font-mono font-medium">{{ field.name }}</span>
                </div>
                <span class="text-muted-foreground font-mono">{{ field.type }}</span>
              </div>
            </div>
            <div v-if="actionOutputFields.some(f => f.description)" class="space-y-1">
              <div
                v-for="field in actionOutputFields.filter(f => f.description)"
                :key="field.name"
                class="text-muted-foreground text-xs"
              >
                <span class="font-mono font-medium">{{ field.name }}</span>: {{ field.description }}
              </div>
            </div>
          </div>

          <!-- Execution output data -->
          <div :class="{ 'border-t pt-4': actionOutputFields.length }">
            <h4 class="mb-2 text-sm font-medium">Run data</h4>
            <template v-if="hasExecutionOutput">
              <pre class="bg-muted max-h-60 overflow-auto rounded-md p-3 font-mono text-xs leading-relaxed">{{ formatJson(nodeExecution?.output) }}</pre>
            </template>
            <div
              v-else
              class="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed p-4 text-xs"
            >
              <LucideInbox class="h-4 w-4 shrink-0" />
              <span>Run the workflow to see output data</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
