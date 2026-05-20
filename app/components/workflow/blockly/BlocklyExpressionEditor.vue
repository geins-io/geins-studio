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

// Sync draft when sheet opens with a new value
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

  // Check for empty function arguments: func(, ) or func( ,)
  if (/\(\s*,|,\s*,|,\s*\)/.test(inner)) {
    return { valid: false, error: 'Missing function argument — connect all inputs' }
  }

  // Check for empty function calls with no args where args are required
  // (but allow zero-arg functions like Now(), NewGuid(), UtcNow(), Today())
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

  // Check for unbalanced parentheses
  let depth = 0
  for (const ch of inner) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (depth < 0) return { valid: false, error: 'Unbalanced parentheses' }
  }
  if (depth !== 0) return { valid: false, error: 'Unbalanced parentheses' }

  return { valid: true, error: null }
})

function onOpenChange(value: boolean) {
  if (!value) return
  emit('update:open', value)
}

const BlocklyWorkspace = defineAsyncComponent(() =>
  import('./BlocklyWorkspace.vue'),
)
</script>

<template>
  <Sheet :open="open" :modal="false" @update:open="onOpenChange">
    <SheetContent side="right" :trap-focus="false" class="flex w-[90vw] max-w-[1200px] flex-col sm:max-w-[1200px]" :on-interact-outside="(e: Event) => e.preventDefault()" :on-pointer-down-outside="(e: Event) => e.preventDefault()" :on-focus-outside="(e: Event) => e.preventDefault()" :on-escape-key-down="() => emit('update:open', false)">
      <SheetHeader>
        <SheetTitle class="flex items-center gap-2">
          <LucideBlocks class="size-4" />
          Block Expression Editor
        </SheetTitle>
      </SheetHeader>

      <!-- Workspace area -->
      <div class="relative min-h-0 flex-1 overflow-hidden rounded-md border">
        <Suspense>
          <BlocklyWorkspace
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

      <!-- Validation error -->
      <div
        v-if="!validation.valid"
        class="text-destructive rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs"
      >
        <span class="font-medium">Invalid: </span>{{ validation.error }}
      </div>

      <!-- Live preview -->
      <div
        v-else-if="truncatedPreview"
        class="text-muted-foreground rounded-md border bg-emerald-500/5 px-3 py-2 font-mono text-xs"
      >
        <span class="opacity-50">Result: </span>{{ truncatedPreview }}
      </div>

      <!-- Actions -->
      <SheetFooter class="flex-row justify-end gap-2">
        <Button variant="outline" @click="onCancel">
          Cancel
        </Button>
        <Button :disabled="!validation.valid" @click="onApply">
          Apply
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
