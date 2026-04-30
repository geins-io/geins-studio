<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import type { WorkflowInput } from '#shared/types'

const props = defineProps<{
  inputs: WorkflowInput[]
  additionalGroups: string[]
  inputValues: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:inputs': [WorkflowInput[]]
  'update:additionalGroups': [string[]]
  'update:inputValues': [Record<string, unknown>]
}>()

const { t } = useI18n()

const prettyLabel = (name: string): string =>
  name
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ')

// Seed with locally-added empty groups so they render before any input is
// assigned to them — matching the old inline computed in the parent page.
const inputsByCategory = computed(() => {
  const order: string[] = []
  const groups: Record<string, WorkflowInput[]> = {}
  for (const cat of props.additionalGroups) {
    if (!groups[cat]) {
      groups[cat] = []
      order.push(cat)
    }
  }
  for (const input of props.inputs) {
    const cat = input.category || 'general'
    if (!groups[cat]) {
      groups[cat] = []
      order.push(cat)
    }
    groups[cat]!.push(input)
  }
  return order.map(category => ({ category, items: groups[category]! }))
})

const searchQuery = ref('')

const filteredInputsByCategory = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return inputsByCategory.value
  return inputsByCategory.value
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.name.toLowerCase().includes(q)
        || prettyLabel(item.name).toLowerCase().includes(q),
      ),
    }))
    .filter(group => group.items.length > 0)
})

// ─── Dynamic vee-validate form for input default values ────────────
// Build a zod schema keyed by input name so each value field gets proper
// FormField/FormItem/FormLabel/FormControl/FormDescription treatment.
const inputSchema = computed(() => {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const input of props.inputs) {
    if (input.type === 'boolean') {
      shape[input.name] = z.boolean().default(false)
    }
    else if (input.type === 'number') {
      shape[input.name] = z.number().nullish()
    }
    else {
      shape[input.name] = z.string().nullish()
    }
  }
  return toTypedSchema(z.object(shape))
})

const inputForm = useForm({
  validationSchema: inputSchema,
  keepValuesOnUnmount: true,
})

// Sync prop values → form whenever inputValues change from parent.
watch(
  () => props.inputValues,
  (vals) => {
    inputForm.setValues({ ...vals })
  },
  { immediate: true, deep: true },
)

// Emit changes back to parent when form values change.
watch(
  () => inputForm.values,
  (vals) => {
    // Shallow compare to avoid infinite loop — only emit when actually different.
    const current = props.inputValues
    const changed = Object.keys(vals).some(k => vals[k] !== current[k])
      || Object.keys(current).some(k => !(k in vals))
    if (changed) {
      emit('update:inputValues', { ...vals })
    }
  },
  { deep: true },
)

// Helpers hoist union-typed casts out of the template — otherwise the
// template parser sees `string | number` and flags the `|` as a deprecated
// Vue 2 filter (vue/no-deprecated-filter).
const numberInputValue = (name: string): string | number | undefined => {
  const v = props.inputValues[name]
  if (v === null || v === undefined) return undefined
  if (typeof v === 'number' || typeof v === 'string') return v
  return String(v)
}

// ─── Add input dialog ──────────────────────────────────────────────
const INPUT_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/
const addInputDialogOpen = ref(false)
const addInputCategory = ref('')
const addInputError = ref('')
const newInput = reactive<{
  name: string
  type: string
  required: boolean
  description: string
  defaultValue: string
}>({
  name: '',
  type: 'string',
  required: false,
  description: '',
  defaultValue: '',
})

const openAddInput = (category: string) => {
  addInputCategory.value = category
  addInputError.value = ''
  newInput.name = ''
  newInput.type = 'string'
  newInput.required = false
  newInput.description = ''
  newInput.defaultValue = ''
  addInputDialogOpen.value = true
}

