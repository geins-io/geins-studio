<script setup lang="ts">
import { autocompletion, acceptCompletion, startCompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { EditorView, minimalSetup } from 'codemirror'
import type { ManifestExpressionFunction } from '#shared/types'
import type { Ref } from 'vue'

export interface ExpressionCompletion {
  expression: string
  label: string
  detail?: string
  section?: string
  type?: 'path' | 'function'
}

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  size?: 'default' | 'sm'
  defaultMode?: 'fixed' | 'expression'
}>(), {
  modelValue: '',
  placeholder: '',
  size: 'default',
  defaultMode: 'fixed',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const hasExpression = (val: string) => val.includes('{{')

const mode = ref<'fixed' | 'expression'>(hasExpression(props.modelValue) ? 'expression' : props.defaultMode)

const editorContainer = ref<HTMLElement>()
let view: EditorView | null = null

const completions = inject<Ref<ExpressionCompletion[]>>('expressionCompletions', ref([]))
const resolveExpression = inject<(expr: string) => string | null>('resolveExpression', () => null)
const expressionFunctions = inject<Ref<ManifestExpressionFunction[]>>('expressionFunctions', ref([]))

// ─── Function reference panel ─────────────────────────────────────
const showFnRef = ref(false)

const fnCategories = computed(() => {
  const map = new Map<string, ManifestExpressionFunction[]>()
  for (const fn of expressionFunctions.value) {
    const cat = fn.category ?? 'Other'
    const list = map.get(cat)
    if (list) list.push(fn)
    else map.set(cat, [fn])
  }
  return map
})

const activeFnCategory = ref<string>('')

watch(fnCategories, (cats) => {
  if (!activeFnCategory.value && cats.size > 0) {
    activeFnCategory.value = cats.keys().next().value!
  }
}, { immediate: true })

function fnSignature(fn: ManifestExpressionFunction): string {
  const params = (fn.parameters ?? []).map((p) => {
    const opt = p.required === false ? '?' : ''
    return `${p.name}${opt}: ${p.type}`
  })
  return `${fn.name}(${params.join(', ')})`
}

function insertFunction(fn: ManifestExpressionFunction) {
  const template = `{{${fn.name}()}}`
  emit('update:modelValue', template)
  showFnRef.value = false
  if (mode.value !== 'expression') mode.value = 'expression'
}

// ─── Expression preview ───────────────────────────────────────────
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

// ─── CodeMirror theme ─────────────────────────────────────────────
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

// ─── Autocomplete ─────────────────────────────────────────────────

function isInsideFunctionParens(afterBraces: string): { insideFn: true, argText: string } | { insideFn: false } {
  let depth = 0
  let lastArgStart = -1
  for (let i = afterBraces.length - 1; i >= 0; i--) {
    const ch = afterBraces[i]
    if (ch === ')') depth++
    else if (ch === '(') {
      if (depth > 0) depth--
      else {
        lastArgStart = i
        break
      }
    }
  }
  if (lastArgStart === -1) return { insideFn: false }

  const lastComma = afterBraces.lastIndexOf(',')
  const argStart = Math.max(lastArgStart + 1, lastComma + 1)
  return { insideFn: true, argText: afterBraces.slice(argStart).trimStart() }
}

function expressionCompletion(context: CompletionContext): CompletionResult | null {
  const doc = context.state.doc.toString()
  const pos = context.pos

  const before = doc.slice(0, pos)
  const braceStart = before.lastIndexOf('{{')
  if (braceStart === -1) return null

  const afterBraces = before.slice(braceStart + 2)
  if (afterBraces.includes('}}')) return null

  const after = doc.slice(pos)
  const closingMatch = after.match(/^\s*\}\}/)

  const items = completions.value
  const parenCtx = isInsideFunctionParens(afterBraces)

  if (parenCtx.insideFn) {
    const typed = parenCtx.argText
    const pathItems = items.filter(c => c.type !== 'function')
    const filtered = typed
      ? pathItems.filter(c =>
        c.expression.toLowerCase().includes(typed.toLowerCase())
        || c.label.toLowerCase().includes(typed.toLowerCase()),
      )
      : pathItems

    if (filtered.length === 0) return null

    return {
      from: pos - typed.length,
      to: pos,
      filter: false,
      options: filtered.map(c => {
        const bare = c.expression.replace(/^\{\{|\}\}$/g, '')
        return {
          label: bare,
          displayLabel: c.label,
          detail: c.detail,
          section: c.section,
        }
      }),
    }
  }

  const from = braceStart
  const to = closingMatch ? pos + closingMatch[0].length : pos
  const typed = afterBraces.trimStart()

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
    options: filtered.map((c) => {
      if (c.type === 'function') {
        return {
          label: `{{${c.expression}`,
          displayLabel: c.label,
          detail: c.detail,
          section: c.section,
          apply: (view: EditorView, _completion: unknown, fnFrom: number, fnTo: number) => {
            const insert = `{{${c.expression})}}`
            const cursorPos = fnFrom + insert.length - 3
            view.dispatch({
              changes: { from: fnFrom, to: fnTo, insert },
              selection: { anchor: cursorPos },
            })
          },
        }
      }
      return {
        label: c.expression,
        displayLabel: c.label,
        detail: c.detail,
        section: c.section,
      }
    }),
  }
}

