import { useLocalStorage } from '@vueuse/core';
import type { NodeTemplate, PaletteItem } from '#shared/types';

const STORAGE_KEY = 'geins-node-templates';

export function useNodeTemplates() {
  const templates = useLocalStorage<NodeTemplate[]>(STORAGE_KEY, []);

  const templateCount = computed(() => templates.value.length);

  const templatesByType = computed(() => {
    const map = new Map<string, NodeTemplate[]>();
    for (const t of templates.value) {
      const list = map.get(t.nodeType);
      if (list) list.push(t);
      else map.set(t.nodeType, [t]);
    }
    return map;
  });

  function saveTemplate(opts: {
    name: string;
    description?: string;
    nodeType: string;
    actionName?: string;
    nodeData: Record<string, unknown>;
  }): NodeTemplate {
    const template: NodeTemplate = {
      id: crypto.randomUUID(),
      name: opts.name,
      description: opts.description || undefined,
      nodeType: opts.nodeType,
      actionName: opts.actionName,
      nodeData: JSON.parse(JSON.stringify(opts.nodeData)),
      createdAt: new Date().toISOString(),
    };
    templates.value = [template, ...templates.value];
    return template;
  }

  function deleteTemplate(id: string) {
    templates.value = templates.value.filter((t) => t.id !== id);
  }

  function updateTemplate(
    id: string,
    updates: Partial<Pick<NodeTemplate, 'name' | 'description'>>,
  ) {
    templates.value = templates.value.map((t) =>
      t.id === id ? { ...t, ...updates } : t,
    );
  }

  function getTemplate(id: string): NodeTemplate | undefined {
    return templates.value.find((t) => t.id === id);
  }

  function toCanvasNode(
    template: NodeTemplate,
    position: { x: number; y: number },
  ) {
    return {
      id: `${template.actionName ?? template.nodeType}-${Date.now()}`,
      type: template.nodeType,
      position,
      data: JSON.parse(JSON.stringify(template.nodeData)),
    };
  }

  function toPaletteItem(template: NodeTemplate): PaletteItem {
    return {
      nodeType: template.nodeType,
      id: template.actionName ?? template.nodeType,
      label: template.name,
      description: template.description,
      actionName: template.actionName,
      templateId: template.id,
    };
  }

  return {
    templates,
    templateCount,
    templatesByType,
    saveTemplate,
    deleteTemplate,
    updateTemplate,
    getTemplate,
    toCanvasNode,
    toPaletteItem,
  };
}

export type UseNodeTemplatesReturnType = ReturnType<typeof useNodeTemplates>;