const coerceDefault = (raw: string, type: string): unknown => {
  if (raw === '') return type === 'boolean' ? false : undefined
  if (type === 'number') {
    const n = Number(raw)
    return Number.isNaN(n) ? undefined : n
  }
  if (type === 'boolean') return raw === 'true'
  return raw
}

const inputNameValid = computed(() => {
  const n = newInput.name.trim()
  return n.length === 0 || INPUT_NAME_RE.test(n)
})

const confirmAddInput = () => {
  const name = newInput.name.trim()
  if (!name) {
    addInputError.value = 'Name is required'
    return
  }
  if (!INPUT_NAME_RE.test(name)) {
    addInputError.value = 'Name must start with a letter and contain only letters, digits, underscores, and dashes'
    return
  }
  if (props.inputs.some(i => i.name === name)) {
    addInputError.value = 'An input with this name already exists'
    return
  }
  const defaultValue = coerceDefault(newInput.defaultValue, newInput.type)
  const category = addInputCategory.value && addInputCategory.value !== 'general'
    ? addInputCategory.value
    : undefined
  const newDef: WorkflowInput = {
    name,
    type: newInput.type,
    required: newInput.required,
    description: newInput.description || undefined,
    ...(defaultValue !== undefined && { defaultValue }),
    category,
  }
  emit('update:inputs', [...props.inputs, newDef])
  emit('update:inputValues', { ...props.inputValues, [name]: defaultValue })
  // The group has its first input now — drop it from the local-only list.
  if (category) {
    emit('update:additionalGroups', props.additionalGroups.filter(g => g !== category))
  }
  addInputDialogOpen.value = false
}

const removeInput = (name: string) => {
  emit('update:inputs', props.inputs.filter(i => i.name !== name))
  const { [name]: _removed, ...rest } = props.inputValues
  emit('update:inputValues', rest)
}

const removeGroup = (category: string) => {
  emit('update:additionalGroups', props.additionalGroups.filter(g => g !== category))
  const inCategory = (i: WorkflowInput) => (i.category || 'general') === category
  emit('update:inputs', props.inputs.filter(i => !inCategory(i)))
  const removedNames = new Set(props.inputs.filter(inCategory).map(i => i.name))
  const nextValues: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(props.inputValues)) {
    if (!removedNames.has(k)) nextValues[k] = v
  }
  emit('update:inputValues', nextValues)
}

// ─── Add group dialog ──────────────────────────────────────────────
const addGroupDialogOpen = ref(false)
const newGroupName = ref('')
const addGroupError = ref('')

const existingGroupNames = computed(() => {
  const names = new Set<string>(props.additionalGroups)
  for (const i of props.inputs) names.add(i.category || 'general')
  return names
})

const openAddGroup = () => {
  newGroupName.value = ''
  addGroupError.value = ''
  addGroupDialogOpen.value = true
}

const confirmAddGroup = () => {
  const name = newGroupName.value.trim()
  if (!name) {
    addGroupError.value = 'Group name is required'
    return
  }
  if (existingGroupNames.value.has(name)) {
    addGroupError.value = 'A group with this name already exists'
    return
  }
  emit('update:additionalGroups', [...props.additionalGroups, name])
  addGroupDialogOpen.value = false
}
</script>

<template>
  <ContentEditMainContent>
    <div v-if="inputsByCategory.length > 0" class="flex items-center justify-between gap-3">
      <InputGroup class="max-w-xs shadow-none">
        <InputGroupAddon align="inline-start">
          <LucideSearch class="text-muted-foreground size-4" />
        </InputGroupAddon>
        <InputGroupInput v-model="searchQuery" placeholder="Search inputs…" />
      </InputGroup>
      <ButtonIcon icon="new" variant="outline" size="sm" @click="openAddGroup">
        {{ t('add_entity', { entityName: 'group' }) }}
      </ButtonIcon>
    </div>
    <ContentEditCard v-if="inputsByCategory.length === 0" title="Inputs">
      <div class="text-muted-foreground flex flex-col items-center gap-3 py-12 text-center text-sm">
        <span>This workflow has no inputs yet.</span>
        <Button variant="secondary" size="sm" @click="openAddInput('general')">
          <LucidePlus class="mr-2 h-3.5 w-3.5" />
          Add your first input
        </Button>
      </div>
    </ContentEditCard>
    <ContentEditCard
