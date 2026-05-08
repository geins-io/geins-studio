<script setup lang="ts">
import { autocompletion, acceptCompletion, startCompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { EditorView, minimalSetup } from 'codemirror'
import type { Ref } from 'vue'

export interface ExpressionCompletion {
  expression: string
  label: string
  detail?: string
  section?: string
}

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  size?: 'default' | 'sm'
}>(), {
  modelValue: '',
  placeholder: '',
  size: 'default',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const hasExpression = (val: string) => val.includes('{{')

const mode = ref<'fixed' | 'expression'>(hasExpression(props.modelValue) ? 'expression' : 'fixed')

const editorContainer = ref<HTMLElement>()
let view: EditorView | null = null

const completions = inject<Ref<ExpressionCompletion[]>>('expressionCompletions', ref([]))
const resolveExpression = inject<(expr: string) => string | null>('resolveExpression', () => null)

const preview = computed(() => {
  if (mode.value !== 'expression' || !props.modelValue) return null

  const exprPattern = /\{\{[^}]+\}\}/g
  const matches = props.modelValue.match(exprPattern)
  if (!matches) return null

  if (matches.length === 1 && props.modelValue.trim() === matches[0]) {
    const resolved = resolveExpression(matches[0])
    return resolved != null ? resolved : null
  }

  let result = props.modelValue
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
  return preview.value.length > 120 ? preview.value.slice(0, 120) + '…' : preview.value
})

const expressionTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    fontSize: '13px',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    overflow: 'hidden',
    lineHeight: '1.5',
  },
  '.cm-content': {
    padding: '0',
    caretColor: 'var(--foreground)',
  },
  '.cm-line': {
    padding: '0',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--foreground)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)',
  },
  '.cm-tooltip.cm-tooltip-autocomplete': {
    backgroundColor: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    fontSize: '12px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    maxHeight: '200px',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
    padding: '3px 8px',
    lineHeight: '1.4',
  },
  '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-foreground)',
  },
  '.cm-completionLabel': {
    fontSize: '12px',
  },
  '.cm-completionDetail': {
    fontSize: '10px',
    opacity: '0.6',
    marginLeft: '8px',
    fontStyle: 'normal',
  },
  '.cm-tooltip.cm-completionInfo': {
    display: 'none',
  },
})

function expressionCompletion(context: CompletionContext): CompletionResult | null {
  const doc = context.state.doc.toString()
  const pos = context.pos

  const before = doc.slice(0, pos)
  const braceStart = before.lastIndexOf('{{')
  if (braceStart === -1) return null

  const afterBraces = before.slice(braceStart + 2)
  if (afterBraces.includes('}}')) return null

  const from = braceStart
  const typed = afterBraces.trimStart()

  const after = doc.slice(pos)
  const closingMatch = after.match(/^\s*\}\}/)
  const to = closingMatch ? pos + closingMatch[0].length : pos

  const items = completions.value
  const filtered = typed
    ? items.filter(c =>
      c.expression.toLowerCase().includes(typed.toLowerCase())
      || c.label.toLowerCase().includes(typed.toLowerCase()),
    )
    : items

  if (filtered.length === 0) return null

  return {
    from,
    to,
    filter: false,
    options: filtered.map(c => ({
      label: c.expression,
      displayLabel: c.label,
      detail: c.detail,
      section: c.section,
    })),
  }
}

function mountEditor() {
  if (!editorContainer.value || view) return

  view = new EditorView({
    doc: props.modelValue,
    extensions: [
      minimalSetup,
      expressionTheme,
      EditorView.lineWrapping,
      EditorState.transactionFilter.of(tr => {
        if (tr.newDoc.lines > 1) return []
        return tr
      }),
      keymap.of([{ key: 'Tab', run: acceptCompletion }]),
      autocompletion({
        override: [expressionCompletion],
        activateOnTyping: true,
        icons: false,
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString())
          const doc = update.state.doc.toString()
          const pos = update.state.selection.main.head
          const before = doc.slice(0, pos)
          if (before.endsWith('{{')) {
            startCompletion(update.view)
          }
        }
      }),
    ],
    parent: editorContainer.value,
  })
}

function destroyEditor() {
  view?.destroy()
  view = null
}

watch(mode, (next) => {
  if (next === 'expression') {
    nextTick(mountEditor)
  }
  else {
    destroyEditor()
  }
})

watch(() => props.modelValue, (val) => {
  if (!view) return
  const current = view.state.doc.toString()
  if (current === val) return
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: val },
  })
})

onMounted(() => {
  if (mode.value === 'expression') {
    mountEditor()
  }
})

onUnmounted(() => {
  destroyEditor()
})

function toggleMode() {
  mode.value = mode.value === 'fixed' ? 'expression' : 'fixed'
}

function onFixedInput(val: string | number) {
  emit('update:modelValue', String(val))
}
</script>

<template>
  <div class="group relative">
    <!-- Fixed mode -->
    <Input
      v-if="mode === 'fixed'"
      :model-value="modelValue"
      :placeholder="placeholder"
      :size="size"
      class="pr-8"
      @update:model-value="onFixedInput"
    />

    <!-- Expression mode -->
    <div v-else>
      <div
        class="flex items-center rounded-md border bg-emerald-500/5 transition-colors"
        :class="[
          size === 'sm' ? 'min-h-8 px-2.5 py-1 text-xs' : 'min-h-9 px-3 py-1.5 text-sm',
          truncatedPreview ? 'rounded-b-none' : '',
        ]"
      >
        <div ref="editorContainer" class="min-w-0 flex-1" />
      </div>
      <div
        v-if="truncatedPreview"
        class="text-muted-foreground truncate rounded-b-md border border-t-0 bg-emerald-500/5 px-2.5 py-1 font-mono text-[10px] leading-tight"
        :title="preview ?? ''"
      >
        <span class="opacity-50">= </span>{{ truncatedPreview }}
      </div>
    </div>

    <!-- Toggle button -->
    <button
      type="button"
      class="absolute right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold transition-colors"
      :class="mode === 'expression'
        ? 'top-1 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
        : 'top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 focus:opacity-100'"
      :title="mode === 'expression' ? 'Switch to fixed value' : 'Switch to expression'"
      @click="toggleMode"
    >
      =
    </button>
  </div>
</template>
