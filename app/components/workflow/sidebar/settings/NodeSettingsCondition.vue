<script setup lang="ts">
import ExpressionInput from '@/components/workflow/shared/ExpressionInput.vue'

type ConditionEntry = { label: string, condition: string, description?: string }

const props = defineProps<{
  nodeData: Record<string, unknown>
  nodeConfig: Record<string, unknown>
  updateConfig: (name: string, value: unknown) => void
}>()

const onNodeSettingsChange = inject<() => void>('onNodeSettingsChange', () => {})

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
  // eslint-disable-next-line vue/no-mutating-props -- nodeData is a shared reactive object mutated by all settings panels
  props.nodeData.defaultLabel = val || undefined
  onNodeSettingsChange()
}

function addCondition() {
  const updated = [...conditions.value, { label: '', condition: '', description: '' }]
  updateConditions(updated)
}

function removeCondition(index: number) {
  const updated = conditions.value.filter((_, i) => i !== index)
  updateConditions(updated)
}

function updateConditionField(index: number, field: keyof ConditionEntry, value: string) {
  const updated = conditions.value.map((c, i) =>
    i === index ? { ...c, [field]: value } : c,
  )
  updateConditions(updated)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Conditions list -->
    <div>
      <div class="mb-2 flex items-center justify-between">
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

      <div v-if="conditions.length === 0" class="text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs">
        No conditions defined. Add a condition to create a branch.
      </div>

      <div class="space-y-3">
        <div
          v-for="(cond, i) in conditions"
          :key="i"
          class="bg-muted/30 space-y-2 rounded-md border p-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 space-y-2">
              <div class="space-y-1">
                <label class="text-muted-foreground text-xs">Label</label>
                <Input
                  :model-value="cond.label"
                  placeholder="e.g. ok, found, valid"
                  size="sm"
                  @update:model-value="updateConditionField(i, 'label', String($event))"
                />
              </div>
              <div class="space-y-1">
                <label class="text-muted-foreground text-xs">Expression</label>
                <ExpressionInput
                  :model-value="cond.condition"
                  placeholder="e.g. output.node.success == true"
                  size="sm"
                  @update:model-value="updateConditionField(i, 'condition', String($event))"
                />
              </div>
              <div class="space-y-1">
                <label class="text-muted-foreground text-xs">Description <span class="opacity-50">(optional)</span></label>
                <Input
                  :model-value="cond.description ?? ''"
                  placeholder="What this branch means"
                  size="sm"
                  @update:model-value="updateConditionField(i, 'description', String($event))"
                />
              </div>
            </div>
            <button
              type="button"
              class="text-muted-foreground hover:text-destructive mt-4 flex-shrink-0"
              title="Remove condition"
              @click="removeCondition(i)"
            >
              <LucideTrash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Default label -->
    <div class="border-t pt-4">
      <div class="space-y-1">
        <label class="text-sm font-medium">Default label</label>
        <p class="text-muted-foreground text-xs">Fallback branch when no condition matches.</p>
        <Input
          :model-value="defaultLabel"
          placeholder="e.g. default, error, fallback"
          size="sm"
          @update:model-value="updateDefaultLabel(String($event))"
        />
      </div>
    </div>

    <div class="text-muted-foreground border-t pt-3 text-xs">
      <p>Conditions are evaluated in order — first match wins.</p>
      <p class="mt-1">Expressions use NCalc syntax with <code class="bg-muted rounded px-1">output.nodeId.field</code> references.</p>
    </div>
  </div>
</template>
