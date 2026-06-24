<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod';
import cronstrue from 'cronstrue';
import { useForm } from 'vee-validate';
import * as z from 'zod';
import 'cronstrue/locales/sv';
import { DataItemDisplayType } from '#shared/types';
import type {
  WorkflowDefinition,
  WorkflowInput,
  WorkflowNode,
  WorkflowNodeConnection,
  EntityBaseWithName,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';
import { sanitizeWorkflowNodes } from '@/composables/useWorkflowCanvas';
import type { Component } from 'vue';

definePageMeta({
  layout: 'default',
});

const route = useRoute();
const breadcrumbsStore = useBreadcrumbsStore();
const { geinsLogInfo, geinsLogError } = useGeinsLog('workflow-editor');
const { t, locale } = useI18n();
const { toast } = useToast();
const { orchestratorApi } = useGeinsRepository();
const { triggerTypeLabel, logVerbosityLabel, errorHandlingLabel } =
  useWorkflowLabels();

function extractApiError(
  err: unknown,
): { title?: string; detail?: string } | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as Record<string, unknown>;
  const orig = e.originalError as Record<string, unknown> | undefined;
  if (typeof orig?.data === 'string') return { detail: orig.data };
  if (orig?.data && typeof orig.data === 'object') {
    const d = orig.data as Record<string, unknown>;
    if (d.title || d.detail)
      return { title: d.title as string, detail: d.detail as string };
    if (d.message && typeof d.message === 'string')
      return { detail: d.message };
  }
  if (orig?.title || orig?.detail)
    return { title: orig?.title as string, detail: orig?.detail as string };
  if (e.message && typeof e.message === 'string') return { detail: e.message };
  return undefined;
}

const workflowId = computed(() => route.params.id as string);
const isNew = computed(() => workflowId.value === 'new');
const entityName = 'workflow';

// ─── Editor manifest — trigger types + event entities for General tab ──
const manifestStore = useWorkflowManifest();
const {
  triggerTypes: manifestTriggerTypes,
  eventEntities: manifestEventEntities,
} = manifestStore;

// ─── Workflow groups (single-select group input) ──────────────────────
// No groups endpoint exists; the set is derived from existing workflows.
// Populated by the list page; lazily fetched here if not visited yet.
const workflowGroupsStore = useWorkflowGroupsStore();
const { groups: workflowGroups } = storeToRefs(workflowGroupsStore);
const groupDataSet = computed<EntityBaseWithName[]>(() =>
  workflowGroups.value.map((group) => ({ _id: group, name: group })),
);
onMounted(() => {
  workflowGroupsStore.ensureLoaded().catch((err) => {
    geinsLogError('failed to load workflow groups', err);
  });
});

// ─── Form validation schema ────────────────────────────────────────
const formSchema = toTypedSchema(
  z.object({
    details: z.object({
      name: z.string().min(1, { message: t('form.field_required') }),
      description: z.string().optional(),
      group: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
    trigger: z
      .object({
        type: z.enum(['OnDemand', 'Scheduled', 'Event']),
        cron: z.string().optional(),
        eventEntity: z.string().optional(),
        eventAction: z.string().optional(),
        eventSubEntity: z.string().optional(),
        description: z.string().optional(),
      })
      .superRefine((val, ctx) => {
        if (val.type === 'Scheduled') {
          const expr = (val.cron ?? '').trim();
          if (!expr) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('workflows.cron_required'),
              path: ['cron'],
            });
            return;
          }
          try {
            cronstrue.toString(expr);
          } catch {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('workflows.cron_invalid'),
              path: ['cron'],
            });
          }
        }
        if (val.type === 'Event' && !val.eventEntity?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('workflows.event_entity_required'),
            path: ['eventEntity'],
          });
        }
      }),
    // `.nullish()` (not `.optional()`) because the Management API returns
    // `null` — not `undefined` — for unset settings fields, and the watcher
    // hydrates the form with those literal values.
    settings: z.object({
      timeout: z.string().nullish(),
      maxConcurrency: z.number().nullish(),
      executionLogRetentionDays: z.number().nullish(),
      logVerbosity: z.string().nullish(),
      timeoutBehavior: z.string().nullish(),
      errorHandlingStrategy: z.string().nullish(),
    }),
  }),
);

type WorkflowFormValues = {
  details: { name: string; description: string; group: string; tags: string[] };
  trigger: {
    type: 'OnDemand' | 'Scheduled' | 'Event';
    cron: string;
    eventEntity: string;
    eventAction: string;
    eventSubEntity: string;
    description: string;
  };
  settings: Record<string, unknown>;
};

