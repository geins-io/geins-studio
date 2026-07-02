import { useLocalStorage } from '@vueuse/core';
import type {
  NodeTemplate,
  PaletteItem,
  WorkflowNodeKind,
} from '#shared/types';

const STORAGE_KEY = 'geins-node-templates';

export function useNodeTemplates() {
  const templates = useLocalStorage<NodeTemplate[]>(STORAGE_KEY, []);

  const templateCount = computed(() => templates.value.length);

  const templatesByKind = computed(() => {
    const map = new Map<string, NodeTemplate[]>();
    for (const t of templates.value) {
      const list = map.get(t.kind);
      if (list) list.push(t);
      else map.set(t.kind, [t]);
    }
    return map;
  });

  function saveTemplate(opts: {
    name: string;
    description?: string;
    kind: WorkflowNodeKind;
    functionName?: string;
    nodeData: Record<string, unknown>;
  }): NodeTemplate {
    const template: NodeTemplate = {
      id: crypto.randomUUID(),
      name: opts.name,
      description: opts.description || undefined,
      kind: opts.kind,
      functionName: opts.functionName,
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
      id: `${template.functionName ?? template.kind}-${Date.now()}`,
      type: template.kind,
      position,
      data: JSON.parse(JSON.stringify(template.nodeData)),
    };
  }

  function toPaletteItem(template: NodeTemplate): PaletteItem {
    return {
      kind: template.kind,
      id: template.functionName ?? template.kind,
      label: template.name,
      description: template.description,
      functionName: template.functionName,
      templateId: template.id,
    };
  }

  return {
    templates,
    templateCount,
    templatesByKind,
    saveTemplate,
    deleteTemplate,
    updateTemplate,
    getTemplate,
    toCanvasNode,
    toPaletteItem,
  };
}

export type UseNodeTemplatesReturnType = ReturnType<typeof useNodeTemplates>;
