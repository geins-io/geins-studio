<script setup lang="ts">
import JsonCodeEditor from '@/components/shared/JsonCodeEditor.vue'

const props = defineProps<{
  nodeData: Record<string, unknown>
  nodeInput: Record<string, unknown>
  updateInput: (name: string, value: unknown) => void
}>()

const mode = ref<'fields' | 'json'>('fields')

const pairs = ref<Array<{ key: string, value: string }>>([])

function syncFromInput() {
  const entries = Object.entries(props.nodeInput).filter(([k]) => k !== '')
  pairs.value = entries.length > 0
    ? entries.map(([k, v]) => ({ key: k, value: String(v ?? '') }))
    : [{ key: '', value: '' }]
}
syncFromInput()

function applyMapping(obj: Record<string, string>) {
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

function emitMapping() {
  const obj: Record<string, string> = {}
  for (const pair of pairs.value) {
    const k = pair.key.trim()
    if (k) obj[k] = pair.value
  }
  applyMapping(obj)
}

function addPair() {
  pairs.value.push({ key: '', value: '' })
}

function removePair(index: number) {
  pairs.value.splice(index, 1)
  if (pairs.value.length === 0) pairs.value.push({ key: '', value: '' })
  emitMapping()
}

function onPairUpdate() {
  emitMapping()
}

// ─── JSON mode ───────────────────────────────────────────────────
const jsonText = ref('')
const jsonError = ref('')

function buildJsonFromInput(): string {
  const obj: Record<string, string> = {}
  for (const [k, v] of Object.entries(props.nodeInput)) {
    if (k) obj[k] = String(v ?? '')
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
    applyMapping({})
    return
  }
  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      jsonError.value = 'Must be a JSON object'
      return
    }
    jsonError.value = ''
    const obj: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed)) {
      obj[k] = typeof v === 'string' ? v : JSON.stringify(v)
    }
    applyMapping(obj)
  }
  catch {
    jsonError.value = 'Invalid JSON'
  }
}
</script>

<template>
  <!-- Fields mode -->
  <div v-if="mode === 'fields'">
    <div class="mb-3 flex items-center justify-between">
      <label class="text-sm font-medium">Mapping</label>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          @click="addPair"
        >
          <LucidePlus class="h-3 w-3" />
          Add field
        </button>
        <div class="bg-muted flex rounded-md p-0.5">
          <button
            type="button"
            class="rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors bg-background text-foreground shadow-sm"
            @click="mode = 'fields'"
          >
            Fields
          </button>
          <button
            type="button"
            class="rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors text-muted-foreground hover:text-foreground"
            @click="mode = 'json'"
          >
            JSON
          </button>
        </div>
      </div>
    </div>

    <div class="divide-y border-y">
      <div
        v-for="(pair, index) in pairs"
        :key="index"
        class="flex items-start gap-2 py-3"
      >
        <div class="min-w-0 flex-1 space-y-1.5">
          <Input
            :model-value="pair.key"
            placeholder="Output field name"
            size="sm"
            @update:model-value="pair.key = String($event)"
            @blur="emitMapping()"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          />
          <Input
            :model-value="pair.value"
            placeholder="Value or {{ expression }}"
            size="sm"
            input-class="font-mono"
            @update:model-value="pair.value = String($event); onPairUpdate()"
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
  </div>

  <!-- JSON mode — fills the entire pane -->
  <div v-else class="absolute inset-0 flex flex-col">
    <div class="flex items-center justify-between px-4 py-2">
      <label class="text-sm font-medium">Mapping</label>
      <div class="bg-muted flex rounded-md p-0.5">
        <button
          type="button"
          class="rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors text-muted-foreground hover:text-foreground"
          @click="mode = 'fields'"
        >
          Fields
        </button>
        <button
          type="button"
          class="rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors bg-background text-foreground shadow-sm"
          @click="mode = 'json'"
        >
          JSON
        </button>
      </div>
    </div>
    <div
      class="relative min-h-0 flex-1 transition-colors duration-200"
      :class="jsonError ? 'border-2 border-amber-500/60' : 'border-t'"
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
        expand-title="Mapping JSON"
        @update:model-value="onJsonChange"
      />
    </div>
  </div>
</template>
