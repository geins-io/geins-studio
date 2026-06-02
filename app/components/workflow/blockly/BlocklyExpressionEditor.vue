<script setup lang="ts">
import type { ManifestExpressionFunction } from '#shared/types'
import type { ExpressionCompletion } from '@/components/workflow/shared/ExpressionInput.vue'
import type { Ref } from 'vue'

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

const completions = inject<Ref<ExpressionCompletion[]>>('expressionCompletions', ref([]))
const expressionFunctions = inject<Ref<ManifestExpressionFunction[]>>('expressionFunctions', ref([]))

const draftExpression = ref(props.modelValue)

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    draftExpression.value = props.modelValue
  }
})

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
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 bg-black/80" />
  </Teleport>
  <Dialog :modal="false" :open="open">
    <DialogContent
      :trap-focus="false"
      class="flex h-[85vh] w-[90vw] max-w-[1200px] flex-col gap-3 sm:max-w-[1200px]"
      :on-pointer-down-outside="(e: Event) => e.preventDefault()"
      :on-focus-outside="(e: Event) => e.preventDefault()"
    >
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <LucideBlocks class="size-4" />
          Block Expression Editor
        </DialogTitle>
      </DialogHeader>

      <!-- Validation error -->
      <div
        v-if="!validation.valid"
        class="text-destructive rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs"
      >
        <span class="font-medium">Invalid: </span>{{ validation.error }}
      </div>

      <!-- Workspace area -->
      <div class="relative min-h-0 flex-1 overflow-hidden rounded-md border">
        <Suspense>
          <BlocklyWorkspace
            :model-value="draftExpression"
            :completions="completions"
            :expression-functions="expressionFunctions"
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
        class="text-muted-foreground rounded-md border bg-emerald-500/5 px-3 py-2 font-mono text-xs"
      >
        <span class="opacity-50">Result: </span>{{ truncatedPreview }}
      </div>

      <!-- Actions -->
      <DialogFooter>
        <Button variant="outline" @click="onCancel">
          Cancel
        </Button>
        <Button :disabled="!validation.valid" @click="onApply">
          Apply
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