// `keepValuesOnUnmount` prevents vee-validate from wiping field values when the
// FormField components unmount on tab switch — without it `editableState`
// would diff from the snapshot and the unsaved-changes dialog would fire
// every time the user changes tab.
const form = useForm<WorkflowFormValues>({
  validationSchema: formSchema,
  keepValuesOnUnmount: true,
  initialValues: {
    details: {
      name: isNew.value ? t('workflows.new_workflow_name') : '',
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
});

// Enables re-validation on every field change after a failed save attempt — so
// error messages track fixes in real time instead of persisting until next save.
const validateOnChange = ref(false);
watch(
  () => form.values,
  async () => {
    if (validateOnChange.value) await form.validate();
  },
  { deep: true },
);

// Top-level bindings to form values. Keep reactivity narrow so other computeds
// and the template don't need to dig through form.values repeatedly.
const triggerTypeValue = computed(
  () => form.values.trigger?.type ?? 'OnDemand',
);
const triggerCronValue = computed(() => form.values.trigger?.cron ?? '');
const triggerEventEntity = computed(
  () => form.values.trigger?.eventEntity ?? '',
);
const triggerEventAction = computed(
  () => form.values.trigger?.eventAction ?? '',
);
const workflowNameValue = computed(() => form.values.details?.name ?? '');

// ─── Non-form reactive state ───────────────────────────────────────
const workflowActive = ref(false);
const inputValues = ref<Record<string, unknown>>({});
// Mutable copy of the workflow's input schema. Populated from the loaded
// workflow and mutated by the Inputs tab — `handleSave` persists the array
// back to the API on save.
const workflowInputs = ref<WorkflowInput[]>([]);
// Categories added via "Add group" that don't yet contain any input. They
// render as empty cards in the Inputs tab; once the user adds an input the
// category persists naturally through `workflowInputs[].category`.
const additionalInputGroups = ref<string[]>([]);
const workflowVariablesKey = 'orchestrator-workflow-variables';
const workflowDataKey = computed(
  () => `orchestrator-workflow-${workflowId.value}`,
);

// Provide workflow inputs + variables to the builder's node properties sidebar
// so the input pane can show available data sources without prop drilling.
provide('workflowInputDefs', workflowInputs);

const { data: workflowVariables } = useAsyncData(
  workflowVariablesKey,
  () => orchestratorApi.variable.list(),
  {
    default: () =>
      [] as {
        key: string;
        value: string;
        description?: string;
        isSecret: boolean;
      }[],
  },
);
provide('workflowVariables', workflowVariables);

// Sync breadcrumb title with workflow name.
watch(
  [isNew, workflowNameValue],
  ([newFlag, name]) => {
    breadcrumbsStore.setCurrentTitle(
      newFlag ? t('workflows.new_workflow_name') : name || t('workflow'),
    );
  },
  { immediate: true },
);

// View mode switcher (top-level: Settings vs Builder).
const viewMode = ref<'settings' | 'builder'>('settings');
const viewModes = computed(
  () =>
    [
      {
        key: 'settings',
        label: t('settings'),
        icon: resolveComponent('LucideSettings'),
      },
      {
        key: 'builder',
        label: t('workflows.builder'),
        icon: resolveComponent('LucideWorkflow'),
      },
    ] as Array<{ key: string; label: string; icon: Component }>,
);

// Sub-tabs within Settings mode.
const mainTabs = computed(() => [
  t('general'),
  t('input', 2),
  t('workflows.changelog'),
  t('execution', 2),
]);
const currentTab = ref(0);

const executionsRef = ref<{ refresh: () => void } | null>(null);
const refreshExecutions = () => executionsRef.value?.refresh();

// Template ref to the Builder so handleSave can pull the current canvas
// graph (nodes + connections with position ui) instead of persisting the
// stale cached `wf.nodes` / `wf.connections`.
const builderRef = ref<{
  getGraph: () => {
    nodes: WorkflowNode[];
    connections: WorkflowNodeConnection[];
  };
  getUi: () => Record<string, unknown>;
  startExecution: () => Promise<void>;
} | null>(null);

// ─── Trigger & cron helpers ────────────────────────────────────────
const cronDescription = computed(() => {
  const expr = triggerCronValue.value.trim();
  if (!expr) return '';
  try {
    return cronstrue.toString(expr, {
      locale: locale.value,
      use24HourTimeFormat: true,
    });
  } catch {
    return '';
  }
});

const availableEventActions = computed(() => {
  if (!triggerEventEntity.value) return [];
  const entity = manifestEventEntities.value.find(
    (e) => e.name === triggerEventEntity.value,
  );
  return entity?.actions ?? [];
});

const availableSubEntities = computed(() => {
  if (!triggerEventEntity.value) return [];
  const entity = manifestEventEntities.value.find(
    (e) => e.name === triggerEventEntity.value,
  );
  return entity?.subEntities ?? [];
});

// Reka's <SelectItem> rejects an empty-string value (it's reserved for the
// cleared/placeholder state). Use a sentinel for the "none" option and map it
// back to '' on the form so the API payload stays unchanged.
const SUB_ENTITY_NONE = '__none__';

const prettyLabel = (name: string): string =>
  name
    .replace(/[-_]/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ');

// Pre-compute i18n labels before `await` — after an await, Vue loses the
// active component instance so `t()` silently fails in post-await computeds.
const idLabel = t('entity_id', { entityName: 'workflow' });

// ─── Unsaved changes tracking ────────────────────────────────────
// Must be declared BEFORE `await useAsyncData` — after an await, Vue loses
// the active component instance so composables that register route guards
// (onBeforeRouteLeave) would silently fail.
// Execution-affecting changes: node/edge additions, deletions, config edits.
// UI-only changes: node positions, viewport pan/zoom — don't affect execution.
const builderChangeCount = ref(0);
const builderUiChangeCount = ref(0);
const onBuilderChange = () => {
  builderChangeCount.value++;
};
const onBuilderUiChange = () => {
  builderUiChangeCount.value++;
};

const editableState = computed(
  () =>
    ({
      active: workflowActive.value,
      ...form.values,
      inputs: inputValues.value,
      inputDefinitions: workflowInputs.value,
      inputGroups: additionalInputGroups.value,
      builderChanges: builderChangeCount.value,
      builderUiChanges: builderUiChangeCount.value,
    }) as Record<string, unknown>,
);

const originalEditableState = ref('');

const { hasUnsavedChanges, unsavedChangesDialogOpen, confirmLeave } =
  useUnsavedChanges(editableState, originalEditableState, isNew);

const hasExecutionChanges = computed(() => {
  if (!hasUnsavedChanges.value) return false;
  const { builderUiChanges: _a, ...current } = editableState.value;
  const original = JSON.parse(originalEditableState.value || '{}');
  const { builderUiChanges: _b, ...saved } = original;
  return JSON.stringify(current) !== JSON.stringify(saved);
});

// ─── Current workflow (for enable/disable + duplicate) ────────────
const { data: currentWorkflow, refresh: refreshCurrentWorkflow } =
  await useAsyncData(
    workflowDataKey,
    () =>
      isNew.value
        ? Promise.resolve(null)
        : orchestratorApi.workflow.get(workflowId.value),
    { watch: [workflowId], getCachedData: () => undefined },
  );

type WorkflowEditorDefinition = WorkflowDefinition & {
  trigger?: Record<string, unknown>;
};

const isEnabled = computed(() => currentWorkflow.value?.enabled ?? false);
const menuBusy = ref(false);

// Map the API's lowercase workflow type to the form's PascalCase enum.
const toFormWorkflowType = (
  t: string | undefined,
): WorkflowFormValues['trigger']['type'] => {
  const lower = (t ?? '').toLowerCase();
  if (lower === 'scheduled') return 'Scheduled';
  if (lower === 'event') return 'Event';
  return 'OnDemand';
};

// Sync workflow data into form values + non-form refs when it loads (or refreshes).
// Trigger details live in the nested `trigger` object on the API response (not at
// the top level) — read them from there so the General tab reflects the stored
// configuration instead of showing the defaults.
const skipActiveSync = ref(false);

watch(
  currentWorkflow,
  (wf) => {
    if (!wf || isNew.value) return;
    const workflow = wf as WorkflowEditorDefinition;
    if (skipActiveSync.value) {
      skipActiveSync.value = false;
    } else {
      workflowActive.value = workflow.enabled ?? false;
    }
    const rawInputs: WorkflowInput[] = Array.isArray(workflow.input)
      ? workflow.input
      : [];
    // Deep copy so edits in the Inputs tab don't mutate the cached workflow.
    workflowInputs.value = rawInputs.map((i) => ({ ...i }));
    additionalInputGroups.value = [];
    const inputs: Record<string, unknown> = {};
    for (const i of rawInputs) inputs[i.name] = i.defaultValue;
    inputValues.value = inputs;
    const triggerObj = (workflow.trigger ?? {}) as Record<string, unknown>;
    form.setValues({
      details: {
        name: workflow.name ?? '',
        description: workflow.description ?? '',
        group: workflow.group ?? '',
        tags: Array.isArray(workflow.tags) ? [...workflow.tags] : [],
      },
      trigger: {
        type: toFormWorkflowType(workflow.type),
        cron:
          (triggerObj.cronExpression as string | undefined) ??
          workflow.cronExpression ??
          '',
        eventEntity: (triggerObj.entity as string | undefined) ?? '',
        eventAction: (triggerObj.action as string | undefined) ?? '',
        eventSubEntity: (triggerObj.subEntity as string | undefined) ?? '',
        description: (triggerObj.description as string | undefined) ?? '',
      },
      settings: { ...(workflow.settings ?? {}) },
    });
  },
  { immediate: true },
);

// Snapshot the original state once workflow data loads so unsaved changes
// can be detected. Uses nextTick to allow all watchers to propagate first.
watch(
  currentWorkflow,
  () => {
    if (currentWorkflow.value && !isNew.value) {
      nextTick(() => {
        originalEditableState.value = JSON.stringify(editableState.value);
      });
    }
  },
  { immediate: true },
);

// ─── Duplicate ─────────────────────────────────────────────────────
const handleDuplicate = async () => {
  if (isNew.value || !currentWorkflow.value) return;
  menuBusy.value = true;
  try {
    const src = currentWorkflow.value;
    const copy = await orchestratorApi.workflow.create({
      ...src,
      name: `${src.name} (copy)`,
      enabled: false,
    });
    toast({
      title: t('workflows.duplicated'),
      description: t('workflows.created_named', { name: copy.name }),
    });
    await navigateTo(`/orchestrator/workflows/${copy.id}`);
  } catch (err: unknown) {
    const apiBody = extractApiError(err);
    toast({
      title: apiBody?.title || t('workflows.duplicate_failed'),
      description:
        apiBody?.detail ||
        (err as { message?: string })?.message ||
        t('workflows.unknown_error'),
      variant: 'negative',
    });
  } finally {
    menuBusy.value = false;
  }
};

// ─── Delete ────────────────────────────────────────────────────────
const deleteWorkflowEntity = async (): Promise<boolean> => {
  if (isNew.value) return false;
  try {
    await orchestratorApi.workflow.delete(workflowId.value);
    return true;
  } catch {
    return false;
  }
};

const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteWorkflowEntity, '/orchestrator/workflows/list');

const isSavingConfig = ref(false);

// ─── Create ────────────────────────────────────────────────────────
// New workflows are always created as `onDemand` — the user configures the
// trigger afterward on the loaded workflow's General tab. This keeps the
// create form minimal (just a name) and avoids guiding users into committing
// to a trigger shape they haven't built the nodes for yet.
const handleCreate = async () => {
  const { valid } = await form.validate();
  if (!valid) {
    validateOnChange.value = true;
    return;
  }
  validateOnChange.value = false;
  isSavingConfig.value = true;
  try {
    const values = form.values;
    const created = await orchestratorApi.workflow.create({
      name: values.details.name,
      description: values.details.description || undefined,
      group: values.details.group || undefined,
      tags: values.details.tags,
      type: 'onDemand',
      enabled: false,
    });
    // Snapshot so the route guard doesn't block navigation to the new page.
    originalEditableState.value = JSON.stringify(editableState.value);
    toast({
      title: t('workflows.created'),
      description: t('workflows.created_named', { name: created.name }),
    });
    await navigateTo(`/orchestrator/workflows/${created.id}`);
  } catch (err: unknown) {
    geinsLogError('Failed to create workflow', err);
    const apiBody = extractApiError(err);
    toast({
      title: apiBody?.title || t('workflows.create_failed'),
      description:
        apiBody?.detail ||
        (err as { message?: string })?.message ||
        t('workflows.unknown_error'),
      variant: 'negative',
    });
  } finally {
    isSavingConfig.value = false;
  }
};

// The form uses PascalCase trigger types (matching the manifest) but the
// Management API stores them camelCase — normalize at the API boundary.
const toApiWorkflowType = (
  t: WorkflowFormValues['trigger']['type'],
): 'onDemand' | 'scheduled' | 'event' => {
  if (t === 'Scheduled') return 'scheduled';
  if (t === 'Event') return 'event';
  return 'onDemand';
};

// Build the trigger configuration expected by the API. Scheduled/event types
// require this object (WF010 / WF013), onDemand doesn't.
const buildTriggerConfig = (
  apiType: 'onDemand' | 'scheduled' | 'event',
  trigger: WorkflowFormValues['trigger'],
) => {
  if (apiType === 'scheduled') {
    return {
      enabled: true,
      cronExpression: trigger.cron || '',
      description: trigger.description || '',
    };
  }
  if (apiType === 'event') {
    return {
      enabled: true,
      entity: trigger.eventEntity || '',
      action: trigger.eventAction || '',
      subEntity: trigger.eventSubEntity || '',
      description: trigger.description || '',
    };
  }
  return undefined;
};

// ─── Save ──────────────────────────────────────────────────────────
const handleSave = async () => {
  if (isNew.value || !currentWorkflow.value) return;
  const { valid } = await form.validate();
  if (!valid) {
    validateOnChange.value = true;
    viewMode.value = 'settings';
    toast({
      title: t('workflows.validation_failed'),
      description: t('workflows.fix_errors_before_saving'),
      variant: 'negative',
    });
    return;
  }
  validateOnChange.value = false;
  isSavingConfig.value = true;
  try {
    const wf = currentWorkflow.value as WorkflowEditorDefinition;
    const values = form.values;
    const mergedInputs: WorkflowInput[] = workflowInputs.value.map((i) => {
      const val = inputValues.value[i.name];
      const hasValue = val !== undefined && val !== null && val !== '';
      const { defaultValue: _, ...rest } = i;
      return {
        ...rest,
        ...(hasValue && { defaultValue: val }),
      };
    });
    const apiType = toApiWorkflowType(values.trigger.type);
    const trigger = buildTriggerConfig(apiType, values.trigger);
    // If the Builder tab has been mounted, prefer its live canvas graph so
    // node position edits (ui.position) are persisted. Otherwise fall back to
    // the cached workflow's nodes/connections.
    const graph = builderRef.value?.getGraph?.();
    const builderUi = builderRef.value?.getUi?.();
    const payload = {
      name: values.details.name,
      description: values.details.description || undefined,
      group: values.details.group || undefined,
      tags: values.details.tags,
      type: apiType,
      enabled: workflowActive.value,
      cronExpression: apiType === 'scheduled' ? values.trigger.cron : undefined,
      eventName: apiType === 'event' ? values.trigger.eventEntity : undefined,
      nodes: sanitizeWorkflowNodes(
        (graph?.nodes ?? wf.nodes) as WorkflowNode[],
      ),
      connections: graph?.connections ?? wf.connections,
      // Merge existing ui with builder-provided keys (triggerPosition, viewport)
      // so canvas-only state persists without clobbering unrelated `ui` fields.
      ui: { ...(wf.ui ?? {}), ...(builderUi ?? {}) },
      input: mergedInputs,
      settings: values.settings,
      trigger,
    };
    geinsLogInfo('Save workflow — full payload (object):', payload);
    geinsLogInfo(
      'Save workflow — full payload (JSON):\n' +
        JSON.stringify(payload, null, 2),
    );
    await orchestratorApi.workflow.update(workflowId.value, payload);
    if (workflowActive.value !== isEnabled.value) {
      if (workflowActive.value) {
        await orchestratorApi.workflow.enable(workflowId.value);
      } else {
        await orchestratorApi.workflow.disable(workflowId.value);
      }
    }
    skipActiveSync.value = true;
    await refreshCurrentWorkflow();
    // Refreshing currentWorkflow re-fires the trigger-node data watcher in the
    // Builder, which bumps `builderChangeCount` *after* save. Wait two ticks
    // for that churn to flush, then snapshot editableState as the new
    // baseline so the unsaved-changes diff lines up.
    await nextTick();
    await nextTick();
    originalEditableState.value = JSON.stringify(editableState.value);
    toast({ title: t('workflows.configuration_saved') });
  } catch (err: unknown) {
    geinsLogError('Failed to save workflow configuration', err);
    const apiBody = extractApiError(err);
    toast({
      title: apiBody?.title || t('workflows.save_failed'),
      description:
        apiBody?.detail ||
        (err as { message?: string })?.message ||
        t('workflows.unknown_error'),
      variant: 'negative',
    });
  } finally {
    isSavingConfig.value = false;
  }
};

const saveAndRun = async () => {
  await handleSave();
  if (!hasUnsavedChanges.value) {
    await builderRef.value?.startExecution();
  }
};

// ─── Cmd+S shortcut ──────────────────────────────────────────────
const onKeyDown = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    if (hasUnsavedChanges.value && !isSavingConfig.value) handleSave();
  }
};
onMounted(() => window.addEventListener('keydown', onKeyDown));
onUnmounted(() => window.removeEventListener('keydown', onKeyDown));