v-for="group in filteredInputsByCategory" v-else :key="group.category" :title="group.category"
      :description="`${group.items.length} input${group.items.length === 1 ? '' : 's'}`"
      collapsible :default-open="false">
      <template #header-action>
        <div class="flex items-center gap-2">
          <ButtonIcon icon="new" variant="outline" size="sm" @click="openAddInput(group.category)">
            {{ $t('add_entity', { entityName: 'input' }) }}
          </ButtonIcon>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button size="icon" variant="secondary">
                <LucideMoreHorizontal class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="removeGroup(group.category)">
                <LucideTrash class="mr-2 size-4" />
                <span>Remove group</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </template>
      <div v-if="group.items.length === 0" class="text-muted-foreground py-6 text-center text-sm">
        No inputs in this group yet.
      </div>
      <div v-else class="divide-y border-y">
        <FormField
          v-for="item in group.items" :key="item.name"
          v-slot="{ componentField }" :name="item.name">
          <FormItem class="flex items-center gap-4 space-y-0! py-4">
            <div class="min-w-0 flex-1">
              <FormLabel :for="`inp-${item.name}`" class="flex items-center gap-1.5 text-sm font-semibold">
                {{ prettyLabel(item.name) }}
                <span v-if="item.required" class="text-destructive">*</span>
              </FormLabel>
              <FormDescription v-if="item.description" class="mt-1 pl-0 text-xs">
                {{ item.description }}
              </FormDescription>
              <div class="mt-3 flex flex-wrap items-center gap-1.5">
                <WorkflowDataType :type="item.type" display="long" />
                <span class="text-muted-foreground font-mono text-[11px]">{{ item.name }}</span>
              </div>
              <FormMessage />
            </div>
            <div class="shrink-0">
              <FormControl>
                <Switch
                  v-if="item.type === 'boolean'" :id="`inp-${item.name}`"
                  :checked="componentField.modelValue" @update:checked="componentField['onUpdate:modelValue']" />
                <Input
                  v-else-if="item.type === 'number'" :id="`inp-${item.name}`" type="number" class="w-64"
                  :model-value="numberInputValue(item.name)"
                  @update:model-value="(v) => componentField['onUpdate:modelValue'](v === '' ? null : Number(v))" />
                <Input
                  v-else :id="`inp-${item.name}`" class="w-64"
                  v-bind="componentField" />
              </FormControl>
            </div>
            <Button
              variant="ghost" size="icon"
              class="text-muted-foreground hover:text-destructive size-8 shrink-0"
              :aria-label="`Remove ${item.name}`" @click="removeInput(item.name)">
              <LucideTrash class="size-4" />
            </Button>
          </FormItem>
        </FormField>
      </div>
    </ContentEditCard>
    <Button
