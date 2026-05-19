<script setup lang="ts">
import ExpressionInput from '@/components/workflow/shared/ExpressionInput.vue'
import type { ExpressionCompletion } from '@/components/workflow/shared/ExpressionInput.vue'
import type { Ref } from 'vue'

type ConditionEntry = { label: string, condition: string, description?: string }

const props = defineProps<{
  nodeData: Record<string, unknown>
  nodeConfig: Record<string, unknown>
  updateConfig: (name: string, value: unknown) => void
}>()

const onNodeSettingsChange = inject<() => void>('onNodeSettingsChange', () => {})
const removeEdgesForSourceHandle = inject<(sourceId: string, handleId: string) => void>('removeEdgesForSourceHandle', () => {})
const renameEdgeSourceHandle = inject<(sourceId: string, oldHandle: string, newHandle: string) => void>('renameEdgeSourceHandle', () => {})
const selectedNodeId = inject<Ref<string>>('selectedNodeId', ref(''))

const conditions = computed<ConditionEntry[]>(() =>
  (props.nodeData.conditions as ConditionEntry[] | undefined) ?? [],
)

const defaultLabel = computed<string>(() =>
  (props.nodeData.defaultLabel as string | undefined) ?? '',
)

function updateConditions(updated: ConditionEntry[]) {
  // eslint-disable-next-line vue/no-mutating-props -- nodeData is a shared reactive object mutated by all settings panels
  props.nodeData.conditions = updated
  onNodeSettingsChange()
}

function updateDefaultLabel(val: string) {
  const oldLabel = defaultLabel.value
  if (oldLabel && selectedNodeId.value) {
    if (!val) {
      removeEdgesForSourceHandle(selectedNodeId.value, oldLabel)
    } else if (oldLabel !== val) {
      renameEdgeSourceHandle(selectedNodeId.value, oldLabel, val)
    }
  }
  // eslint-disable-next-line vue/no-mutating-props -- nodeData is a shared reactive object mutated by all settings panels
  props.nodeData.defaultLabel = val || undefined
  onNodeSettingsChange()
}

function addCondition() {
  const color = nextColor()
  const updated = [...conditions.value, { label: '', condition: '', description: '' }]
  persistColors([...conditionColors.value, color])
  updateConditions(updated)
}

function removeCondition(index: number) {
  const label = conditions.value[index]?.label
  if (label && selectedNodeId.value) {
    removeEdgesForSourceHandle(selectedNodeId.value, label)
  }
  const updated = conditions.value.filter((_, i) => i !== index)
  persistColors(conditionColors.value.filter((_, i) => i !== index))
  updateConditions(updated)
}

function duplicateCondition(index: number) {
  const source = conditions.value[index]
  if (!source) return
  const color = nextColor()
  const copy = { ...source, label: `${source.label} (copy)` }
  const updated = [...conditions.value]
  updated.splice(index + 1, 0, copy)
  const colors = [...conditionColors.value]
  colors.splice(index + 1, 0, color)
  persistColors(colors)
  updateConditions(updated)
}

function updateConditionField(index: number, field: keyof ConditionEntry, value: string) {
  if (field === 'label') {
    const oldLabel = conditions.value[index]?.label
    if (oldLabel && oldLabel !== value && selectedNodeId.value) {
      renameEdgeSourceHandle(selectedNodeId.value, oldLabel, value)
    }
  }
  const updated = conditions.value.map((c, i) =>
    i === index ? { ...c, [field]: value } : c,
  )
  updateConditions(updated)
}

// ─── Builder mode per condition ──────────────────────────────────
const OPERATORS = [
  { value: '==', label: 'equals (==)' },
  { value: '!=', label: 'not equals (!=)' },
  { value: '>', label: 'greater than (>)' },
  { value: '<', label: 'less than (<)' },
  { value: '>=', label: 'greater or equal (>=)' },
  { value: '<=', label: 'less or equal (<=)' },
] as const