// ─── Editor lifecycle ─────────────────────────────────────────────
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
          const d = update.state.doc.toString()
          const p = update.state.selection.main.head
          const b = d.slice(0, p)
          if (b.endsWith('{{')) {
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

    <!-- Buttons (fx toggle + function reference) -->
    <div
      class="absolute right-1.5 z-10 flex items-center gap-0.5"
      :class="mode === 'expression' ? 'top-1' : 'top-1/2 -translate-y-1/2'"
    >
      <!-- Function reference button (expression mode only) -->
      <Popover v-if="mode === 'expression' && expressionFunctions.length > 0" v-model:open="showFnRef">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold transition-colors"
            :class="showFnRef
              ? 'bg-primary/15 text-primary'
              : 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'"
            title="Expression functions"
          >
            ƒ
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          :side-offset="8"
          class="w-[360px] p-0"
        >
          <!-- Category tabs -->
          <div class="flex gap-1 overflow-x-auto border-b px-2 py-1.5">
            <button
              v-for="[cat] in fnCategories"
              :key="cat"
              type="button"
              class="shrink-0 rounded px-2 py-0.5 text-[10px] font-medium transition-colors"
              :class="activeFnCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              @click="activeFnCategory = cat"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Function list -->
          <div class="max-h-[320px] overflow-y-auto p-2">
            <div
              v-for="fn in fnCategories.get(activeFnCategory)"
              :key="fn.name"
              class="hover:bg-muted/50 group/fn cursor-pointer rounded-md px-2.5 py-2 transition-colors"
              @click="insertFunction(fn)"
            >
              <div class="flex items-center justify-between gap-2">
                <code class="text-xs font-semibold">{{ fn.name }}</code>
                <span class="bg-muted text-muted-foreground rounded px-1 py-0.5 text-[9px] font-mono">→ {{ fn.returnType ?? '?' }}</span>
              </div>
              <div class="mt-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                {{ fnSignature(fn) }}
              </div>
              <p v-if="fn.description" class="text-muted-foreground mt-0.5 text-[10px]">
                {{ fn.description }}
              </p>
              <div
                v-if="fn.example"
                class="bg-muted/70 mt-1 rounded px-2 py-1 font-mono text-[10px]"
              >
                {{ fn.example }}
              </div>
              <div
                v-if="fn.aliases?.length"
                class="text-muted-foreground mt-0.5 text-[9px]"
              >
                alias: {{ fn.aliases.join(', ') }}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <!-- fx toggle -->
      <button
        type="button"
        class="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold transition-colors"
        :class="mode === 'expression'
          ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
          : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 focus:opacity-100'"
        :title="mode === 'expression' ? 'Switch to fixed value' : 'Switch to expression'"
        @click="toggleMode"
      >
        =
      </button>
    </div>
  </div>
</template>