variant="outline" class="text-muted-foreground hover:text-foreground mt-2 w-full border-dashed py-6"
      @click="openAddGroup">
      <LucidePlus class="mr-2 h-4 w-4" />
      Add group
    </Button>
  </ContentEditMainContent>

  <!-- Add input sheet — matches the Add buyer pattern in CompanyBuyerPanel -->
  <Sheet v-model:open="addInputDialogOpen">
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>Add input</SheetTitle>
        <SheetDescription>
          Add an input to the "{{ addInputCategory }}" group. It will be saved with the workflow.
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        <form @submit.prevent="confirmAddInput">
          <FormGridWrap>
            <FormGrid design="1+1">
              <div class="space-y-1.5">
                <Label for="new-input-name">Name</Label>
                <Input id="new-input-name" v-model="newInput.name" placeholder="e.g. batchSize" autofocus :class="{ 'border-destructive': newInput.name.trim() && !inputNameValid }" />
                <p class="text-muted-foreground text-xs" :class="{ 'text-destructive': newInput.name.trim() && !inputNameValid }">
                  Must start with a letter. Only letters, digits, underscores, and dashes.
                </p>
              </div>
              <div class="space-y-1.5">
                <Label for="new-input-type">Type</Label>
                <Select v-model="newInput.type">
                  <SelectTrigger id="new-input-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">string</SelectItem>
                    <SelectItem value="number">number</SelectItem>
                    <SelectItem value="boolean">boolean</SelectItem>
                    <SelectItem value="object">object</SelectItem>
                    <SelectItem value="array">array</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormGrid>
            <FormGrid design="1">
              <div class="space-y-1.5">
                <Label for="new-input-description">
                  Description
                  <span class="text-muted-foreground ml-1 text-xs font-normal">({{ t('form.optional') }})</span>
                </Label>
                <Input
id="new-input-description" v-model="newInput.description"
                  placeholder="What this input is used for" />
              </div>
            </FormGrid>
            <FormGrid v-if="newInput.type !== 'boolean'" design="1">
              <div class="space-y-1.5">
                <Label for="new-input-default">
                  Default value
                  <span class="text-muted-foreground ml-1 text-xs font-normal">({{ t('form.optional') }})</span>
                </Label>
                <Input
id="new-input-default" :model-value="newInput.defaultValue"
                  :type="newInput.type === 'number' ? 'number' : 'text'"
                  @update:model-value="(v) => (newInput.defaultValue = String(v ?? ''))" />
              </div>
            </FormGrid>
            <FormGrid v-else design="1">
              <div
class="flex flex-row items-center justify-between gap-4 rounded-lg border p-4 text-sm"
                data-slot="form-item">
                <div class="text-left">
                  <p class="text-muted-foreground text-xs">
                    Toggle the boolean default.
                  </p>
                </div>
                <Switch
id="new-input-default" :model-value="newInput.defaultValue === 'true'"
                  @update:model-value="(v: boolean) => (newInput.defaultValue = v ? 'true' : 'false')" />
              </div>
            </FormGrid>
            <FormGrid design="1">
              <div
class="flex flex-row items-center justify-between gap-4 rounded-lg border p-4 text-sm"
                data-slot="form-item">
                <div class="text-left">
                  <Label for="new-input-required" class="text-sm font-semibold">Required</Label>
                  <p class="text-muted-foreground mt-1 text-xs">
                    Executions must provide a value for this input.
                  </p>
                </div>
                <Switch id="new-input-required" v-model="newInput.required" />
              </div>
            </FormGrid>
            <p v-if="addInputError" class="text-destructive text-sm">{{ addInputError }}</p>
          </FormGridWrap>
        </form>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="addInputDialogOpen = false">{{ t('cancel') }}</Button>
        <Button @click="confirmAddInput">Add input</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>

  <!-- Add group dialog -->
  <Dialog v-model:open="addGroupDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add group</DialogTitle>
        <DialogDescription>
          Groups organize related inputs. The group persists once you add at least one input to it and save.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="confirmAddGroup">
        <FormGridWrap>
          <FormGrid design="1">
            <div class="space-y-1.5">
              <Label for="new-group-name">Name</Label>
              <Input id="new-group-name" v-model="newGroupName" placeholder="e.g. Filters" autofocus />
            </div>
          </FormGrid>
          <p v-if="addGroupError" class="text-destructive text-sm">{{ addGroupError }}</p>
        </FormGridWrap>
      </form>
      <DialogFooter>
        <Button variant="secondary" @click="addGroupDialogOpen = false">{{ t('cancel') }}</Button>
        <Button @click="confirmAddGroup">Add group</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