// ─── Run workflow (production) ────────────────────────────────────
const showRunSheet = ref(false);
const runInputValues = ref<Record<string, unknown>>({});
const isRunning = ref(false);

function openRunWorkflow() {
  const values: Record<string, unknown> = {};
  for (const input of workflowInputs.value) {
    values[input.name] = input.defaultValue ?? '';
  }
  runInputValues.value = values;
  showRunSheet.value = true;
}

async function executeWorkflow() {
  showRunSheet.value = false;
  isRunning.value = true;
  try {
    const hasParams = Object.keys(runInputValues.value).length > 0;
    const res = await orchestratorApi.execution.start(
      workflowId.value,
      hasParams ? { parameters: runInputValues.value } : undefined,
    );
    const execId = res?.executionId ?? res?.newExecutionId ?? null;
    toast({
      title: t('workflows.workflow_started'),
      description: execId
        ? t('workflows.execution_id_value', { id: execId })
        : (res?.message ?? t('workflows.workflow_is_running')),
    });
    refreshExecutions();
  } catch (err) {
    geinsLogError('Failed to run workflow', err);
    const apiErr = extractApiError(err);
    toast({
      title: apiErr?.title ?? t('workflows.run_failed'),
      description: apiErr?.detail ?? getErrorMessage(err),
      variant: 'negative',
    });
  } finally {
    isRunning.value = false;
  }
}

