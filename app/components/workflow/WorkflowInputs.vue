<script setup lang="ts">
import type { WorkflowInput } from '#shared/types';
import JsonCodeEditor from '@/components/shared/JsonCodeEditor.vue';
import WorkflowDataType from './shared/WorkflowDataType.vue';

const props = defineProps<{
  inputs: WorkflowInput[];
  additionalGroups: string[];
  inputValues: Record<string, unknown>;
}>();

const emit = defineEmits<{
  'update:inputs': [WorkflowInput[]];
  'update:additionalGroups': [string[]];
  'update:inputValues': [Record<string, unknown>];
}>();

const { t } = useI18n();

const prettyLabel = (name: string): string => name.replace(/[-_]/g, ' ').trim();

// Order groups by their existing inputs first, then append locally-added
// empty groups at the end — so a newly created group appears at the bottom
// and stays there once its first input is added.
const inputsByCategory = computed(() => {
  const order: string[] = [];
  const groups: Record<string, WorkflowInput[]> = {};
  for (const input of props.inputs) {
    const cat = input.category || 'general';
    if (!groups[cat]) {
      groups[cat] = [];
      order.push(cat);
    }
    groups[cat]!.push(input);
  }
  for (const cat of props.additionalGroups) {
    if (!groups[cat]) {
      groups[cat] = [];
      order.push(cat);
    }
  }
  return order.map((category) => ({ category, items: groups[category]! }));
});

const searchQuery = ref('');

// Group expand/collapse — collapsed by default; an active search force-expands
// every group so matches are always visible.
const searching = computed(() => searchQuery.value.trim().length > 0);
const expandedGroups = ref<Set<string>>(new Set());
const isGroupOpen = (category: string): boolean =>
  searching.value || expandedGroups.value.has(category);
const setGroupOpen = (category: string, open: boolean): void => {
  const next = new Set(expandedGroups.value);
  if (open) next.add(category);
  else next.delete(category);
  expandedGroups.value = next;
};

const filteredInputsByCategory = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return inputsByCategory.value;
  return inputsByCategory.value
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          prettyLabel(item.name).toLowerCase().includes(q),
      ),
    }))
    .filter((group) => group.items.length > 0);
});

// ─── Add input dialog ──────────────────────────────────────────────
const INPUT_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const addInputDialogOpen = ref(false);
const addInputCategory = ref('');
const addInputError = ref('');
const newInput = reactive({
  name: '',
  type: 'string',
  required: false,
  description: '',
  defaultValue: '',
});

const defaultPlaceholder = computed(() => {
  if (newInput.type === 'object') return '{}';
  if (newInput.type === 'array') return '[]';
  return '';
});

