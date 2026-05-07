<script setup lang="ts">
const props = defineProps<{
  nodeData: Record<string, unknown>
  nodeInput: Record<string, unknown>
  updateInput: (name: string, value: unknown) => void
}>()

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

function emitMapping() {
  const currentKeys = new Set(Object.keys(props.nodeInput))
  const newKeys = new Set<string>()

  for (const pair of pairs.value) {
    const k = pair.key.trim()
    if (k) {
      props.updateInput(k, pair.value)
      newKeys.add(k)
    }
  }

  for (const oldKey of currentKeys) {
    if (!newKeys.has(oldKey)) {
      props.updateInput(oldKey, undefined)
    }
  }
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
</script>

<template>
  <div class="space-y-4">
    <div>
      <div class="mb-2 flex items-center justify-between">
        <label class="text-sm font-medium">Mapping</label>
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          @click="addPair"
        >
          <LucidePlus class="h-3 w-3" />
          Add field
        </button>
      </div>
      <p class="text-muted-foreground mb-3 text-xs">
        Define output fields and their values. Use expressions like <code class="bg-muted rounded px-1" v-text="'{{node.field}}'" /> to reference upstream data.
      </p>

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
    </div>

    <div v-if="pairs.some(p => p.key.trim())" class="border-t pt-3">
      <p class="text-muted-foreground mb-2 text-[10px] font-medium tracking-wider uppercase">Preview</p>
      <pre class="bg-muted overflow-x-auto rounded-md border p-2 font-mono text-xs">{{ JSON.stringify(
        Object.fromEntries(pairs.filter(p => p.key.trim()).map(p => [p.key, p.value])),
        null,
        2,
      ) }}</pre>
    </div>
  </div>
</template>