// ─── Validate ─────────────────────────────────────────────────────
const isValidating = ref(false);

const handleValidate = async () => {
  if (isNew.value || !currentWorkflow.value) return;
  isValidating.value = true;
  try {
    const wf = currentWorkflow.value as WorkflowEditorDefinition;
    const values = form.values;
    const apiType = toApiWorkflowType(values.trigger.type);
    const trigger = buildTriggerConfig(apiType, values.trigger);
    const graph = builderRef.value?.getGraph?.();
    const result = await orchestratorApi.workflow.validate({
      name: values.details.name,
      description: values.details.description || undefined,
      tags: values.details.tags,
      type: apiType,
      enabled: workflowActive.value,
      cronExpression: apiType === 'scheduled' ? values.trigger.cron : undefined,
      eventName: apiType === 'event' ? values.trigger.eventEntity : undefined,
      nodes: sanitizeWorkflowNodes(
        (graph?.nodes ?? wf.nodes) as WorkflowNode[],
      ),
      connections: graph?.connections ?? wf.connections,
      input: workflowInputs.value,
      settings: values.settings,
      trigger,
    });
    const isValid = result.isValid ?? result.valid ?? false;
    if (isValid) {
      toast({
        title: t('workflows.validation_passed'),
        description: result.message || t('workflows.configuration_valid'),
      });
    } else {
      toast({
        title: t('workflows.validation_failed'),
        description:
          result.message ||
          t('workflows.issues_found', { count: result.errors?.length ?? 0 }),
        variant: 'negative',
      });
    }
  } catch (err: unknown) {
    geinsLogError('Failed to validate workflow', err);
    const apiBody = extractApiError(err);
    toast({
      title: apiBody?.title || t('workflows.validation_error'),
      description:
        apiBody?.detail ||
        (err as { message?: string })?.message ||
        t('workflows.unknown_error'),
      variant: 'negative',
    });
  } finally {
    isValidating.value = false;
  }
};