const tryParseJson = (
  raw: string,
): { ok: true; value: unknown } | { ok: false } => {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    try {
      return { ok: true, value: JSON.parse(raw.replace(/'/g, '"')) };
    } catch {
      return { ok: false };
    }
  }
};

const validateJson = (
  raw: string,
  expectedType: 'object' | 'array',
): string | null => {
  if (!raw.trim()) return null;
  const result = tryParseJson(raw);
  if (!result.ok) return 'Invalid JSON';
  if (
    expectedType === 'object' &&
    (typeof result.value !== 'object' ||
      Array.isArray(result.value) ||
      result.value === null)
  ) {
    return 'Value must be a JSON object';
  }
  if (expectedType === 'array' && !Array.isArray(result.value)) {
    return 'Value must be a JSON array';
  }
  return null;
};

const newInputJsonError = computed(() => {
  if (newInput.type !== 'object' && newInput.type !== 'array') return null;
  return validateJson(
    newInput.defaultValue,
    newInput.type as 'object' | 'array',
  );
});

const newInputCanSave = computed(() => {
  return !newInputJsonError.value;
});

// ─── Edit input sheet ─────────────────────────────────────────────
const editInputOpen = ref(false);
const editingInput = ref<WorkflowInput | null>(null);
const editDefaultValue = ref('');

const openEditInput = (item: WorkflowInput) => {
  editingInput.value = item;
  const current = props.inputValues[item.name];
  if (item.type === 'object' || item.type === 'array') {
    editDefaultValue.value =
      current !== undefined && current !== null
        ? typeof current === 'string'
          ? current
          : JSON.stringify(current, null, 2)
        : item.type === 'object'
          ? '{}'
          : '[]';
  } else if (item.type === 'boolean') {
    editDefaultValue.value = current === true ? 'true' : 'false';
  } else {
    editDefaultValue.value =
      current !== undefined && current !== null ? String(current) : '';
  }
  editInputOpen.value = true;
};

const editJsonError = computed(() => {
  if (!editingInput.value) return null;
  const t = editingInput.value.type;
  if (t !== 'object' && t !== 'array') return null;
  return validateJson(editDefaultValue.value, t as 'object' | 'array');
});

const editCanSave = computed(() => {
  return !editJsonError.value;
});

const confirmEditInput = () => {
  if (!editingInput.value || !editCanSave.value) return;
  const item = editingInput.value;
  const coerced = coerceDefault(editDefaultValue.value, item.type);
  emit('update:inputValues', { ...props.inputValues, [item.name]: coerced });
  emit(
    'update:inputs',
    props.inputs.map((i) =>
      i.name === item.name ? { ...i, defaultValue: coerced } : i,
    ),
  );
  editInputOpen.value = false;
};

const displayValue = (item: WorkflowInput): string => {
  const v = props.inputValues[item.name];
  if (v === undefined || v === null) return '—';
  if (item.type === 'boolean') return v ? 'true' : 'false';
  if (item.type === 'object' || item.type === 'array') {
    const s = typeof v === 'string' ? v : JSON.stringify(v);
    return s.length > 30 ? `${s.slice(0, 30)}…` : s;
  }
  return String(v);
};

const openAddInput = (category: string) => {
  addInputCategory.value = category;
  addInputError.value = '';
  newInput.name = '';
  newInput.type = 'string';
  newInput.required = false;
  newInput.description = '';
  newInput.defaultValue = '';
  addInputDialogOpen.value = true;
};

watch(
  () => newInput.type,
  (type) => {
    if (type === 'object') newInput.defaultValue = '{}';
    else if (type === 'array') newInput.defaultValue = '[]';
    else if (type === 'boolean') newInput.defaultValue = 'false';
    else newInput.defaultValue = '';
  },
);

const coerceDefault = (raw: string, type: string): unknown => {
  if (raw === '')
    return type === 'boolean'
      ? false
      : type === 'object'
        ? {}
        : type === 'array'
          ? []
          : undefined;
  if (type === 'number') {
    const n = Number(raw);
    return Number.isNaN(n) ? undefined : n;
  }
  if (type === 'boolean') return raw === 'true';
  if (type === 'object' || type === 'array') {
    const result = tryParseJson(raw);
    return result.ok ? result.value : raw;
  }
  return raw;
};

const inputNameValid = computed(() => {
  const n = newInput.name.trim();
  return n.length === 0 || INPUT_NAME_RE.test(n);
});

const confirmAddInput = () => {
  if (!newInputCanSave.value) return;
  const name = newInput.name.trim();
  if (!name) {
    addInputError.value = 'Name is required';
    return;
  }
  if (!INPUT_NAME_RE.test(name)) {
    addInputError.value =
      'Name must start with a letter and contain only letters, digits, underscores, and dashes';
    return;
  }
  if (props.inputs.some((i) => i.name === name)) {
    addInputError.value = 'An input with this name already exists';
    return;
  }
  const defaultValue = coerceDefault(newInput.defaultValue, newInput.type);
  const category =
    addInputCategory.value && addInputCategory.value !== 'general'
      ? addInputCategory.value
      : undefined;
  const newDef: WorkflowInput = {
    name,
    type: newInput.type,
    required: newInput.required,
    description: newInput.description || undefined,
    ...(defaultValue !== undefined && { defaultValue }),
    category,
  };
  emit('update:inputs', [...props.inputs, newDef]);
  emit('update:inputValues', { ...props.inputValues, [name]: defaultValue });
  // The group has its first input now — drop it from the local-only list.
  if (category) {
    emit(
      'update:additionalGroups',
      props.additionalGroups.filter((g) => g !== category),
    );
  }
  addInputDialogOpen.value = false;
};

const toggleRequired = (name: string) => {
  emit(
    'update:inputs',
    props.inputs.map((i) =>
      i.name === name ? { ...i, required: !i.required } : i,
    ),
  );
};

const removeInput = (name: string) => {
  emit(
    'update:inputs',
    props.inputs.filter((i) => i.name !== name),
  );
  const { [name]: _removed, ...rest } = props.inputValues;
  emit('update:inputValues', rest);
};

const removeGroup = (category: string) => {
  emit(
    'update:additionalGroups',
    props.additionalGroups.filter((g) => g !== category),
  );
  const inCategory = (i: WorkflowInput) =>
    (i.category || 'general') === category;
  emit(
    'update:inputs',
    props.inputs.filter((i) => !inCategory(i)),
  );
  const removedNames = new Set(
    props.inputs.filter(inCategory).map((i) => i.name),
  );
  const nextValues: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props.inputValues)) {
    if (!removedNames.has(k)) nextValues[k] = v;
  }
  emit('update:inputValues', nextValues);
};

