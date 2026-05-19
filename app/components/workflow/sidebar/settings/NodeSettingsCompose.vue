<script setup lang="ts">
import JsonCodeEditor from '@/components/shared/JsonCodeEditor.vue'
import ExpressionInput from '@/components/workflow/shared/ExpressionInput.vue'

const props = defineProps<{
  nodeData: Record<string, unknown>
  nodeInput: Record<string, unknown>
  updateInput: (name: string, value: unknown) => void
}>()

const mode = ref<'fields' | 'json'>('fields')

let nextPairId = 0

interface ComposePair {
  id: number
  key: string
  value: unknown
}

const pairs = ref<ComposePair[]>([])

function makePair(key = '', value: unknown = ''): ComposePair {
  return { id: nextPairId++, key, value }
}

function displayValue(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

function syncFromInput() {
  const entries = Object.entries(props.nodeInput).filter(([k]) => k !== '')
  pairs.value = entries.length > 0
    ? entries.map(([k, v]) => makePair(k, v ?? ''))
    : [makePair()]
}
syncFromInput()

function applyFields(obj: Record<string, unknown>) {
  const currentKeys = new Set(Object.keys(props.nodeInput))
  const newKeys = new Set<string>()

  for (const [k, v] of Object.entries(obj)) {
    if (k) {
      props.updateInput(k, v)
      newKeys.add(k)
    }
  }

  for (const oldKey of currentKeys) {
    if (!newKeys.has(oldKey)) {
      props.updateInput(oldKey, undefined)
    }
  }
}

function emitFields() {
  const obj: Record<string, unknown> = {}
  for (const pair of pairs.value) {
    const k = pair.key.trim()
    if (k) obj[k] = pair.value
  }
  applyFields(obj)
}

function addPair() {
  pairs.value.push(makePair())
}

function removePair(index: number) {
  pairs.value.splice(index, 1)
  if (pairs.value.length === 0) pairs.value.push(makePair())
  emitFields()
}

let valueDebounceTimer: ReturnType<typeof setTimeout> | undefined

function onValueChange(pair: ComposePair, val: unknown) {
  pair.value = val
  clearTimeout(valueDebounceTimer)
  valueDebounceTimer = setTimeout(emitFields, 300)
}

function onKeyBlur() {
  emitFields()
}

// ─── JSON mode ───────────────────────────────────────────────────
const jsonText = ref('')
const jsonError = ref('')

function buildJsonFromInput(): string {
  const obj: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(props.nodeInput)) {
    if (k) obj[k] = v ?? ''
  }
  return Object.keys(obj).length > 0 ? JSON.stringify(obj, null, 2) : '{\n  \n}'
}

watch(mode, (next) => {
  if (next === 'json') {
    jsonText.value = buildJsonFromInput()
    jsonError.value = ''
  }
  else {
    syncFromInput()
  }
})

function onJsonChange(text: string) {
  jsonText.value = text
  const trimmed = text.trim()
  if (!trimmed || trimmed === '{}') {
    jsonError.value = ''
    applyFields({})
    return
  }
  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      jsonError.value = 'Must be a JSON object'
      return
    }
    jsonError.value = ''
    const obj: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(parsed)) {
      obj[k] = v
    }
    applyFields(obj)
  }
  catch {
    jsonError.value = 'Invalid JSON'
  }
}

onUnmounted(() => {
  clearTimeout(valueDebounceTimer)
})
</script>

<template>
  <div class="flex flex-col" :class="mode === 'json' ? 'absolute inset-0 p-4' : ''">
    <!-- Shared header — always in the same position -->
    <div class="mb-3 flex items-center justify-between">
      <label class="text-sm font-medium">Fields</label>
      <div class="bg-muted flex rounded-md p-0.5">
        <button
          type="button"
          class="rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
          :class="mode === 'fields' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="mode = 'fields'"
        >
          Fields
        </button>
        <button
          type="button"
          class="rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors"
          :class="mode === 'json' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="mode = 'json'"
        >
          JSON
        </button>
      </div>
    </div>

    <!-- Fields mode -->
    <template v-if="mode === 'fields'">
      <p class="text-muted-foreground mb-3 text-xs">
        Each field becomes a key in the output object. Use expressions to reference upstream data.
      </p>

      <div class="divide-y border-y">
        <div
          v-for="(pair, index) in pairs"
          :key="pair.id"
          class="flex items-start gap-2 py-3"
        >
          <div class="min-w-0 flex-1 space-y-1.5">
            <Input
              :model-value="pair.key"
              placeholder="Field name"
              size="sm"
              @update:model-value="pair.key = String($event)"
              @blur="onKeyBlur"
              @keydown.enter="($event.target as HTMLInputElement).blur()"
            />
            <ExpressionInput
              :model-value="displayValue(pair.value)"
              placeholder="Value or {{expression}}"
              size="sm"
              :default-mode="String(pair.value).includes('{{') ? 'expression' : 'fixed'"
              @update:model-value="onValueChange(pair, String($event))"
            />
          </div>
          <button
            type="button"
            class="text-muted-foreground hover:text-destructive mt-1 shrink-0 p-1"
            title="Remove field"
            @click="removePair(index)"
          >
            <LucideTrash class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <button
        type="button"
        class="text-muted-foreground hover:text-foreground mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed py-2 text-xs transition-colors"
        @click="addPair"
      >
        <LucidePlus class="h-3 w-3" />
        Add field
      </button>
    </template>

    <!-- JSON mode — fills remaining height -->
    <div
      v-else
      class="relative min-h-0 flex-1 overflow-hidden rounded-lg transition-colors duration-200"
      :class="jsonError ? 'border-2 border-amber-500/60' : 'border'"
    >
      <span
        v-if="jsonError"
        class="absolute top-2 right-2 z-10 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
      >
        {{ jsonError }}
      </span>
      <JsonCodeEditor
        :model-value="jsonText"
        :line-numbers="false"
        :line-wrapping="true"
        :expandable="true"
        expand-title="Compose Object JSON"
        @update:model-value="onJsonChange"
      />
    </div>
  </div>
</template>
