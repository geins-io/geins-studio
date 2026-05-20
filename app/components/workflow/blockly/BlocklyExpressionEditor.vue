<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string
  open?: boolean
}>(), {
  modelValue: '',
  open: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:open': [value: boolean]
}>()

const resolveExpression = inject<(expr: string) => string | null>('resolveExpression', () => null)

// Local draft expression — only applied on confirm
const draftExpression = ref(props.modelValue)

// Sync draft when panel opens with a new value
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    draftExpression.value = props.modelValue
  }
})

// Live preview of the draft expression
const preview = computed(() => {
  if (!draftExpression.value) return null
  const exprPattern = /\{\{[^}]+\}\}/g
  const matches = draftExpression.value.match(exprPattern)
  if (!matches) return null

  if (matches.length === 1 && draftExpression.value.trim() === matches[0]) {
    return resolveExpression(matches[0])
  }

  let result = draftExpression.value
  let anyResolved = false
  for (const m of matches) {
    const resolved = resolveExpression(m)
    if (resolved != null) {
      result = result.replace(m, resolved)
      anyResolved = true
    }
  }
  return anyResolved ? result : null
})

const truncatedPreview = computed(() => {
  if (!preview.value) return null
  return preview.value.length > 200 ? preview.value.slice(0, 200) + '…' : preview.value
})

function onApply() {
  emit('update:modelValue', draftExpression.value)
  emit('update:open', false)
}

function onCancel() {
  emit('update:open', false)
}

function onDraftUpdate(value: string) {
  draftExpression.value = value
}

const validation = computed(() => {
  const expr = draftExpression.value
  if (!expr || !expr.trim()) {
    return { valid: false, error: 'Expression is empty' }
  }

  const inner = expr.replace(/^\{\{|\}\}$/g, '').trim()
  if (!inner) {
    return { valid: false, error: 'Expression is empty' }
  }

  if (/\(\s*,|,\s*,|,\s*\)/.test(inner)) {
    return { valid: false, error: 'Missing function argument — connect all inputs' }
  }

  const zeroArgAllowed = new Set(['Now', 'UtcNow', 'Today', 'NewGuid'])
  const emptyCallMatch = inner.match(/(\w+)\(\s*\)/g)
  if (emptyCallMatch) {
    for (const call of emptyCallMatch) {
      const funcName = call.replace(/\(\s*\)/, '')
      if (!zeroArgAllowed.has(funcName)) {
        return { valid: false, error: `${funcName}() is missing arguments` }
      }
    }
  }

  let depth = 0
  for (const ch of inner) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth < 0) return { valid: false, error: 'Unbalanced parentheses' }
  }
  if (depth !== 0) return { valid: false, error: 'Unbalanced parentheses' }

  return { valid: true, error: null }
})

const BlocklyWorkspace = defineAsyncComponent(() =>
  import('./BlocklyWorkspace.vue'),
)
</script>

<template>
  <div
    class="bg-background absolute inset-y-0 right-0 z-20 flex w-[calc(100%-20px)] flex-col border-l shadow-lg transition-transform duration-200 ease-in-out"
    :class="open ? 'translate-x-0' : 'translate-x-full'"
  >
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 border-b px-4 py-3">
      <div class="flex items-center gap-2 text-sm font-medium">
        <LucideBlocks class="h-4 w-4 shrink-0" />
        Block Expression Editor
      </div>
      <button
        class="text-muted-foreground hover:text-foreground hover:bg-accent rounded-md p-1.5 transition-colors"
        title="Close"
        @click="onCancel"
      >
        <LucideX class="h-4 w-4" />
      </button>
    </div>

    <!-- Validation error -->
    <div
      v-if="!validation.valid"
      class="text-destructive border-b border-red-500/20 bg-red-500/5 px-4 py-2 text-xs"
    >
      <span class="font-medium">Invalid: </span>{{ validation.error }}
    </div>

    <!-- Workspace area -->
    <div class="relative min-h-0 flex-1 overflow-hidden">
      <Suspense>
        <BlocklyWorkspace
          v-if="open"
          :model-value="draftExpression"
          @update:model-value="onDraftUpdate"
        />
        <template #fallback>
          <div class="flex h-full items-center justify-center">
            <LucideLoader2 class="text-muted-foreground size-8 animate-spin" />
          </div>
        </template>
      </Suspense>
    </div>

    <!-- Live preview -->
    <div
      v-if="validation.valid && truncatedPreview"
      class="text-muted-foreground border-t bg-emerald-500/5 px-4 py-2 font-mono text-xs"
    >
      <span class="opacity-50">Result: </span>{{ truncatedPreview }}
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-2 border-t px-4 py-3">
      <Button variant="outline" size="sm" @click="onCancel">
        Cancel
      </Button>
      <Button size="sm" :disabled="!validation.valid" @click="onApply">
        Apply
      </Button>
    </div>
  </div>
</template>