// ─── Add group dialog ──────────────────────────────────────────────
const addGroupDialogOpen = ref(false);
const newGroupName = ref('');
const addGroupError = ref('');

const existingGroupNames = computed(() => {
  const names = new Set<string>(props.additionalGroups);
  for (const i of props.inputs) names.add(i.category || 'general');
  return names;
});

const openAddGroup = () => {
  newGroupName.value = '';
  addGroupError.value = '';
  addGroupDialogOpen.value = true;
};

const confirmAddGroup = () => {
  const name = newGroupName.value.trim();
  if (!name) {
    addGroupError.value = 'Group name is required';
    return;
  }
  if (existingGroupNames.value.has(name)) {
    addGroupError.value = 'A group with this name already exists';
    return;
  }
  emit('update:additionalGroups', [...props.additionalGroups, name]);
  addGroupDialogOpen.value = false;
};
</script>

<template>
  <ContentEditMainContent>
    <ContentEditCard title="Inputs">
      <template #header-action>
        <div class="flex items-center gap-2">
          <InputGroup
            v-if="inputsByCategory.length > 0"
            class="h-9 max-w-xs shadow-none"
          >
            <InputGroupAddon align="inline-start">
              <LucideSearch class="text-muted-foreground size-4" />
            </InputGroupAddon>
            <InputGroupInput
              v-model="searchQuery"
              placeholder="Search inputs…"
            />
          </InputGroup>
          <ButtonIcon
            icon="new"
            variant="outline"
            class="h-9"
            @click="openAddGroup"
          >
            {{ t('add_entity', { entityName: 'group' }) }}
          </ButtonIcon>
        </div>
      </template>

      <!-- Empty state -->
      <Empty v-if="inputsByCategory.length === 0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideCircleDot class="size-5" />
          </EmptyMedia>
          <EmptyTitle>
            {{ t('no_entity', { entityName: 'input' }, 2) }}
          </EmptyTitle>
          <EmptyDescription>This workflow has no inputs yet.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="secondary"
            size="sm"
            @click="openAddInput('general')"
          >
            <LucidePlus class="mr-2 h-3.5 w-3.5" />
            Add your first input
          </Button>
        </EmptyContent>
      </Empty>

      <!-- No search matches -->
      <div
        v-else-if="filteredInputsByCategory.length === 0"
        class="text-muted-foreground py-8 text-center text-sm"
      >
        No inputs match your search.
      </div>

      <!-- Category sections — each group collapsible -->
      <div v-else class="space-y-3">
        <Collapsible
          v-for="group in filteredInputsByCategory"
          :key="group.category"
          :open="isGroupOpen(group.category)"
          class="rounded-lg border"
          @update:open="setGroupOpen(group.category, $event)"
        >
          <div class="flex items-center justify-between gap-2 p-3">
            <CollapsibleTrigger
              class="group flex flex-1 items-center gap-2 text-left"
            >
              <LucideChevronDown
                class="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=closed]:-rotate-90"
              />
              <span class="text-lg font-semibold">{{ group.category }}</span>
              <span
                class="text-muted-foreground flex items-center gap-1 text-xs font-normal"
              >
                <LucideCircleDot class="size-3.5" />
                {{ group.items.length }} input{{
                  group.items.length === 1 ? '' : 's'
                }}
              </span>
            </CollapsibleTrigger>
            <ButtonGroup>
              <ButtonIcon
                icon="new"
                variant="secondary"
                @click="openAddInput(group.category)"
              >
                {{ $t('add_entity', { entityName: 'input' }) }}
              </ButtonIcon>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    size="icon"
                    variant="secondary"
                    aria-label="More options"
                  >
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
            </ButtonGroup>
          </div>
          <CollapsibleContent>
            <div class="border-t p-1.5">
              <Empty v-if="group.items.length === 0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LucideCircleDot class="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No inputs in this group</EmptyTitle>
                  <EmptyDescription>
                    Add an input to this group.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="secondary"
                    size="sm"
                    @click="openAddInput(group.category)"
                  >
                    <LucidePlus class="mr-2 h-3.5 w-3.5" />
                    Add input
                  </Button>
                </EmptyContent>
              </Empty>
              <div v-else class="divide-y p-1.5">
                <div
                  v-for="item in group.items"
                  :key="item.name"
                  class="hover:bg-background flex cursor-pointer items-center gap-4 px-3 py-4 transition-colors"
                  @click="openEditInput(item)"
                >
                  <div class="min-w-0 flex-1">
                    <div
                      class="flex items-center gap-1.5 text-sm font-semibold"
                    >
                      {{ prettyLabel(item.name) }}
                      <span v-if="item.required" class="text-destructive">
                        *
                      </span>
                    </div>
                    <p
                      v-if="item.description"
                      class="text-muted-foreground mt-1 text-xs"
                    >
                      {{ item.description }}
                    </p>
                    <div class="mt-3 flex flex-wrap items-center gap-1.5">
                      <WorkflowDataType :type="item.type" display="long" />
                      <span class="text-muted-foreground font-mono text-[11px]">
                        {{ item.name }}
                      </span>
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-3">
                    <div
                      class="text-muted-foreground max-w-48 truncate font-mono text-xs"
                    >
                      {{ displayValue(item) }}
                    </div>
                    <div class="flex items-center gap-1.5" @click.stop>
                      <Switch
                        :id="`inp-required-${item.name}`"
                        size="sm"
                        :model-value="!!item.required"
                        @update:model-value="toggleRequired(item.name)"
                      />
                      <label
                        :for="`inp-required-${item.name}`"
                        class="text-muted-foreground cursor-pointer text-xs whitespace-nowrap"
                      >
                        Required
                      </label>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-muted-foreground hover:text-destructive size-8 shrink-0"
                    :aria-label="`Remove ${item.name}`"
                    @click.stop="removeInput(item.name)"
                  >
                    <LucideTrash class="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Button
          variant="secondary"
          class="w-full border-dashed py-6"
          @click="openAddGroup"
        >
          <LucidePlus class="mr-2 size-4" />
          Add group
        </Button>
      </div>
    </ContentEditCard>
  </ContentEditMainContent>

  <!-- Add input sheet — matches the Add buyer pattern in CompanyBuyerPanel -->
  <Sheet v-model:open="addInputDialogOpen">
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>Add input</SheetTitle>
        <SheetDescription>
          Add an input to the "{{ addInputCategory }}" group. It will be saved
          with the workflow.
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        <form @submit.prevent="confirmAddInput">
          <FormGridWrap>
            <FormGrid design="1+1">
              <div class="space-y-1.5">
                <Label for="new-input-name">Name</Label>
                <Input
                  id="new-input-name"
                  v-model="newInput.name"
                  placeholder="e.g. batchSize"
                  autofocus
                  :class="{
                    'border-destructive':
                      newInput.name.trim() && !inputNameValid,
                  }"
                />
                <p
                  class="text-muted-foreground text-xs"
                  :class="{
                    'text-destructive': newInput.name.trim() && !inputNameValid,
                  }"
                >
                  Must start with a letter. Only letters, digits, underscores,
                  and dashes.
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
                  <span class="text-muted-foreground ml-1 text-xs font-normal">
                    ({{ t('form.optional') }})
                  </span>
                </Label>
                <Input
                  id="new-input-description"
                  v-model="newInput.description"
                  placeholder="What this input is used for"
                />
              </div>
            </FormGrid>
            <FormGrid design="1">
              <div
                v-if="newInput.type === 'boolean'"
                class="flex flex-row items-center justify-between gap-4 rounded-lg border p-4 text-sm"
                data-slot="form-item"
              >
                <div class="text-left">
                  <Label>Default value</Label>
                  <p class="text-muted-foreground mt-1 text-xs">
                    Toggle the boolean default.
                  </p>
                </div>
                <Switch
                  id="new-input-default"
                  :model-value="newInput.defaultValue === 'true'"
                  @update:model-value="
                    (v: boolean) =>
                      (newInput.defaultValue = v ? 'true' : 'false')
                  "
                />
              </div>
              <div
                v-else-if="
                  newInput.type === 'object' || newInput.type === 'array'
                "
                class="space-y-1.5"
              >
                <Label for="new-input-default">
                  Default value
                  <span class="text-muted-foreground ml-1 text-xs font-normal">
                    ({{ t('form.optional') }})
                  </span>
                </Label>
                <div
                  class="h-48"
                  :class="{
                    'ring-destructive rounded-lg ring-1': newInputJsonError,
                  }"
                >
                  <JsonCodeEditor
                    :model-value="newInput.defaultValue || defaultPlaceholder"
                    @update:model-value="
                      (v: string) => (newInput.defaultValue = v)
                    "
                  />
                </div>
                <p v-if="newInputJsonError" class="text-destructive text-xs">
                  {{ newInputJsonError }}
                </p>
              </div>
              <div v-else class="space-y-1.5">
                <Label for="new-input-default">
                  Default value
                  <span class="text-muted-foreground ml-1 text-xs font-normal">
                    ({{ t('form.optional') }})
                  </span>
                </Label>
                <Input
                  id="new-input-default"
                  :model-value="newInput.defaultValue"
                  :type="newInput.type === 'number' ? 'number' : 'text'"
                  @update:model-value="
                    (v) => (newInput.defaultValue = String(v ?? ''))
                  "
                />
              </div>
            </FormGrid>
            <FormGrid design="1">
              <div
                class="flex flex-row items-center justify-between gap-4 rounded-lg border p-4 text-sm"
                data-slot="form-item"
              >
                <div class="text-left">
                  <Label for="new-input-required" class="text-sm font-semibold">
                    Required
                  </Label>
                  <p class="text-muted-foreground mt-1 text-xs">
                    Executions must provide a value for this input.
                  </p>
                </div>
                <Switch id="new-input-required" v-model="newInput.required" />
              </div>
            </FormGrid>
            <p v-if="addInputError" class="text-destructive text-sm">
              {{ addInputError }}
            </p>
          </FormGridWrap>
        </form>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="addInputDialogOpen = false">
          {{ t('cancel') }}
        </Button>
        <Button :disabled="!newInputCanSave" @click="confirmAddInput">
          Add input
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>

  <!-- Edit input sheet -->
  <Sheet v-model:open="editInputOpen">
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>Edit input</SheetTitle>
        <SheetDescription>
          Change the default value for this input.
        </SheetDescription>
      </SheetHeader>
      <SheetBody v-if="editingInput">
        <FormGridWrap>
          <FormGrid design="1+1">
            <div class="space-y-1.5">
              <Label>Name</Label>
              <Input :model-value="editingInput.name" disabled />
            </div>
            <div class="space-y-1.5">
              <Label>Type</Label>
              <Input :model-value="editingInput.type" disabled />
            </div>
          </FormGrid>
          <FormGrid design="1">
            <div
              v-if="editingInput.type === 'boolean'"
              class="flex flex-row items-center justify-between gap-4 rounded-lg border p-4 text-sm"
              data-slot="form-item"
            >
              <div class="text-left">
                <Label>Default value</Label>
                <p class="text-muted-foreground mt-1 text-xs">
                  Toggle the boolean default.
                </p>
              </div>
              <Switch
                :model-value="editDefaultValue === 'true'"
                @update:model-value="
                  (v: boolean) => (editDefaultValue = v ? 'true' : 'false')
                "
              />
            </div>
            <div v-else-if="editingInput.type === 'number'" class="space-y-1.5">
              <Label>Default value</Label>
              <Input
                type="number"
                :model-value="editDefaultValue"
                @update:model-value="
                  (v) => (editDefaultValue = String(v ?? ''))
                "
              />
            </div>
            <div
              v-else-if="
                editingInput.type === 'object' || editingInput.type === 'array'
              "
              class="space-y-1.5"
            >
              <Label>Default value</Label>
              <div
                class="h-64"
                :class="{ 'ring-destructive rounded-lg ring-1': editJsonError }"
              >
                <JsonCodeEditor
                  :model-value="editDefaultValue"
                  @update:model-value="(v: string) => (editDefaultValue = v)"
                />
              </div>
              <p v-if="editJsonError" class="text-destructive text-xs">
                {{ editJsonError }}
              </p>
            </div>
            <div v-else class="space-y-1.5">
              <Label>Default value</Label>
              <Input
                :model-value="editDefaultValue"
                @update:model-value="
                  (v) => (editDefaultValue = String(v ?? ''))
                "
              />
            </div>
          </FormGrid>
        </FormGridWrap>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="editInputOpen = false">
          {{ t('cancel') }}
        </Button>
        <Button :disabled="!editCanSave" @click="confirmEditInput">Save</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>

  <!-- Add group dialog -->
  <Dialog v-model:open="addGroupDialogOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add group</DialogTitle>
        <DialogDescription>
          Groups organize related inputs. The group persists once you add at
          least one input to it and save.
        </DialogDescription>
      </DialogHeader>
      <form @submit.prevent="confirmAddGroup">
        <FormGridWrap>
          <FormGrid design="1">
            <div class="space-y-1.5">
              <Label for="new-group-name">Name</Label>
              <Input
                id="new-group-name"
                v-model="newGroupName"
                placeholder="e.g. Filters"
                autofocus
              />
            </div>
          </FormGrid>
          <p v-if="addGroupError" class="text-destructive text-sm">
            {{ addGroupError }}
          </p>
        </FormGridWrap>
      </form>
      <DialogFooter>
        <Button variant="secondary" @click="addGroupDialogOpen = false">
          {{ t('cancel') }}
        </Button>
        <Button @click="confirmAddGroup">Add group</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