const FUNCTIONS = [
  { value: 'IsEmpty', label: 'is empty', template: 'IsEmpty({field})' },
  { value: '!IsEmpty', label: 'is not empty', template: '!IsEmpty({field})' },
  { value: 'Contains', label: 'contains', template: 'Contains({field}, \'{value}\')' },
  { value: 'StartsWith', label: 'starts with', template: 'StartsWith({field}, \'{value}\')' },
  { value: 'EndsWith', label: 'ends with', template: 'EndsWith({field}, \'{value}\')' },
] as const

type OperatorValue = typeof OPERATORS[number]['value']
type FunctionValue = typeof FUNCTIONS[number]['value']

interface BuilderClause {
  field: string
  operator: OperatorValue | FunctionValue
  value: string
}

function parseExpression(expr: string): BuilderClause | null {
  if (!expr.trim()) return null

  for (const fn of FUNCTIONS) {
    const negated = fn.value.startsWith('!')
    const fnName = negated ? fn.value.slice(1) : fn.value
    const pattern = negated
      ? new RegExp(`^!${fnName}\\(([^,)]+)(?:,\\s*'([^']*)')?\\)$`)
      : new RegExp(`^${fnName}\\(([^,)]+)(?:,\\s*'([^']*)')?\\)$`)
    const m = expr.trim().match(pattern)
    if (m) {
      return { field: m[1].trim(), operator: fn.value, value: m[2] ?? '' }
    }
  }

  const compMatch = expr.trim().match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/)
  if (compMatch) {
    let val = compMatch[3].trim()
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1)
    }
    return { field: compMatch[1].trim(), operator: compMatch[2] as OperatorValue, value: val }
  }

  return null
}

function serializeClause(clause: BuilderClause): string {
  const fn = FUNCTIONS.find(f => f.value === clause.operator)
  if (fn) {
    return fn.template.replace('{field}', clause.field).replace('{value}', clause.value)
  }
  const isNumeric = clause.value !== '' && !Number.isNaN(Number(clause.value))
  const isBool = clause.value === 'true' || clause.value === 'false'
  const isRef = clause.value.includes('.')
  const val = (isNumeric || isBool || isRef) ? clause.value : `'${clause.value}'`
  return `${clause.field} ${clause.operator} ${val}`
}

const conditionModes = ref<Record<number, 'builder' | 'expression'>>({})

function getMode(index: number): 'builder' | 'expression' {
  if (conditionModes.value[index]) return conditionModes.value[index]
  const cond = conditions.value[index]
  if (!cond || !cond.condition) return 'builder'
  return parseExpression(cond.condition) ? 'builder' : 'expression'
}

function toggleMode(index: number) {
  const current = getMode(index)
  conditionModes.value[index] = current === 'builder' ? 'expression' : 'builder'
}

function getBuilderClause(index: number): BuilderClause {
  const cond = conditions.value[index]
  if (!cond?.condition) return { field: '', operator: '==', value: '' }
  return parseExpression(cond.condition) ?? { field: '', operator: '==', value: '' }
}

function updateBuilderClause(index: number, patch: Partial<BuilderClause>) {
  const current = getBuilderClause(index)
  const updated = { ...current, ...patch }
  if (updated.field) {
    updateConditionField(index, 'condition', serializeClause(updated))
  }
}

function operatorNeedsValue(op: string): boolean {
  const fn = FUNCTIONS.find(f => f.value === op)
  if (!fn) return true
  return fn.template.includes('{value}')
}

// ─── Available fields from upstream completions ─────────────────
const completions = inject<Ref<ExpressionCompletion[]>>('expressionCompletions', ref([]))

const fieldOptions = computed(() => {
  return completions.value.map(c => ({
    value: c.expression.replace(/^\{\{|\}\}$/g, ''),
    label: c.label,
    detail: c.detail,
    section: c.section,
  }))
})