// ─── Sidebar summary ─────────────────────────────────────────────
// Only show the summary sidebar on the General tab (like company/price-list pattern).
// On smaller viewports (hasReducedSpace) or other tabs, the sidebar collapses into
// a floating toggle icon via ContentEditMain.
const { hasReducedSpace } = useLayout();
const showSidebar = computed(
  () =>
    !hasReducedSpace.value &&
    viewMode.value === 'settings' &&
    currentTab.value === 0 &&
    !isNew.value,
);

const triggerDisplayName = computed(() =>
  triggerTypeLabel(triggerTypeValue.value),
);

const summary = computed<DataItem[]>(() => {
  const items: DataItem[] = [];
  if (!isNew.value) {
    const id = workflowId.value;
    const short = id.length > 13 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
    items.push({
      label: idLabel,
      value: id,
      displayValue: short,
      displayType: DataItemDisplayType.Copy,
    });
  }
  if (workflowNameValue.value) {
    items.push({ label: t('name'), value: workflowNameValue.value });
  }
  const group = form.values.details?.group;
  if (group) {
    items.push({
      label: t('group'),
      value: [group],
      displayValue: group,
      displayType: DataItemDisplayType.Array,
      entityName: 'group',
    });
  }
  const tags = form.values.details?.tags ?? [];
  if (tags.length) {
    items.push({
      label: t('tag', 2),
      value: tags,
      displayValue: tags.join(', '),
      displayType: DataItemDisplayType.Array,
      entityName: 'tag',
    });
  }
  return items;
});

const triggerSummary = computed<DataItem[]>(() => {
  const items: DataItem[] = [];
  items.push({ label: t('workflows.type'), value: triggerDisplayName.value });
  if (
    triggerTypeValue.value === 'Scheduled' &&
    triggerCronValue.value &&
    cronDescription.value
  ) {
    items.push({
      label: t('workflows.schedule'),
      value: cronDescription.value,
    });
  }
  if (triggerTypeValue.value === 'Event' && triggerEventEntity.value) {
    const entityLabel =
      manifestEventEntities.value.find(
        (e) => e.name === triggerEventEntity.value,
      )?.displayName ?? triggerEventEntity.value;
    const actionLabel = triggerEventAction.value
      ? prettyLabel(triggerEventAction.value)
      : '';
    items.push({
      label: t('workflows.event'),
      value: actionLabel ? `${entityLabel} / ${actionLabel}` : entityLabel,
    });
  }
  return items;
});

const settingsValuesView = computed(() => form.values.settings ?? {});

const settingsSummary = computed<DataItem[]>(() => {
  const items: DataItem[] = [];
  const s = settingsValuesView.value;
  if (s.timeout)
    items.push({ label: t('workflows.timeout'), value: String(s.timeout) });
  if (s.logVerbosity)
    items.push({
      label: t('workflows.log_verbosity'),
      value: logVerbosityLabel(String(s.logVerbosity)),
    });
  if (s.errorHandlingStrategy)
    items.push({
      label: t('workflows.error_handling'),
      value: errorHandlingLabel(String(s.errorHandlingStrategy)),
    });
  return items;
});

const { summaryProps } = useEntityEditSummary({
  createMode: isNew,
  formTouched: hasUnsavedChanges,
  summary,
  settingsSummary,
  entityName,
  entityLiveStatus: isEnabled,
  status: computed(() => (isEnabled.value ? 'active' : 'inactive')),
});
</script>

