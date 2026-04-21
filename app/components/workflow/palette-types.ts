// Shared types for the workflow node palette — used by WorkflowSidebarAddNode
// (produces items) and WorkflowBuilder (consumes items when placing nodes).

export type PaletteItem = {
  // VueFlow node type this item creates ('action' | 'trigger' | 'condition' | 'iterator' | 'delay' | 'workflow').
  nodeType: string
  // Stable id for template keying.
  id: string
  label: string
  description?: string
  // For action items, the backend `actionName` that goes into the node's config.
  actionName?: string
}

export type PaletteSection = {
  category: string
  items: PaletteItem[]
}