const groupedFields = computed(() => {
  const groups = new Map<string, typeof fieldOptions.value>()
  for (const f of fieldOptions.value) {
    const section = f.section ?? 'other'
    if (!groups.has(section)) groups.set(section, [])
    groups.get(section)!.push(f)
  }
  return groups
})

// ─── Drag to reorder ──────────────────────────────────────────
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const gripActive = ref(false)

function onDragStart(index: number, event: DragEvent) {
  if (!gripActive.value) {
    event.preventDefault()
    return
  }
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(index: number, event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = index
}

const recentlyMoved = ref<Set<number>>(new Set())

function onDrop(index: number) {
  const from = dragIndex.value
  if (from === null || from === index) return
  const updated = [...conditions.value]
  const [moved] = updated.splice(from, 1)
  updated.splice(index, 0, moved)

  const colors = [...conditionColors.value]
  const [movedColor] = colors.splice(from, 1)
  colors.splice(index, 0, movedColor)
  persistColors(colors)

  updateConditions(updated)

  recentlyMoved.value = new Set([index])
  setTimeout(() => { recentlyMoved.value = new Set() }, 1500)

  dragIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

// ─── Quick-start templates ───────────────────────────────────────
const TEMPLATES = [
  { label: 'Check output status', condition: "output.nodeId.status == 'success'", description: 'Branch on a previous node result' },
  { label: 'Compare input value', condition: 'input.amount > 100', description: 'Numeric comparison on workflow input' },
  { label: 'Check if empty', condition: 'IsEmpty(output.nodeId.result)', description: 'Branch when a value is empty' },
] as const

function applyTemplate(tmpl: typeof TEMPLATES[number]) {
  const color = nextColor()
  const updated = [...conditions.value, { label: '', condition: tmpl.condition, description: '' }]
  persistColors([...conditionColors.value, color])
  updateConditions(updated)
}

// ─── Syntax reference toggle ─────────────────────────────────────
const showReference = ref(false)

// ─── Field search popover per condition ──────────────────────────
const fieldSearch = ref('')
const activeFieldPopover = ref<number | null>(null)

const filteredFields = computed(() => {
  const q = fieldSearch.value.toLowerCase()
  if (!q) return fieldOptions.value
  return fieldOptions.value.filter(f =>
    f.value.toLowerCase().includes(q)
    || f.label.toLowerCase().includes(q)
    || (f.detail ?? '').toLowerCase().includes(q),
  )
})

function selectField(index: number, fieldValue: string) {
  updateBuilderClause(index, { field: fieldValue })
  activeFieldPopover.value = null
  fieldSearch.value = ''
}

// ─── Branch colors (synced with WorkflowNodeCondition.vue) ──────
const BRANCH_COLOR_COUNT = 6
const BRANCH_COLORS = [
  { badge: 'bg-green-500/15 text-green-600 dark:text-green-400', border: 'border-l-green-500' },
  { badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', border: 'border-l-blue-500' },
  { badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-400', border: 'border-l-violet-500' },
  { badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', border: 'border-l-amber-500' },
  { badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400', border: 'border-l-rose-500' },
  { badge: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400', border: 'border-l-cyan-500' },
]

function branchColor(colorIndex: number) {
  return BRANCH_COLORS[colorIndex % BRANCH_COLOR_COUNT]
}

// ─── Color persistence via node ui ──────────────────────────────
const nodeUi = computed(() => {
  if (!props.nodeData.ui || typeof props.nodeData.ui !== 'object') {
    // eslint-disable-next-line vue/no-mutating-props -- nodeData is a shared reactive object mutated by all settings panels
    props.nodeData.ui = {}
  }
  return props.nodeData.ui as Record<string, unknown>
})

const conditionColors = computed<number[]>(() =>
  (Array.isArray(nodeUi.value.conditionColors) ? nodeUi.value.conditionColors : []) as number[],
)

function persistColors(colors: number[]) {
  nodeUi.value.conditionColors = colors
  onNodeSettingsChange()
}

function getConditionColor(index: number): number {
  return conditionColors.value[index] ?? index % BRANCH_COLOR_COUNT
}

function nextColor(): number {
  const used = new Set(conditionColors.value)
  for (let i = 0; i < BRANCH_COLOR_COUNT; i++) {
    if (!used.has(i)) return i
  }
  return conditions.value.length % BRANCH_COLOR_COUNT
}

// Backfill colors on mount for conditions that don't have assigned colors yet
onMounted(() => {
  const existing = conditionColors.value
  if (existing.length >= conditions.value.length) return
  const used = new Set(existing)
  const colors = [...existing]
  for (let i = existing.length; i < conditions.value.length; i++) {
    let c = 0
    while (used.has(c)) c++
    colors.push(c)
    used.add(c)
  }
  persistColors(colors)
})

// ─── Validation ─────────────────────────────────────────────────
interface ConditionErrors {
  label?: string
  condition?: string
  field?: string
  value?: string
}

const touched = ref<Record<number, Set<string>>>({})

function markTouched(index: number, field: string) {
  if (!touched.value[index]) touched.value[index] = new Set()
  touched.value[index].add(field)
}

const validationErrors = computed<ConditionErrors[]>(() => {
  const labels = conditions.value.map(c => c.label.trim().toLowerCase())
  return conditions.value.map((cond, i) => {
    const errors: ConditionErrors = {}
    if (!cond.label.trim()) {
      errors.label = 'Label is required'
    }
    else if (labels.filter(l => l === cond.label.trim().toLowerCase()).length > 1) {
      errors.label = 'Duplicate label'
    }

    const mode = getMode(i)
    if (mode === 'builder') {
      const clause = getBuilderClause(i)
      if (!clause.field) errors.field = 'Select a field'
      if (operatorNeedsValue(clause.operator) && !clause.value) errors.value = 'Value is required'
    }
    else {
      if (!cond.condition.trim()) errors.condition = 'Expression is required'
    }

    return errors
  })
})

function getError(index: number, field: string): string | undefined {
  if (!touched.value[index]?.has(field)) return undefined
  return validationErrors.value[index]?.[field as keyof ConditionErrors]
}
</script>

<template>
  <div class="space-y-4">
    <!-- Conditions list -->
    <div>
      <div class="mb-1 flex items-center justify-between">
        <label class="text-sm font-medium">Conditions</label>
        <button
          type="button"
          class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
          @click="addCondition"
        >
          <LucidePlus class="h-3 w-3" />
          Add
        </button>
      </div>
      <p class="text-muted-foreground mb-2 text-[11px]">Evaluated top-to-bottom. First match wins.</p>

      <!-- Empty state -->
      <div v-if="conditions.length === 0" class="space-y-3">
        <div class="text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs">
          <LucideGitBranch class="mx-auto mb-2 h-6 w-6 opacity-40" />
          <p class="font-medium">No conditions yet</p>
          <p class="mt-1 opacity-70">Add a condition to create decision branches.</p>
        </div>

        <!-- Quick-start templates -->
        <div class="space-y-1.5">
          <p class="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">Quick start</p>
          <button
            v-for="tmpl in TEMPLATES"
            :key="tmpl.label"
            type="button"
            class="bg-muted/30 hover:bg-muted flex w-full items-start gap-2 rounded-md border border-dashed px-3 py-2 text-left transition-colors"
            @click="applyTemplate(tmpl)"
          >
            <LucidePlus class="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" />
            <div>
              <div class="text-xs font-medium">{{ tmpl.label }}</div>
              <div class="text-muted-foreground mt-0.5 font-mono text-[10px]">{{ tmpl.condition }}</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Condition cards -->
      <div class="space-y-2">
        <div
          v-for="(cond, i) in conditions"
          :key="i"
          class="group/card relative rounded-md border border-l-[3px] transition-all duration-500"
          :class="[
            branchColor(getConditionColor(i)).border,
            dragOverIndex === i && dragIndex !== i ? 'border-primary border-dashed' : '',
            dragIndex === i ? 'opacity-40' : '',
            touched[i]?.size && Object.keys(validationErrors[i] ?? {}).length > 0 ? 'border-destructive/30' : '',
            recentlyMoved.has(i) ? 'bg-primary/5 ring-primary/20 ring-1' : '',
          ]"
          draggable="true"
          @dragstart="onDragStart(i, $event)"
          @dragover="onDragOver(i, $event)"
          @drop="onDrop(i)"
          @dragend="onDragEnd(); gripActive = false"
        >
          <!-- Card header: number badge + label + actions -->
          <div class="flex items-center gap-2 px-3 pt-2.5 pb-1">
            <!-- Drag handle + number badge -->
            <div
              class="flex shrink-0 cursor-grab items-center gap-1.5 active:cursor-grabbing"
              @mousedown="gripActive = true"
              @mouseup="gripActive = false"
            >
              <LucideGripVertical class="text-muted-foreground/40 group-hover/card:text-muted-foreground h-3 w-3 transition-colors" />
              <span class="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold" :class="branchColor(getConditionColor(i)).badge">
                {{ i + 1 }}
              </span>
            </div>

            <!-- Label input -->
            <div class="min-w-0 flex-1">
              <Input
                :model-value="cond.label"
                placeholder="Branch label"
                size="sm"
                class="h-7 w-full border-none bg-transparent px-1 font-medium shadow-none focus-visible:ring-0"
                :class="getError(i, 'label') ? 'text-destructive placeholder:text-destructive/50' : ''"
                @blur="markTouched(i, 'label')"
                @update:model-value="updateConditionField(i, 'label', String($event))"
              />
              <p v-if="getError(i, 'label')" class="text-destructive px-1 text-[10px]">{{ getError(i, 'label') }}</p>
            </div>

            <!-- Actions -->
            <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100">
              <!-- Mode toggle -->
              <button
                type="button"
                class="rounded p-1 text-[10px] font-bold transition-colors"
                :class="getMode(i) === 'expression'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'"
                :title="getMode(i) === 'expression' ? 'Switch to builder' : 'Switch to expression'"
                @click="toggleMode(i)"
              >
                <LucideCode2 class="h-3 w-3" />
              </button>
              <button
                type="button"
                class="text-muted-foreground hover:text-foreground hover:bg-muted rounded p-1 transition-colors"
                title="Duplicate"
                @click="duplicateCondition(i)"
              >
                <LucideCopy class="h-3 w-3" />
              </button>
              <button
                type="button"
                class="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded p-1 transition-colors"
                title="Remove"
                @click="removeCondition(i)"
              >
                <LucideTrash2 class="h-3 w-3" />
              </button>
            </div>
          </div>

          <!-- Condition body -->
          <div class="px-3 pt-1 pb-3">
            <!-- Builder mode -->
            <div v-if="getMode(i) === 'builder'" class="space-y-1.5">
              <!-- Field selector -->
              <Popover :open="activeFieldPopover === i" @update:open="(val: boolean) => { if (!val) { activeFieldPopover = null; fieldSearch = ''; markTouched(i, 'field') } }">
                <PopoverTrigger as-child>
                  <button
                    type="button"
                    class="bg-muted/50 hover:bg-muted flex h-7 w-full items-center gap-1.5 rounded-md border px-2 text-left font-mono text-xs transition-colors"
                    :class="getError(i, 'field') ? 'border-destructive/50' : ''"
                    @click="activeFieldPopover = activeFieldPopover === i ? null : i"
                  >
                    <LucideVariable class="text-muted-foreground h-3 w-3 shrink-0" />
                    <span v-if="getBuilderClause(i).field" class="min-w-0 flex-1 truncate">{{ getBuilderClause(i).field }}</span>
                    <span v-else class="text-muted-foreground min-w-0 flex-1 truncate">Select field...</span>
                    <LucideChevronsUpDown class="text-muted-foreground h-3 w-3 shrink-0 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent v-if="activeFieldPopover === i" class="w-[min(500px,calc(100vw-2rem))] p-0" align="start">
                  <div class="border-b p-2">
                    <Input
                      v-model="fieldSearch"
                      placeholder="Search fields..."
                      size="sm"
                      class="h-7"
                    />
                  </div>
                  <div class="max-h-72 overflow-y-auto p-1">
                    <template v-if="filteredFields.length > 0">
                      <template v-for="[section, fields] in groupedFields" :key="section">
                        <div
                          v-if="fields.some(f => filteredFields.includes(f))"
                          class="text-muted-foreground px-2 pt-2 pb-1 text-[10px] font-medium tracking-wider uppercase"
                        >
                          {{ section }}
                        </div>
                        <button
                          v-for="f in fields.filter(f => filteredFields.includes(f))"
                          :key="f.value"
                          type="button"
                          class="hover:bg-accent flex w-full flex-col rounded-sm px-2 py-1.5 text-left text-xs"
                          @click="selectField(i, f.value)"
                        >
                          <span class="w-full font-mono break-all">{{ f.value }}</span>
                          <span v-if="f.detail" class="text-muted-foreground text-[10px]">{{ f.detail }}</span>
                        </button>
                      </template>
                    </template>
                    <div v-else class="text-muted-foreground px-2 py-4 text-center text-xs">
                      <p>No matching fields</p>
                      <p class="mt-1 opacity-60">Type a field path manually in expression mode</p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <p v-if="getError(i, 'field')" class="text-destructive text-[10px]">{{ getError(i, 'field') }}</p>

              <!-- Operator selector -->
              <Select
                :model-value="getBuilderClause(i).operator"
                @update:model-value="updateBuilderClause(i, { operator: $event as OperatorValue })"
              >
                <SelectTrigger size="sm" class="h-7 font-mono text-xs">
                  <SelectValue placeholder="Operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel class="text-[10px]">Comparison</SelectLabel>
                    <SelectItem
                      v-for="op in OPERATORS"
                      :key="op.value"
                      :value="op.value"
                      class="font-mono text-xs"
                    >
                      {{ op.label }}
                    </SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel class="text-[10px]">Functions</SelectLabel>
                    <SelectItem
                      v-for="fn in FUNCTIONS"
                      :key="fn.value"
                      :value="fn.value"
                      class="text-xs"
                    >
                      {{ fn.label }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <!-- Value input (hidden for unary operators) -->
              <div v-if="operatorNeedsValue(getBuilderClause(i).operator)">
                <Input
                  :model-value="getBuilderClause(i).value"
                  placeholder="Value"
                  size="sm"
                  class="h-7 font-mono text-xs"
                  :class="getError(i, 'value') ? 'border-destructive/50' : ''"
                  @blur="markTouched(i, 'value')"
                  @update:model-value="updateBuilderClause(i, { value: String($event) })"
                />
                <p v-if="getError(i, 'value')" class="text-destructive mt-0.5 text-[10px]">{{ getError(i, 'value') }}</p>
              </div>

              <!-- Preview of generated expression -->
              <div v-if="cond.condition" class="text-muted-foreground truncate px-0.5 font-mono text-[10px] leading-relaxed">
                <span class="opacity-40">expr: </span>{{ cond.condition }}
              </div>
            </div>

            <!-- Expression mode -->
            <div v-else class="space-y-1.5">
              <ExpressionInput
                :model-value="cond.condition"
                placeholder="e.g. output.node.status == 'active'"
                size="sm"
                :class="getError(i, 'condition') ? '[&_textarea]:border-destructive/50' : ''"
                @blur="markTouched(i, 'condition')"
                @update:model-value="updateConditionField(i, 'condition', String($event))"
              />
              <p v-if="getError(i, 'condition')" class="text-destructive text-[10px]">{{ getError(i, 'condition') }}</p>
            </div>

            <!-- Description (collapsible) -->
            <div class="mt-2">
              <Input
                :model-value="cond.description ?? ''"
                placeholder="Description (optional)"
                size="sm"
                class="text-muted-foreground h-6 border-none bg-transparent px-0 text-[11px] italic shadow-none focus-visible:ring-0"
                @update:model-value="updateConditionField(i, 'description', String($event))"
              />
            </div>
          </div>
        </div>

        <!-- Add condition button (shown below existing conditions) -->
        <button
          v-if="conditions.length > 0"
          type="button"
          class="text-muted-foreground hover:text-foreground hover:border-foreground/20 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed py-1.5 text-xs transition-colors"
          @click="addCondition"
        >
          <LucidePlus class="h-3 w-3" />
          Add condition
        </button>
      </div>
    </div>

    <!-- Default / fallback branch -->
    <div class="border-t pt-4">
      <div class="flex items-center gap-2">
        <span class="bg-muted-foreground/15 text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold">
          *
        </span>
        <div class="flex-1 space-y-1">
          <label class="text-sm font-medium">Default branch</label>
          <p class="text-muted-foreground text-[11px]">Fallback when no condition matches.</p>
        </div>
      </div>
      <Input
        :model-value="defaultLabel"
        placeholder="e.g. default, else, fallback"
        size="sm"
        class="mt-2"
        @update:model-value="updateDefaultLabel(String($event))"
      />
    </div>

    <!-- Expression reference (collapsible) -->
    <div class="border-t pt-3">
      <button
        type="button"
        class="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 text-xs transition-colors"
        @click="showReference = !showReference"
      >
        <LucideBookOpen class="h-3 w-3" />
        Expression reference
        <LucideChevronDown class="ml-auto h-3 w-3 transition-transform" :class="showReference ? 'rotate-180' : ''" />
      </button>

      <div v-if="showReference" class="text-muted-foreground mt-3 space-y-3 text-[11px]">
        <div>
          <p class="mb-1 font-medium">Evaluation order</p>
          <p>Conditions evaluate top-to-bottom — first match wins. Use drag handles to reorder.</p>
        </div>

        <div>
          <p class="mb-1 font-medium">Syntax</p>
          <!-- eslint-disable-next-line vue/no-parsing-error -->
          <p>Use <strong>bare paths</strong> (no <code class="bg-muted rounded px-1">{<!-- -->{&nbsp;}<!-- -->}</code> wrapping).</p>
          <div class="bg-muted/50 mt-1.5 space-y-0.5 rounded-md px-2 py-1.5 font-mono text-[10px]">
            <p>output.nodeId.status == 'active'</p>
            <p>input.amount > 100</p>
            <p>!IsEmpty(output.nodeId.email)</p>
            <p>Contains(input.name, 'test')</p>
          </div>
        </div>

        <div>
          <p class="mb-1 font-medium">Operators</p>
          <div class="bg-muted/50 grid grid-cols-3 gap-x-3 gap-y-0.5 rounded-md px-2 py-1.5 font-mono text-[10px]">
            <span>== equals</span>
            <span>!= not eq</span>
            <span>&gt; greater</span>
            <span>&lt; less</span>
            <span>&gt;= gte</span>
            <span>&lt;= lte</span>
            <span>&amp;&amp; and</span>
            <span>|| or</span>
            <span>! not</span>
          </div>
        </div>

        <div>
          <p class="mb-1 font-medium">Functions</p>
          <div class="bg-muted/50 space-y-0.5 rounded-md px-2 py-1.5 font-mono text-[10px]">
            <p>IsEmpty(val), Contains(str, sub)</p>
            <p>StartsWith(str, prefix)</p>
            <p>EndsWith(str, suffix)</p>
            <p>Len(str), Count(arr)</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