<template>
  <DialogUnsavedChanges
    v-model:open="unsavedChangesDialogOpen"
    :entity-name="entityName"
    :loading="isSavingConfig"
    @confirm="confirmLeave"
  />
  <DialogDelete
    v-model:open="deleteDialogOpen"
    :entity-name="entityName"
    :loading="deleting"
    @confirm="confirmDelete"
  />

  <ContentEditWrap>
    <template #header>
      <ContentHeader
        :class="{ 'builder-active': viewMode === 'builder' }"
        :title="
          isNew
            ? $t('workflows.new_workflow_name')
            : workflowNameValue || $t('workflow')
        "
        :entity-name="entityName"
      >
        <ContentActionBar>
          <ContentViewModeSwitch
            v-if="!isNew"
            v-model="viewMode"
            :modes="viewModes"
          />
          <ButtonIcon
            v-if="!isNew"
            icon="save"
            :loading="isSavingConfig"
            :disabled="isSavingConfig || !hasUnsavedChanges"
            @click="handleSave"
          >
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
              <DropdownMenuItem
                :disabled="menuBusy || !currentWorkflow"
                @click="handleDuplicate"
              >
                <LucideCopy class="mr-2 size-4" />
                <span>{{ $t('workflows.duplicate') }}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                :disabled="!currentWorkflow || isRunning"
                @click="openRunWorkflow"
              >
                <LucideRocket class="mr-2 size-4" />
                <span>{{ $t('workflows.run_workflow') }}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                :disabled="isValidating || !currentWorkflow"
                @click="handleValidate"
              >
                <LucideShieldCheck class="mr-2 size-4" />
                <span>
                  {{
                    isValidating
                      ? $t('workflows.validating')
                      : $t('workflows.validate_workflow')
                  }}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                :disabled="!currentWorkflow"
                @click="workflowActive = !workflowActive"
              >
                <LucidePause v-if="workflowActive" class="mr-2 size-4" />
                <LucidePlay v-else class="mr-2 size-4" />
                <span>
                  {{
                    workflowActive
                      ? $t('workflows.pause')
                      : $t('workflows.start')
                  }}
                </span>
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
          <ContentEditTabs
            v-if="viewMode === 'settings'"
            v-model:current-tab="currentTab"
            :tabs="mainTabs"
          />
          <div v-else class="h-[30px]" />
        </template>
        <template v-if="!isNew" #changes>
          <ContentEditHasChanges :changes="hasUnsavedChanges" />
        </template>
      </ContentHeader>
    </template>

    <form v-if="viewMode === 'settings'" @submit.prevent>
      <ContentEditMain :show-sidebar="showSidebar">
        <!-- General tab -->
        <KeepAlive>
          <ContentEditMainContent
            v-if="currentTab === 0"
            :key="`tab-${currentTab}`"
          >
            <ContentEditCard
              :title="$t('general')"
              :description="$t('workflows.general_description')"
            >
              <FormGridWrap>
                <FormGrid design="1+1">
                  <FormField v-slot="{ componentField }" name="details.name">
                    <FormItem>
                      <FormLabel>{{ $t('name') }}</FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          :placeholder="$t('workflows.name_placeholder')"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField v-slot="{ componentField }" name="details.group">
                    <FormItem>
                      <FormLabel :optional="true">{{ $t('group') }}</FormLabel>
                      <FormControl>
                        <FormInputTagsSearch
                          entity-name="group"
                          :data-set="groupDataSet"
                          :allow-custom-tags="true"
                          :single-select="true"
                          :model-value="
                            componentField.modelValue
                              ? [componentField.modelValue]
                              : []
                          "
                          @update:model-value="
                            (val) =>
                              componentField['onUpdate:modelValue']?.(
                                val[0] ?? '',
                              )
                          "
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1">
                  <FormField
                    v-slot="{ componentField }"
                    name="details.description"
                  >
                    <FormItem>
                      <FormLabel :optional="true">
                        {{ $t('workflows.field_description') }}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          v-bind="componentField"
                          rows="3"
                          :placeholder="$t('workflows.description_placeholder')"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1">
                  <FormField v-slot="{ componentField }" name="details.tags">
                    <FormItem>
                      <FormLabel :optional="true">{{ $t('tag', 2) }}</FormLabel>
                      <FormControl>
                        <TagsInput
                          :model-value="
                            (componentField.modelValue as string[]) || []
                          "
                          class="min-h-10 flex-wrap"
                          @update:model-value="
                            componentField['onUpdate:modelValue']
                          "
                        >
                          <TagsInputItem
                            v-for="tag in (componentField.modelValue as string[]) ||
                            []"
                            :key="tag"
                            :value="tag"
                          >
                            <TagsInputItemText />
                            <TagsInputItemDelete />
                          </TagsInputItem>
                          <TagsInputInput
                            :placeholder="$t('workflows.add_tag_placeholder')"
                          />
                        </TagsInput>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
              </FormGridWrap>
            </ContentEditCard>

            <ContentEditCard
              v-if="!isNew"
              :title="$t('workflows.trigger')"
              :description="$t('workflows.trigger_description')"
            >
              <FormGridWrap>
                <FormGrid design="1">
                  <FormField v-slot="{ componentField }" name="trigger.type">
                    <FormItem>
                      <FormLabel>{{ $t('workflows.type') }}</FormLabel>
                      <FormControl>
                        <Select v-bind="componentField">
                          <SelectTrigger>
                            <SelectValue
                              :placeholder="$t('workflows.select_trigger_type')"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              v-for="tt in manifestTriggerTypes"
                              :key="tt.type"
                              :value="tt.type"
                            >
                              {{ triggerTypeLabel(tt.type) }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>

                <div
                  v-if="triggerTypeValue === 'OnDemand'"
                  class="text-muted-foreground text-sm"
                >
                  {{ $t('workflows.on_demand_help') }}
                </div>

                <template v-if="triggerTypeValue === 'Scheduled'">
                  <FormGrid design="1">
                    <FormField v-slot="{ componentField }" name="trigger.cron">
                      <FormItem>
                        <FormLabel>{{ $t('workflows.schedule') }}</FormLabel>
                        <FormControl>
                          <SharedCronBuilder v-bind="componentField" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                </template>

                <template v-if="triggerTypeValue === 'Event'">
                  <FormGrid design="1+1">
                    <FormField
                      v-slot="{ componentField }"
                      name="trigger.eventEntity"
                    >
                      <FormItem>
                        <FormLabel>{{ $t('workflows.entity') }}</FormLabel>
                        <FormControl>
                          <Select v-bind="componentField">
                            <SelectTrigger>
                              <SelectValue
                                :placeholder="$t('workflows.select_entity')"
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="*">
                                {{ $t('workflows.any_option') }}
                              </SelectItem>
                              <SelectItem
                                v-for="entity in manifestEventEntities"
                                :key="entity.name"
                                :value="entity.name"
                              >
                                {{ entity.displayName }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                    <FormField
                      v-slot="{ componentField }"
                      name="trigger.eventAction"
                    >
                      <FormItem>
                        <FormLabel>{{ $t('workflows.action') }}</FormLabel>
                        <FormControl>
                          <Select v-bind="componentField">
                            <SelectTrigger>
                              <SelectValue
                                :placeholder="$t('workflows.select_action')"
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="*">
                                {{ $t('workflows.any_option') }}
                              </SelectItem>
                              <SelectItem
                                v-for="a in availableEventActions"
                                :key="a"
                                :value="a"
                              >
                                {{ prettyLabel(a) }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                  <FormGrid v-if="availableSubEntities.length > 0" design="1+1">
                    <FormField
                      v-slot="{ componentField }"
                      name="trigger.eventSubEntity"
                    >
                      <FormItem>
                        <FormLabel :optional="true">
                          {{ $t('workflows.sub_entity') }}
                        </FormLabel>
                        <FormControl>
                          <Select
                            v-bind="componentField"
                            :model-value="
                              componentField.modelValue || SUB_ENTITY_NONE
                            "
                            @update:model-value="
                              (v) =>
                                form.setFieldValue(
                                  'trigger.eventSubEntity',
                                  v === SUB_ENTITY_NONE ? '' : String(v),
                                )
                            "
                          >
                            <SelectTrigger>
                              <SelectValue :placeholder="$t('none')" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem :value="SUB_ENTITY_NONE">
                                {{ $t('none') }}
                              </SelectItem>
                              <SelectItem value="*">
                                {{ $t('workflows.any_option') }}
                              </SelectItem>
                              <SelectItem value="!">
                                {{ $t('workflows.absent_only_option') }}
                              </SelectItem>
                              <SelectItem
                                v-for="sub in availableSubEntities"
                                :key="sub"
                                :value="sub"
                              >
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
                    <FormField
                      v-slot="{ componentField }"
                      name="trigger.description"
                    >
                      <FormItem>
                        <FormLabel :optional="true">
                          {{ $t('workflows.field_description') }}
                        </FormLabel>
                        <FormControl>
                          <Input
                            v-bind="componentField"
                            :placeholder="
                              $t('workflows.trigger_description_placeholder')
                            "
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    </FormField>
                  </FormGrid>
                </template>
              </FormGridWrap>
            </ContentEditCard>

            <ContentEditCard
              v-if="!isNew"
              :title="$t('workflows.runtime_settings')"
              :description="$t('workflows.runtime_settings_description')"
            >
              <FormGridWrap>
                <FormGrid>
                  <FormField
                    v-slot="{ componentField }"
                    name="settings.timeout"
                  >
                    <FormItem>
                      <FormLabel :optional="true">
                        {{ $t('workflows.timeout') }}
                      </FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" placeholder="00:10:00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="settings.maxConcurrency"
                  >
                    <FormItem>
                      <FormLabel :optional="true">
                        {{ $t('workflows.max_concurrency') }}
                      </FormLabel>
                      <FormControl>
                        <Input v-bind="componentField" type="number" min="1" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="settings.executionLogRetentionDays"
                  >
                    <FormItem>
                      <FormLabel :optional="true">
                        {{ $t('workflows.log_retention') }}
                      </FormLabel>
                      <FormControl>
                        <Input
                          v-bind="componentField"
                          type="number"
                          min="0"
                          :placeholder="$t('workflows.keep_indefinitely')"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                </FormGrid>
                <FormGrid design="1+1+1">
                  <FormField
                    v-slot="{ componentField }"
                    name="settings.logVerbosity"
                  >
                    <FormItem>
                      <FormLabel :optional="true">
                        {{ $t('workflows.log_verbosity') }}
                      </FormLabel>
                      <FormControl>
                        <Select v-bind="componentField">
                          <SelectTrigger>
                            <SelectValue
                              :placeholder="$t('workflows.select')"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimal">
                              {{ $t('workflows.verbosity_minimal') }}
                            </SelectItem>
                            <SelectItem value="normal">
                              {{ $t('workflows.verbosity_normal') }}
                            </SelectItem>
                            <SelectItem value="detailed">
                              {{ $t('workflows.verbosity_detailed') }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="settings.timeoutBehavior"
                  >
                    <FormItem>
                      <FormLabel :optional="true">
                        {{ $t('workflows.timeout_behaviour') }}
                      </FormLabel>
                      <FormControl>
                        <Select v-bind="componentField">
                          <SelectTrigger>
                            <SelectValue
                              :placeholder="$t('workflows.select')"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fail">
                              {{ $t('workflows.timeout_fail') }}
                            </SelectItem>
                            <SelectItem value="continue">
                              {{ $t('workflows.timeout_continue') }}
                            </SelectItem>
                            <SelectItem value="cancel">
                              {{ $t('workflows.timeout_cancel') }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </FormField>
                  <FormField
                    v-slot="{ componentField }"
                    name="settings.errorHandlingStrategy"
                  >
                    <FormItem>
                      <FormLabel :optional="true">
                        {{ $t('workflows.error_handling') }}
                      </FormLabel>
                      <FormControl>
                        <Select v-bind="componentField">
                          <SelectTrigger>
                            <SelectValue
                              :placeholder="$t('workflows.select')"
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="failFast">
                              {{ $t('workflows.error_fail_fast') }}
                            </SelectItem>
                            <SelectItem value="continueOnError">
                              {{ $t('workflows.error_continue') }}
                            </SelectItem>
                            <SelectItem value="retry">
                              {{ $t('workflows.error_retry') }}
                            </SelectItem>
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
              v-if="
                !isNew &&
                ((settingsValuesView as any).retryPolicy ||
                  (settingsValuesView as any).rateLimit)
              "
              :title="$t('workflows.advanced')"
              :description="$t('workflows.advanced_description')"
            >
              <FormGridWrap>
                <FormGrid design="1+1">
                  <FormItem v-if="(settingsValuesView as any).retryPolicy">
                    <Label>{{ $t('workflows.retry_policy') }}</Label>
                    <pre
                      class="bg-muted text-muted-foreground overflow-x-auto rounded p-2 text-xs"
                    >
                      {{
                        JSON.stringify(
                          (settingsValuesView as any).retryPolicy,
                          null,
                          2,
                        )
                      }}
                    </pre>
                  </FormItem>
                  <FormItem v-if="(settingsValuesView as any).rateLimit">
                    <Label>{{ $t('workflows.rate_limit') }}</Label>
                    <pre
                      class="bg-muted text-muted-foreground overflow-x-auto rounded p-2 text-xs"
                    >
                      {{
                        JSON.stringify(
                          (settingsValuesView as any).rateLimit,
                          null,
                          2,
                        )
                      }}
                    </pre>
                  </FormItem>
                </FormGrid>
              </FormGridWrap>
            </ContentEditCard>

            <div v-if="isNew" class="flex flex-row justify-end gap-4">
              <Button variant="secondary" as-child>
                <NuxtLink to="/orchestrator/workflows/list">
                  {{ $t('cancel') }}
                </NuxtLink>
              </Button>
              <Button :loading="isSavingConfig" @click="handleCreate">
                {{ $t('create_entity', { entityName }) }}
              </Button>
            </div>
          </ContentEditMainContent>
        </KeepAlive>

        <!-- Inputs tab -->
        <KeepAlive>
          <WorkflowInputs
            v-if="currentTab === 1"
            :key="`tab-${currentTab}`"
            v-model:inputs="workflowInputs"
            v-model:additional-groups="additionalInputGroups"
            v-model:input-values="inputValues"
          />
        </KeepAlive>

        <!-- Executions tab -->
        <KeepAlive>
          <WorkflowExecutions
            v-if="currentTab === 3"
            :key="`tab-${currentTab}`"
            ref="executionsRef"
            :workflow-id="workflowId"
            :is-new="isNew"
          />
        </KeepAlive>

        <!-- History tab -->
        <KeepAlive>
          <WorkflowHistory
            v-if="currentTab === 2"
            :key="`tab-${currentTab}`"
            :workflow-id="workflowId"
            :workflow-name="workflowNameValue"
            :is-new="isNew"
          />
        </KeepAlive>

        <template #sidebar>
          <ContentEditSummary
            v-model:active="workflowActive"
            v-bind="summaryProps"
          >
            <template #after-summary>
              <ContentDataList
                v-if="triggerSummary.length"
                :data-list="triggerSummary"
                :label="$t('workflows.trigger')"
              />
            </template>
          </ContentEditSummary>
        </template>
      </ContentEditMain>
    </form>
  </ContentEditWrap>

  <!-- Run workflow sheet -->
  <Sheet v-model:open="showRunSheet">
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>{{ $t('workflows.run_workflow') }}</SheetTitle>
        <SheetDescription>
          {{ $t('workflows.run_sheet_description') }}
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        <div
          v-if="workflowInputs.length === 0"
          class="text-muted-foreground py-8 text-center text-sm"
        >
          {{ $t('workflows.no_input_parameters') }}
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="input in workflowInputs"
            :key="input.name"
            class="space-y-1.5"
          >
            <label class="text-sm font-medium">
              {{ input.name }}
              <span v-if="input.required" class="text-destructive">*</span>
            </label>
            <p v-if="input.description" class="text-muted-foreground text-xs">
              {{ input.description }}
            </p>
            <Textarea
              v-if="input.type === 'object' || input.type === 'json'"
              :model-value="
                typeof runInputValues[input.name] === 'string'
                  ? (runInputValues[input.name] as string)
                  : JSON.stringify(runInputValues[input.name], null, 2)
              "
              rows="4"
              class="font-mono text-xs"
              @update:model-value="runInputValues[input.name] = $event"
            />
            <Input
              v-else-if="input.type === 'number' || input.type === 'integer'"
              type="number"
              :model-value="runInputValues[input.name] as number"
              @update:model-value="runInputValues[input.name] = Number($event)"
            />
            <div
              v-else-if="input.type === 'boolean'"
              class="flex items-center gap-2"
            >
              <Switch
                :checked="!!runInputValues[input.name]"
                @update:checked="runInputValues[input.name] = $event"
              />
              <span class="text-muted-foreground text-xs">
                {{ runInputValues[input.name] ? 'true' : 'false' }}
              </span>
            </div>
            <Input
              v-else
              :model-value="runInputValues[input.name] as string"
              @update:model-value="runInputValues[input.name] = $event"
            />
          </div>
        </div>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="showRunSheet = false">
          {{ $t('cancel') }}
        </Button>
        <Button :disabled="isRunning" @click="executeWorkflow">
          <LucideRocket class="mr-1.5 h-3.5 w-3.5" />
          {{ $t('workflows.run_workflow') }}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>

  <!-- Builder mode: rendered outside ContentEditWrap so it escapes the
       `container` max-width. `-mx-3 @2xl:-mx-8` also escapes the default
       layout's padding so the VueFlow canvas fills the available width.
       `-mt-4` closes the gap left by ContentHeader's `mb-4` so the canvas
       starts right under the tabs. -->
  <KeepAlive>
    <WorkflowBuilder
      v-if="viewMode === 'builder'"
      :key="viewMode"
      ref="builderRef"
      class="-mx-3 -mt-4 -mb-12 @2xl:-mx-8 @2xl:-mb-14"
      :workflow-id="workflowId"
      :is-new="isNew"
      :is-dirty="hasExecutionChanges"
      :current-workflow="currentWorkflow"
      @executed="refreshExecutions"
      @change="onBuilderChange"
      @change:ui="onBuilderUiChange"
      @save-and-run="saveAndRun"
    />
  </KeepAlive>
</template>

<style scoped>
.builder-active :deep(.content-header) {
  border-bottom-color: transparent;
}
</style>
