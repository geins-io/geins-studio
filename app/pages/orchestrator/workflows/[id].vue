<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import cronstrue from 'cronstrue'
import { useForm } from 'vee-validate'
import * as z from 'zod'
import 'cronstrue/locales/sv'
import { DataItemDisplayType } from '#shared/types'
import { useToast } from '@/components/ui/toast/use-toast'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const breadcrumbsStore = useBreadcrumbsStore()
const { geinsLogError } = useGeinsLog('workflow-editor')
const { t, locale } = useI18n()
const { toast } = useToast()
const { orchestratorApi } = useGeinsRepository()

const workflowId = computed(() => route.params.id as string)
const isNew = computed(() => workflowId.value === 'new')
const entityName = 'workflow'

// ─── Editor manifest — trigger types + event entities for General tab ──
const manifestStore = useWorkflowManifest()
const { triggerTypes: manifestTriggerTypes, eventEntities: manifestEventEntities } = manifestStore

// ─── Form validation schema ────────────────────────────────────────
const formSchema = toTypedSchema(
  z.object({
    details: z.object({
      name: z.string().min(1, { message: t('form.field_required') }),
      description: z.string().optional(),
      group: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
    trigger: z.object({
      type: z.enum(['OnDemand', 'Scheduled', 'Event']),
      cron: z.string().optional(),
      eventEntity: z.string().optional(),
      eventAction: z.string().optional(),
      eventSubEntity: z.string().optional(),
      description: z.string().optional(),
    }),
    settings: z.object({
      timeout: z.string().optional(),
      maxConcurrency: z.number().optional(),
      executionLogRetentionDays: z.number().optional(),
      logVerbosity: z.string().optional(),
      timeoutBehavior: z.string().optional(),
      errorHandlingStrategy: z.string().optional(),
    }),
  }),
)

type WorkflowFormValues = {
  details: { name: string, description: string, group: string, tags: string[] }
  trigger: { type: 'OnDemand' | 'Scheduled' | 'Event', cron: string, eventEntity: string, eventAction: string, eventSubEntity: string, description: string }
  settings: Record<string, unknown>
}

// `keepValuesOnUnmount` prevents vee-validate from wiping field values when the
// FormField components unmount on tab switch — without it `editableState`
// would diff from the snapshot and the unsaved-changes dialog would fire
// every time the user changes tab.
const form = useForm<WorkflowFormValues>({
  validationSchema: formSchema,
  keepValuesOnUnmount: true,
  initialValues: {
    details: {
      name: isNew.value ? 'New Workflow' : '',
      description: '',
      group: '',
      tags: [],
    },
    trigger: {
      type: 'OnDemand',
      cron: '',
      eventEntity: '',
      eventAction: '',
      eventSubEntity: '',
      description: '',
    },
    settings: {},
  },
})

// Enables re-validation on every field change after a failed save attempt — so
// error messages track fixes in real time instead of persisting until next save.
const validateOnChange = ref(false)
watch(
  () => form.values,
  async () => {
    if (validateOnChange.value) await form.validate()
  },
  { deep: true },
)

// Top-level bindings to form values. Keep reactivity narrow so other computeds
// and the template don't need to dig through form.values repeatedly.
const triggerTypeValue = computed(() => form.values.trigger?.type ?? 'OnDemand')
const triggerCronValue = computed(() => form.values.trigger?.cron ?? '')
const triggerEventEntity = computed(() => form.values.trigger?.eventEntity ?? '')
const triggerEventAction = computed(() => form.values.trigger?.eventAction ?? '')
const workflowNameValue = computed(() => form.values.details?.name ?? '')

// ─── Non-form reactive state ───────────────────────────────────────
const workflowActive = ref(false)
const inputValues = ref<Record<string, unknown>>({})

// Sync breadcrumb title with workflow name.
watch([isNew, workflowNameValue], ([newFlag, name]) => {
  breadcrumbsStore.setCurrentTitle(newFlag ? 'New workflow' : (name || 'Workflow'))
}, { immediate: true })

// Main area tabs (top-level content switcher).
const mainTabs = ['General', 'Builder', 'Inputs', 'Executions', 'History']
const currentTab = ref(0)

// Lazy-load list data when the corresponding tab is first opened.
watch(currentTab, (v) => {
  if (isNew.value) return
  if (v === 3 && !executionsLoaded.value) {
    executionsLoaded.value = true
    loadExecutions()
  }
  if (v === 4 && !historyLoaded.value) {
    historyLoaded.value = true
    loadHistory()
  }
})

// ─── Trigger & cron helpers ────────────────────────────────────────
const cronDescription = computed(() => {
  const expr = triggerCronValue.value.trim()
  if (!expr) return ''
  try {
    return cronstrue.toString(expr, { locale: locale.value, use24HourTimeFormat: true })
  }
  catch {
    return ''
  }
})

const cronError = computed(() => {
  const expr = triggerCronValue.value.trim()
  if (!expr) return ''
  try {
    cronstrue.toString(expr)
    return ''
  }
  catch (err) {
    return err instanceof Error ? err.message : 'Invalid cron expression'
  }
})

const availableEventActions = computed(() => {
  if (!triggerEventEntity.value) return []
  const entity = manifestEventEntities.value.find(e => e.name === triggerEventEntity.value)
  return entity?.actions ?? []
})

const availableSubEntities = computed(() => {
  if (!triggerEventEntity.value) return []
  const entity = manifestEventEntities.value.find(e => e.name === triggerEventEntity.value)
  return entity?.subEntities ?? []
})

const prettyLabel = (name: string): string =>
  name
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(w => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ')

const executionsLoaded = ref(false)
const historyLoaded = ref(false)

// ─── Executions + history lazy fetches ─────────────────────────────
const pad = (n: number, len = 2) => String(n).padStart(len, '0')

const formatStartedAt = (iso: string | undefined): string => {
  if (!iso) return '–'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

const formatDuration = (ms: number | undefined): string => {
  if (ms === undefined || ms === null) return '–'
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}m ${remainingSeconds}s`
}

const mapStatus = (status: string | undefined): 'success' | 'failed' | 'running' | string => {
  const s = (status ?? '').toLowerCase()
  if (s === 'completed') return 'success'
  if (s === 'failed' || s === 'timedout' || s === 'canceled' || s === 'cancelled') return 'failed'
  if (s === 'running' || s === 'pending' || s === 'suspended') return 'running'
  return s || 'unknown'
}

const { data: executionsRaw, pending: executionsLoading, execute: loadExecutions, refresh: refreshExecutions } = useLazyAsyncData(
  () => `workflow-executions-${workflowId.value}`,
  () => isNew.value
    ? Promise.resolve([])
    : orchestratorApi.execution.list({ workflowId: workflowId.value }),
  { immediate: false, default: () => [] },
)

const executions = computed(() =>
  (executionsRaw.value ?? []).map((e: any) => ({
    id: e.id,
    status: mapStatus(e.status),
    startedAt: formatStartedAt(e.startTime),
    duration: formatDuration(e.durationMs),
    trigger: e.startedBy || (e.isTestRun ? 'Test run' : 'Scheduled'),
    error: Array.isArray(e.errors) && e.errors.length > 0 ? e.errors[0] : undefined,
  })),
)

const { data: historyRaw, pending: historyLoading, execute: loadHistory, refresh: refreshHistory } = useLazyAsyncData(
  () => `workflow-history-${workflowId.value}`,
  () => isNew.value
    ? Promise.resolve({ workflowId: '', versions: [] })
    : orchestratorApi.version.getHistory(workflowId.value),
  { immediate: false, default: () => ({ workflowId: '', versions: [] }) },
)

const historyVersions = computed(() => {
  const raw = historyRaw.value as any
  const list: any[] = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.versions)
      ? raw.versions
      : Array.isArray(raw)
        ? raw
        : []
  return list
    .map((v: any) => ({
      version: v.version ?? v.Version,
      createdAt: formatStartedAt(v.archivedAt ?? v.createdAt ?? v.CreatedAt),
      createdBy: v.archivedBy || v.createdBy || v.CreatedBy || null,
      description: v.description ?? v.Description ?? null,
    }))
    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
})

// Pre-compute i18n labels before `await` — after an await, Vue loses the
// active component instance so `t()` silently fails in post-await computeds.
const idLabel = t('entity_id', { entityName: 'workflow' })

// ─── Unsaved changes tracking ────────────────────────────────────
// Must be declared BEFORE `await useAsyncData` — after an await, Vue loses
// the active component instance so composables that register route guards
// (onBeforeRouteLeave) would silently fail.
const editableState = computed(() => ({
  active: workflowActive.value,
  ...form.values,
  inputs: inputValues.value,
}) as Record<string, unknown>)

const originalEditableState = ref('')

const { hasUnsavedChanges, unsavedChangesDialogOpen, confirmLeave } = useUnsavedChanges(
  editableState,
  originalEditableState,
  isNew,
)

// ─── Current workflow (for enable/disable + duplicate) ────────────
const { data: currentWorkflow, refresh: refreshCurrentWorkflow } = await useAsyncData(
  () => `workflow-${workflowId.value}`,
  () => (isNew.value ? Promise.resolve(null) : orchestratorApi.workflow.get(workflowId.value)),
  { watch: [workflowId], getCachedData: () => undefined },
)

const isEnabled = computed(() => currentWorkflow.value?.enabled ?? false)
const menuBusy = ref(false)

// Sync workflow data into form values + non-form refs when it loads (or refreshes).
watch(
  currentWorkflow,
  (wf) => {
    if (!wf || isNew.value) return
    workflowActive.value = wf.enabled ?? false
    const rawInputs = Array.isArray((wf as any)?.input) ? (wf as any).input : []
    const inputs: Record<string, unknown> = {}
    for (const i of rawInputs) inputs[i.name] = i.defaultValue
    inputValues.value = inputs
    form.setValues({
      details: {
        name: wf.name ?? '',
        description: wf.description ?? '',
        group: (wf as any).group ?? '',
        tags: Array.isArray((wf as any)?.tags) ? [...(wf as any).tags] : [],
      },
      trigger: {
        type: (wf.type ?? 'OnDemand') as WorkflowFormValues['trigger']['type'],
        cron: wf.cronExpression ?? '',
        eventEntity: (wf as any).eventEntity ?? '',
        eventAction: (wf as any).eventAction ?? '',
        eventSubEntity: (wf as any).eventSubEntity ?? '',
        description: (wf as any).triggerDescription ?? '',
      },
      settings: { ...((wf as any)?.settings ?? {}) },
    })
  },
  { immediate: true },
)

// Snapshot the original state once workflow data loads so unsaved changes
// can be detected. Uses nextTick to allow all watchers to propagate first.
watch(currentWorkflow, () => {
  if (currentWorkflow.value && !isNew.value) {
    nextTick(() => {
      originalEditableState.value = JSON.stringify(editableState.value)
    })
  }
}, { immediate: true })

const workflowInputs = computed<any[]>(() => {
  const raw = (currentWorkflow.value as any)?.input
  return Array.isArray(raw) ? raw : []
})

const workflowInputsByCategory = computed(() => {
  const order: string[] = []
  const groups: Record<string, any[]> = {}
  for (const input of workflowInputs.value) {
    const cat = input.category || 'general'
    if (!groups[cat]) {
      groups[cat] = []
      order.push(cat)
    }
    groups[cat]!.push(input)
  }
  return order.map(category => ({ category, items: groups[category]! }))
})

// ─── Duplicate ─────────────────────────────────────────────────────
const handleDuplicate = async () => {
  if (isNew.value || !currentWorkflow.value) return
  menuBusy.value = true
  try {
    const src = currentWorkflow.value
    const copy = await orchestratorApi.workflow.create({
      ...src,
      name: `${src.name} (copy)`,
      enabled: false,
    })
    toast({ title: 'Workflow duplicated', description: `Created "${copy.name}".` })
    await navigateTo(`/orchestrator/workflows/${copy.id}`)
  }
  catch (err) {
    toast({
      title: 'Duplicate failed',
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    })
  }
  finally {
    menuBusy.value = false
  }
}

// ─── Delete ────────────────────────────────────────────────────────
const deleteWorkflowEntity = async (): Promise<boolean> => {
  if (isNew.value) return false
  try {
    await orchestratorApi.workflow.delete(workflowId.value)
    return true
  }
  catch {
    return false
  }
}

const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteWorkflowEntity, '/orchestrator/workflows/list')

const isSavingConfig = ref(false)

// ─── Create ────────────────────────────────────────────────────────
const handleCreate = async () => {
  const { valid } = await form.validate()
  if (!valid) {
    validateOnChange.value = true
    return
  }
  validateOnChange.value = false
  isSavingConfig.value = true
  try {
    const values = form.values
    const created = await orchestratorApi.workflow.create({
      name: values.details.name,
      description: values.details.description || undefined,
      tags: values.details.tags,
      type: values.trigger.type as any,
      enabled: false,
      cronExpression: values.trigger.type === 'Scheduled' ? values.trigger.cron : undefined,
      eventName: values.trigger.type === 'Event' ? values.trigger.eventEntity : undefined,
    })
    // Snapshot so the route guard doesn't block navigation to the new page.
    originalEditableState.value = JSON.stringify(editableState.value)
    toast({ title: 'Workflow created', description: `Created "${created.name}".` })
    await navigateTo(`/orchestrator/workflows/${created.id}`)
  }
  catch (err) {
    geinsLogError('Failed to create workflow', err)
    toast({
      title: 'Failed to create',
      description: err instanceof Error ? err.message : 'Unknown error',
      variant: 'negative',
    })
  }
  finally {
    isSavingConfig.value = false
  }
}

// ─── Save ──────────────────────────────────────────────────────────
const handleSave = async () => {
  if (isNew.value || !currentWorkflow.value) return
  const { valid } = await form.validate()
  if (!valid) {
    validateOnChange.value = true
    return
  }
  validateOnChange.value = false
  isSavingConfig.value = true
  try {
    const wf = currentWorkflow.value as any
    const values = form.values
    const mergedInputs = workflowInputs.value.map((i: any) => ({
      ...i,
      defaultValue: inputValues.value[i.name],
    }))
    if (workflowActive.value !== isEnabled.value) {
      if (workflowActive.value) {
        await orchestratorApi.workflow.enable(workflowId.value)
      }
      else {
        await orchestratorApi.workflow.disable(workflowId.value)
      }
    }
    await orchestratorApi.workflow.update(workflowId.value, {
      name: values.details.name,
      description: values.details.description || undefined,
      tags: values.details.tags,
      type: values.trigger.type as any,
      enabled: workflowActive.value,
      cronExpression: values.trigger.type === 'Scheduled' ? values.trigger.cron : undefined,
      eventName: values.trigger.type === 'Event' ? values.trigger.eventEntity : undefined,
      nodes: wf.nodes,
      connections: wf.connections,
      ui: wf.ui,
      input: mergedInputs,
      settings: values.settings,
    })
    await refreshCurrentWorkflow()
    toast({ title: 'Configuration saved' })
  }
  catch (err) {
    geinsLogError('Failed to save workflow configuration', err)
    toast({
      title: 'Failed to save',
      description: err instanceof Error ? err.message : 'Unknown error',
      variant: 'negative',
    })
  }
  finally {
    isSavingConfig.value = false
  }
}

// ─── Sidebar summary ─────────────────────────────────────────────
// Only show the summary sidebar on the General tab (like company/price-list pattern).
// On smaller viewports (hasReducedSpace) or other tabs, the sidebar collapses into
// a floating toggle icon via ContentEditMain.
const { hasReducedSpace } = useLayout()
const showSidebar = computed(() => !hasReducedSpace.value && currentTab.value === 0 && !isNew.value)

const triggerDisplayName = computed(() => {
  const tt = manifestTriggerTypes.value.find(t => (t.type as string) === triggerTypeValue.value)
  return tt?.displayName ?? triggerTypeValue.value
})

const summary = computed<DataItem[]>(() => {
  const items: DataItem[] = []
  if (!isNew.value) {
    const id = workflowId.value
    const short = id.length > 13 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id
    items.push({ label: idLabel, value: id, displayValue: short, displayType: DataItemDisplayType.Copy })
  }
  if (workflowNameValue.value) {
    items.push({ label: 'Name', value: workflowNameValue.value })
  }
  const group = form.values.details?.group
  if (group) {
    items.push({ label: 'Group', value: group })
  }
  const tags = form.values.details?.tags ?? []
  if (tags.length) {
    items.push({ label: 'Tags', value: tags })
  }
  return items
})

const triggerSummary = computed<DataItem[]>(() => {
  const items: DataItem[] = []
  items.push({ label: 'Type', value: triggerDisplayName.value })
  if (triggerTypeValue.value === 'Scheduled' && triggerCronValue.value && cronDescription.value) {
    items.push({ label: 'Schedule', value: cronDescription.value })
  }
  if (triggerTypeValue.value === 'Event' && triggerEventEntity.value) {
    const entityLabel = manifestEventEntities.value.find(e => e.name === triggerEventEntity.value)?.displayName ?? triggerEventEntity.value
    const actionLabel = triggerEventAction.value
      ? (availableEventActions.value.find(a => a.name === triggerEventAction.value)?.displayName ?? triggerEventAction.value)
      : ''
    items.push({ label: 'Event', value: actionLabel ? `${entityLabel} / ${actionLabel}` : entityLabel })
  }
  return items
})

const settingsValuesView = computed(() => form.values.settings ?? {})

const settingsSummary = computed<DataItem[]>(() => {
  const items: DataItem[] = []
  const s = settingsValuesView.value
  if (s.timeout) items.push({ label: 'Timeout', value: String(s.timeout) })
  if (s.logVerbosity) items.push({ label: 'Log verbosity', value: String(s.logVerbosity) })
  if (s.errorHandlingStrategy) items.push({ label: 'Error handling', value: String(s.errorHandlingStrategy) })
  return items
})

const { summaryProps } = useEntityEditSummary({
  createMode: isNew,
  formTouched: hasUnsavedChanges,
  summary,
  settingsSummary,
  entityName,
  entityLiveStatus: isEnabled,
  status: computed(() => (isEnabled.value ? 'active' : 'inactive')),
})
</script>

<template>
  <DialogUnsavedChanges
v-model:open="unsavedChangesDialogOpen" :entity-name="entityName" :loading="isSavingConfig"
    @confirm="confirmLeave" />
  <DialogDelete
v-model:open="deleteDialogOpen" :entity-name="entityName" :loading="deleting"
    @confirm="confirmDelete" />

  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="isNew ? 'New workflow' : (workflowNameValue || 'Workflow')" :entity-name="entityName">
        <ContentActionBar>
          <ButtonIcon
v-if="!isNew" icon="save" :loading="isSavingConfig"
            :disabled="isSavingConfig || !hasUnsavedChanges" @click="handleSave">
            {{ $t('save_entity', { entityName }) }}
          </ButtonIcon>
          <DropdownMenu v-if="!isNew">
            <DropdownMenuTrigger as-child>
              <Button size="icon" variant="secondary">
                <LucideMoreHorizontal class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem as-child>
                <NuxtLink to="/orchestrator/workflows/new">
                  <LucidePlus class="mr-2 size-4" />
                  <span>{{ $t('new_entity', { entityName }) }}</span>
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="menuBusy || !currentWorkflow" @click="handleDuplicate">
                <LucideCopy class="mr-2 size-4" />
                <span>Duplicate</span>
              </DropdownMenuItem>
              <DropdownMenuItem :disabled="!currentWorkflow" @click="workflowActive = !workflowActive">
                <LucidePause v-if="workflowActive" class="mr-2 size-4" />
                <LucidePlay v-else class="mr-2 size-4" />
                <span>{{ workflowActive ? 'Pause' : 'Start' }}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="openDeleteDialog">
                <LucideTrash class="mr-2 size-4" />
                <span>{{ $t('delete_entity', { entityName }) }}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ContentActionBar>
        <template v-if="!isNew" #tabs>
          <ContentEditTabs v-model:current-tab="currentTab" :tabs="mainTabs" />
        </template>
        <template v-if="!isNew" #changes>
          <ContentEditHasChanges :changes="hasUnsavedChanges" />
        </template>
      </ContentHeader>
    </template>

    <form v-if="currentTab !== 1" @submit.prevent>
      <ContentEditMain :show-sidebar="showSidebar">
        <!-- General tab -->
        <KeepAlive>
          <ContentEditMainContent v-if="currentTab === 0" :key="`tab-${currentTab}`">
              <ContentEditCard
title="General"
                description="Name, description, group, and tags used to organize this workflow.">
                <FormGridWrap>
                  <FormGrid design="1+1">
                    <FormField v-slot="{ componentField }" name="details.name">
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" placeholder="Workflow name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="details.group">
                      <FormItem>
                        <FormLabel :optional="true">Group</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" placeholder="e.g. Monitor ERP Sync" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                  <FormGrid design="1">
                    <FormField v-slot="{ componentField }" name="details.description">
                      <FormItem>
                        <FormLabel :optional="true">Description</FormLabel>
                        <FormControl>
                          <Textarea v-bind="componentField" rows="3" placeholder="Describe what this workflow does…" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                  <FormGrid design="1">
                    <FormField v-slot="{ componentField }" name="details.tags">
                      <FormItem>
                        <FormLabel :optional="true">Tags</FormLabel>
                        <FormControl>
                          <TagsInput
:model-value="(componentField.modelValue as string[]) || []"
                            class="min-h-10 flex-wrap" @update:model-value="componentField['onUpdate:modelValue']">
                            <TagsInputItem
v-for="tag in ((componentField.modelValue as string[]) || [])" :key="tag"
                              :value="tag">
                              <TagsInputItemText />
                              <TagsInputItemDelete />
                            </TagsInputItem>
                            <TagsInputInput placeholder="Add tag…" />
                          </TagsInput>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                </FormGridWrap>
              </ContentEditCard>

              <ContentEditCard title="Trigger" description="How and when this workflow starts.">
                <FormGridWrap>
                  <FormGrid design="1">
                    <FormField v-slot="{ componentField }" name="trigger.type">
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <FormControl>
                          <Select v-bind="componentField">
                            <SelectTrigger>
                              <SelectValue placeholder="Select trigger type…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem v-for="tt in manifestTriggerTypes" :key="tt.type" :value="tt.type">
                                {{ tt.displayName }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>

                  <div v-if="triggerTypeValue === 'OnDemand'" class="text-muted-foreground text-sm">
                    Triggered manually via API call. No additional configuration needed.
                  </div>

                  <template v-if="triggerTypeValue === 'Scheduled'">
                    <FormGrid design="1">
                      <FormField v-slot="{ componentField }" name="trigger.cron">
                        <FormItem>
                          <FormLabel>Cron expression</FormLabel>
                          <FormControl>
                            <Input
v-bind="componentField" placeholder="0 * * * * *"
                              :class="{ 'border-destructive': cronError }" />
                          </FormControl>
                          <p v-if="cronError" class="text-destructive text-xs">{{ cronError }}</p>
                          <p v-else-if="cronDescription" class="text-muted-foreground text-xs">{{ cronDescription }}
                          </p>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </FormGrid>
                  </template>

                  <template v-if="triggerTypeValue === 'Event'">
                    <FormGrid design="1+1">
                      <FormField v-slot="{ componentField }" name="trigger.eventEntity">
                        <FormItem>
                          <FormLabel>Entity</FormLabel>
                          <FormControl>
                            <Select v-bind="componentField">
                              <SelectTrigger>
                                <SelectValue placeholder="Select entity…" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="*">* (any)</SelectItem>
                                <SelectItem
v-for="entity in manifestEventEntities" :key="entity.name"
                                  :value="entity.name">
                                  {{ entity.displayName }}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                      <FormField v-slot="{ componentField }" name="trigger.eventAction">
                        <FormItem>
                          <FormLabel>Action</FormLabel>
                          <FormControl>
                            <Select v-bind="componentField">
                              <SelectTrigger>
                                <SelectValue placeholder="Select action…" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="*">* (any)</SelectItem>
                                <SelectItem v-for="a in availableEventActions" :key="a.name" :value="a.name">
                                  {{ a.displayName }}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </FormGrid>
                    <FormGrid v-if="availableSubEntities.length > 0" design="1+1">
                      <FormField v-slot="{ componentField }" name="trigger.eventSubEntity">
                        <FormItem>
                          <FormLabel :optional="true">Sub-entity</FormLabel>
                          <FormControl>
                            <Select v-bind="componentField">
                              <SelectTrigger>
                                <SelectValue placeholder="None" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                <SelectItem value="*">* (any)</SelectItem>
                                <SelectItem value="!">! (absent only)</SelectItem>
                                <SelectItem v-for="sub in availableSubEntities" :key="sub" :value="sub">
                                  {{ sub }}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </FormGrid>
                    <FormGrid design="1">
                      <FormField v-slot="{ componentField }" name="trigger.description">
                        <FormItem>
                          <FormLabel :optional="true">Description</FormLabel>
                          <FormControl>
                            <Input v-bind="componentField" placeholder="e.g. When an order is updated" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </FormField>
                    </FormGrid>
                  </template>
                </FormGridWrap>
              </ContentEditCard>

              <ContentEditCard
v-if="!isNew" title="Runtime Settings"
                description="Timeout, concurrency, logging, and error handling.">
                <FormGridWrap>
                  <FormGrid>
                    <FormField v-slot="{ componentField }" name="settings.timeout">
                      <FormItem>
                        <FormLabel :optional="true">Timeout</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" placeholder="00:10:00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="settings.maxConcurrency">
                      <FormItem>
                        <FormLabel :optional="true">Max concurrency</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" type="number" min="1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="settings.executionLogRetentionDays">
                      <FormItem>
                        <FormLabel :optional="true">Log retention (days)</FormLabel>
                        <FormControl>
                          <Input v-bind="componentField" type="number" min="0" placeholder="Keep indefinitely" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                  <FormGrid design="1+1+1">
                    <FormField v-slot="{ componentField }" name="settings.logVerbosity">
                      <FormItem>
                        <FormLabel :optional="true">Log verbosity</FormLabel>
                        <FormControl>
                          <Select v-bind="componentField">
                            <SelectTrigger>
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minimal">Minimal</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="detailed">Detailed</SelectItem>
                              <SelectItem value="debug">Debug</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="settings.timeoutBehavior">
                      <FormItem>
                        <FormLabel :optional="true">Timeout behaviour</FormLabel>
                        <FormControl>
                          <Select v-bind="componentField">
                            <SelectTrigger>
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fail">Fail</SelectItem>
                              <SelectItem value="continue">Continue</SelectItem>
                              <SelectItem value="cancel">Cancel</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField v-slot="{ componentField }" name="settings.errorHandlingStrategy">
                      <FormItem>
                        <FormLabel :optional="true">Error handling</FormLabel>
                        <FormControl>
                          <Select v-bind="componentField">
                            <SelectTrigger>
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="failFast">Fail fast</SelectItem>
                              <SelectItem value="continue">Continue on error</SelectItem>
                              <SelectItem value="retry">Retry</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                </FormGridWrap>
              </ContentEditCard>

              <ContentEditCard
                v-if="!isNew && ((settingsValuesView as any).retryPolicy || (settingsValuesView as any).rateLimit)"
                title="Advanced" description="Retry and rate-limit policies.">
                <FormGridWrap>
                  <FormGrid design="1+1">
                    <FormItem v-if="(settingsValuesView as any).retryPolicy">
                      <Label>Retry policy</Label>
                      <pre class="bg-muted text-muted-foreground overflow-x-auto rounded p-2 text-xs">{{
                        JSON.stringify((settingsValuesView as any).retryPolicy, null, 2)
                      }}</pre>
                    </FormItem>
                    <FormItem v-if="(settingsValuesView as any).rateLimit">
                      <Label>Rate limit</Label>
                      <pre class="bg-muted text-muted-foreground overflow-x-auto rounded p-2 text-xs">{{
                        JSON.stringify((settingsValuesView as any).rateLimit, null, 2)
                      }}</pre>
                    </FormItem>
                  </FormGrid>
                </FormGridWrap>
              </ContentEditCard>

          <div v-if="isNew" class="flex flex-row justify-end gap-4">
            <Button variant="secondary" as-child>
              <NuxtLink to="/orchestrator/workflows/list">{{ $t('cancel') }}</NuxtLink>
            </Button>
            <Button :loading="isSavingConfig" @click="handleCreate">
              {{ $t('create_entity', { entityName }) }}
            </Button>
          </div>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- Inputs tab -->
        <KeepAlive>
          <ContentEditMainContent v-if="currentTab === 2" :key="`tab-${currentTab}`">
            <ContentEditCard v-if="workflowInputs.length === 0" title="Inputs">
              <div class="text-muted-foreground py-12 text-center text-sm">
                This workflow has no inputs
              </div>
            </ContentEditCard>
            <ContentEditCard
v-for="group in workflowInputsByCategory" v-else :key="group.category"
              :title="group.category"
              :description="`${group.items.length} input${group.items.length === 1 ? '' : 's'}`">
              <template #header-action>
                <Button variant="secondary" size="sm" @click="() => { }">
                  <LucidePlus class="mr-2 h-3.5 w-3.5" />
                  Add input
                </Button>
              </template>
              <FormGridWrap>
                <div
v-for="item in group.items" :key="item.name"
                  class="grid grid-cols-[20rem_1fr] items-start gap-4 border-b py-3 last:border-b-0">
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-medium">{{ prettyLabel(item.name) }}</span>
                      <span v-if="item.required" class="text-destructive text-sm">*</span>
                    </div>
                    <div class="text-muted-foreground mt-0.5 font-mono text-[11px] break-all">
                      {{ item.name }}
                    </div>
                    <div class="mt-1 flex items-center gap-1.5">
                      <span class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">{{ item.type
                      }}</span>
                    </div>
                    <div v-if="item.description" class="text-muted-foreground mt-1.5 text-xs">
                      {{ item.description }}
                    </div>
                  </div>
                  <div class="flex min-w-0 items-start">
                    <Switch
v-if="item.type === 'boolean'" :model-value="!!inputValues[item.name]"
                      @update:model-value="(v: boolean) => (inputValues[item.name] = v)" />
                    <Input
v-else-if="item.type === 'number'" type="number" :model-value="inputValues[item.name] as any"
                      @update:model-value="(v) => (inputValues[item.name] = v === '' ? null : Number(v))" />
                    <Input
v-else :model-value="inputValues[item.name] == null ? '' : String(inputValues[item.name])"
                      @update:model-value="(v) => (inputValues[item.name] = v)" />
                  </div>
                </div>
              </FormGridWrap>
            </ContentEditCard>
            <Button
variant="outline" class="text-muted-foreground hover:text-foreground mt-2 w-full border-dashed py-6"
              @click="() => { }">
              <LucidePlus class="mr-2 h-4 w-4" />
              Add group
            </Button>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- Executions tab -->
        <KeepAlive>
          <ContentEditMainContent v-if="currentTab === 3" :key="`tab-${currentTab}`">
            <ContentEditCard title="Executions" :description="`(${executions.length})`">
              <template #header-action>
                <Button variant="secondary" size="sm" :disabled="executionsLoading" @click="refreshExecutions()">
                  <LucideRefreshCw class="mr-2 h-3.5 w-3.5" :class="{ 'animate-spin': executionsLoading }" />
                  Refresh
                </Button>
              </template>
              <div v-if="executionsLoading && executions.length === 0" class="space-y-3">
                <div v-for="n in 5" :key="n" class="rounded-lg border p-3">
                  <Skeleton class="mb-2 h-4 w-32" />
                  <Skeleton class="h-3 w-48" />
                </div>
              </div>
              <div v-else class="space-y-2">
                <NuxtLink
v-for="execution in executions" :key="execution.id"
                  :to="`/orchestrator/executions/${execution.id}`"
                  class="hover:bg-muted/50 grid grid-cols-[6rem_1fr_10rem_8rem] items-center gap-4 rounded-lg border p-3 transition-colors">
                  <div class="flex items-center gap-2">
                    <div
class="h-2 w-2 rounded-full" :class="{
                      'bg-green-500': execution.status === 'success',
                      'bg-red-500': execution.status === 'failed',
                      'animate-pulse bg-yellow-500': execution.status === 'running',
                    }" />
                    <span class="text-sm font-medium capitalize">{{ execution.status }}</span>
                  </div>
                  <div class="text-muted-foreground truncate font-mono text-xs">{{ execution.startedAt }}</div>
                  <div class="text-muted-foreground truncate text-xs">Trigger: {{ execution.trigger }}</div>
                  <div class="text-muted-foreground text-right font-mono text-xs">{{ execution.duration }}</div>
                </NuxtLink>
                <div v-if="executions.length === 0" class="text-muted-foreground py-12 text-center text-sm">
                  No executions yet
                </div>
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- History tab -->
        <KeepAlive>
          <ContentEditMainContent v-if="currentTab === 4" :key="`tab-${currentTab}`">
            <ContentEditCard title="Version history" :description="`(${historyVersions.length})`">
              <template #header-action>
                <Button variant="secondary" size="sm" :disabled="historyLoading" @click="refreshHistory()">
                  <LucideRefreshCw class="mr-2 h-3.5 w-3.5" :class="{ 'animate-spin': historyLoading }" />
                  Refresh
                </Button>
              </template>
              <div v-if="historyLoading && historyVersions.length === 0" class="space-y-3">
                <div v-for="n in 5" :key="n" class="rounded-lg border p-3">
                  <Skeleton class="mb-2 h-4 w-16" />
                  <Skeleton class="h-3 w-48" />
                </div>
              </div>
              <div v-else class="space-y-2">
                <div
v-for="entry in historyVersions" :key="entry.version"
                  class="grid grid-cols-[6rem_1fr_12rem] items-center gap-4 rounded-lg border p-3">
                  <div class="flex items-center gap-2">
                    <LucideGitCommit class="text-muted-foreground h-3.5 w-3.5" />
                    <span class="text-sm font-medium">v{{ entry.version }}</span>
                  </div>
                  <div class="text-muted-foreground truncate text-xs">{{ entry.description || '—' }}</div>
                  <div class="text-muted-foreground text-right font-mono text-xs">{{ entry.createdAt }}</div>
                </div>
                <div v-if="historyVersions.length === 0" class="text-muted-foreground py-12 text-center text-sm">
                  No version history
                </div>
              </div>
            </ContentEditCard>
          </ContentEditMainContent>
        </KeepAlive>

        <template #sidebar>
          <ContentEditSummary v-model:active="workflowActive" v-bind="summaryProps">
            <template #after-summary>
              <ContentDataList v-if="triggerSummary.length" :data-list="triggerSummary" label="Trigger" />
            </template>
          </ContentEditSummary>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>

  <!-- Builder tab: rendered outside ContentEditWrap so it escapes the
       `container` max-width. `-mx-3 @2xl:-mx-8` also escapes the default
       layout's padding so the VueFlow canvas fills the available width.
       `-mt-4` closes the gap left by ContentHeader's `mb-4` so the canvas
       starts right under the tabs. -->
  <KeepAlive>
    <WorkflowBuilder
v-if="currentTab === 1" :key="`tab-${currentTab}`" class="-mx-3 -mt-4 @2xl:-mx-8"
      :workflow-id="workflowId" :is-new="isNew" @executed="refreshExecutions" />
  </KeepAlive>
</template>
