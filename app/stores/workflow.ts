import { defineStore } from 'pinia';
import type {
  WorkflowEditorDefinition,
  WorkflowAction,
  WorkflowTriggerDefinition,
} from '#shared/types';

const VERSION_KEY = 'geins-workflow-version';
const DATA_KEY = 'geins-workflow-definition';

/**
 * Workflow store — caches the workflow editor definition by schema version.
 *
 * Provides available actions, triggers, and categories for the workflow editor.
 * Fetches on first access, then serves from localStorage cache until the
 * schema version changes. Both version and definition data are persisted.
 * Components access via `storeToRefs()`.
 *
 * @example
 * ```ts
 * const workflowStore = useWorkflowStore();
 * await workflowStore.init();
 * const { actions, actionsByCategory, triggerTypes } = storeToRefs(workflowStore);
 * ```
 */
export const useWorkflowStore = defineStore('workflow', () => {
  const { geinsLogWarn } = useGeinsLog('store/workflow.ts');
  const { workflowApi } = useGeinsRepository();

  // STATE
  const definition = ref<WorkflowEditorDefinition>();
  const ready = ref(false);
  const initialized = ref(false);

  // GETTERS
  const version = computed(() => definition.value?.version ?? '');

  const actions = computed<WorkflowAction[]>(
    () => definition.value?.actions ?? [],
  );

  const actionsByCategory = computed(() => {
    const grouped: Record<string, WorkflowAction[]> = {};
    for (const action of actions.value) {
      const category = action.category || 'uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(action);
    }
    return grouped;
  });

  const triggerTypes = computed<WorkflowTriggerDefinition[]>(
    () => definition.value?.triggers ?? [],
  );

  // ACTIONS
  function hydrateFromCache(): boolean {
    if (!import.meta.client) return false;

    try {
      const cachedVersion = localStorage.getItem(VERSION_KEY);
      const cachedData = localStorage.getItem(DATA_KEY);
      if (cachedVersion && cachedData) {
        definition.value = JSON.parse(cachedData) as WorkflowEditorDefinition;
        return true;
      }
    } catch {
      localStorage.removeItem(VERSION_KEY);
      localStorage.removeItem(DATA_KEY);
    }
    return false;
  }

  function persistToCache(data: WorkflowEditorDefinition): void {
    if (!import.meta.client) return;

    try {
      localStorage.setItem(VERSION_KEY, data.version);
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch {
      geinsLogWarn('failed to persist workflow definition to localStorage');
    }
  }

  async function fetchDefinition(): Promise<WorkflowEditorDefinition> {
    const data = await workflowApi.editor.getDefinition();
    definition.value = data;
    return data;
  }

  async function init(): Promise<void> {
    if (initialized.value) return;

    // Try to restore from localStorage cache
    if (hydrateFromCache()) {
      ready.value = true;
      initialized.value = true;
      return;
    }

    const results = await Promise.allSettled([fetchDefinition()]);

    ready.value = results.every(
      (result) => result.status === 'fulfilled' && result.value,
    );

    results.forEach((result) => {
      if (result.status === 'rejected' || !result.value) {
        geinsLogWarn('failed to fetch workflow definition:', result);
      }
    });

    if (ready.value && definition.value) {
      persistToCache(definition.value);
    }

    initialized.value = true;
  }

  async function refresh(): Promise<void> {
    reset();
    await init();
  }

  function reset(): void {
    definition.value = undefined;
    ready.value = false;
    initialized.value = false;
    if (import.meta.client) {
      localStorage.removeItem(VERSION_KEY);
      localStorage.removeItem(DATA_KEY);
    }
  }

  return {
    definition,
    ready,
    version,
    actions,
    actionsByCategory,
    triggerTypes,
    init,
    refresh,
    reset,
  };
});
