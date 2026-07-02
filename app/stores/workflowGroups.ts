import { defineStore } from 'pinia';
import type { WorkflowSummary } from '#shared/types';

/**
 * Workflow groups store — caches the set of unique workflow group names.
 *
 * There is no dedicated endpoint for workflow groups, so the set is derived
 * client-side from the workflow list. It is populated when the workflow list
 * page loads (`setFromWorkflows`), and `ensureLoaded()` lazily fetches all
 * workflows to derive the set when a consumer (e.g. the workflow edit page)
 * needs it but the list page hasn't been visited yet.
 *
 * Components access via `storeToRefs()`.
 */
export const useWorkflowGroupsStore = defineStore('workflow-groups', () => {
  const { orchestratorApi } = useGeinsRepository();

  // STATE
  const groups = ref<string[]>([]);
  const loaded = ref(false);

  // ACTIONS
  function setFromWorkflows(list: WorkflowSummary[]): void {
    const unique = new Set<string>();
    for (const wf of list) {
      const group = wf.group?.trim();
      if (group) unique.add(group);
    }
    groups.value = Array.from(unique).sort((a, b) => a.localeCompare(b));
    loaded.value = true;
  }

  async function ensureLoaded(): Promise<void> {
    if (loaded.value) return;
    const list = await orchestratorApi.workflow.list();
    setFromWorkflows(Array.isArray(list) ? list : []);
  }

  function reset(): void {
    groups.value = [];
    loaded.value = false;
  }

  return { groups, loaded, setFromWorkflows, ensureLoaded, reset };
});
