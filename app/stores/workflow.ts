import { defineStore } from 'pinia';
import type {
  EditorManifest,
  WorkflowAction,
  ManifestTriggerType,
} from '#shared/types';

const CACHE_KEY = 'geins-workflow-manifest';

/**
 * Workflow store — caches the workflow editor manifest by schema version.
 *
 * Provides available actions, triggers, and categories for the workflow editor.
 * Fetches on first access, then serves from localStorage cache.
 * Call `refresh()` to force a re-fetch when the schema version changes.
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
  const manifest = ref<EditorManifest>();
  const ready = ref(false);
  const initialized = ref(false);

  // GETTERS
  const version = computed(() => manifest.value?.schemaVersion ?? '');

  const actions = computed<WorkflowAction[]>(
    () => manifest.value?.actions ?? [],
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

  const triggerTypes = computed<ManifestTriggerType[]>(
    () => manifest.value?.triggerTypes ?? [],
  );

  // ACTIONS
  function hydrateFromCache(): boolean {
    if (!import.meta.client) return false;

    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        manifest.value = JSON.parse(cached) as EditorManifest;
        return true;
      }
    } catch {
      localStorage.removeItem(CACHE_KEY);
    }
    return false;
  }

  function persistToCache(data: EditorManifest): void {
    if (!import.meta.client) return;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      geinsLogWarn('failed to persist workflow manifest to localStorage');
    }
  }

  async function fetchManifest(): Promise<EditorManifest> {
    const data = await workflowApi.editor.getManifest();
    manifest.value = data;
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

    const results = await Promise.allSettled([fetchManifest()]);

    ready.value = results.every(
      (result) => result.status === 'fulfilled' && result.value,
    );

    results.forEach((result) => {
      if (result.status === 'rejected' || !result.value) {
        geinsLogWarn('failed to fetch workflow manifest:', result);
      }
    });

    if (ready.value && manifest.value) {
      persistToCache(manifest.value);
    }

    initialized.value = true;
  }

  async function refresh(): Promise<void> {
    reset();
    await init();
  }

  function reset(): void {
    manifest.value = undefined;
    ready.value = false;
    initialized.value = false;
    if (import.meta.client) {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  return {
    manifest,
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
