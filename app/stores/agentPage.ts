import { defineStore } from 'pinia';
import type { AgentEntityHandle, AgentListHandle } from '#shared/types';

/**
 * What the open page exposes to the Studio agent. `useEntityEdit` registers
 * the entity being edited and `TableView` registers its list; the agent panel
 * lives in the layout, so it can't `inject` from pages and reads them here.
 */
export const useAgentPageStore = defineStore('agent-page', () => {
  const entity = shallowRef<AgentEntityHandle>();
  const lists = shallowRef<AgentListHandle[]>([]);

  /** Returns the matching unregister; call it when the page's scope ends. */
  function registerEntity(handle: AgentEntityHandle): () => void {
    entity.value = handle;
    return () => {
      if (entity.value === handle) entity.value = undefined;
    };
  }

  function registerList(handle: AgentListHandle): () => void {
    lists.value = [...lists.value, handle];
    return () => {
      lists.value = lists.value.filter((list) => list !== handle);
    };
  }

  return { entity, lists, registerEntity, registerList };
});
