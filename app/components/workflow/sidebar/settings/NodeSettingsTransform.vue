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

watch(() => props.nodeInput, (next) => {
  const currentKeys = pairs.value.map(p => p.key).sort().join(',')
  const nextKeys = Object.keys(next).sort().join(',')
  if (currentKeys !== nextKeys) syncFromInput()
}, { deep: true })

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
  <div class="space-y-4">
    <div>
      <div class="mb-2 flex items-center justify-between">
        <label class="text-sm font-medium">Mapping</label>
        <div class="flex items-center gap-2">
          <button
            v-if="mode === 'fields'"
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
      </div>
      <p class="text-muted-foreground mb-3 text-xs">
        Define output fields and their values. Use expressions like <code class="bg-muted rounded px-1" v-text="'{{node.field}}'" /> to reference upstream data.
      </p>

      <!-- Fields mode -->
      <template v-if="mode === 'fields'">
        <div class="space-y-2">
          <div
            v-for="(pair, index) in pairs"
            :key="index"
            class="flex items-start gap-1.5"
          >
            <div class="min-w-0 flex-1 space-y-1">
              <Input
                :model-value="pair.key"
                placeholder="Output field name"
                size="sm"
                @update:model-value="pair.key = String($event); onPairUpdate()"
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
              <LucideX class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div v-if="pairs.some(p => p.key.trim())" class="mt-4 border-t pt-3">
          <p class="text-muted-foreground mb-2 text-[10px] font-medium tracking-wider uppercase">Preview</p>
          <pre class="bg-muted overflow-x-auto rounded-md border p-2 font-mono text-xs">{{ JSON.stringify(
            Object.fromEntries(pairs.filter(p => p.key.trim()).map(p => [p.key, p.value])),
            null,
            2,
          ) }}</pre>
        </div>
      </template>

      <!-- JSON mode -->
      <template v-else>
        <div class="h-48">
          <JsonCodeEditor
            :model-value="jsonText"
            :line-numbers="false"
            :line-wrapping="true"
            @update:model-value="onJsonChange"
          />
        </div>
        <p v-if="jsonError" class="text-destructive mt-1 text-xs">
          {{ jsonError }}
        </p>
      </template>
    </div>
  </div>
</template>
