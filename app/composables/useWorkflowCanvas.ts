import type { Edge, Node } from '@vue-flow/core'
import type { Workflow, WorkflowNode, WorkflowNodeConnection } from '#shared/types'

interface WorkflowCanvasReturnType {
  toCanvas: (wf: Pick<Workflow, 'nodes' | 'connections'> | null | undefined) => {
    nodes: Node[]
    edges: Edge[]
  }
}

// Fallback grid layout for nodes without stored positions. The API may omit
// `position` on older workflows — space them out so they're at least visible
// instead of stacked at (0,0).
const DEFAULT_X = 100
const DEFAULT_Y = 200
const DEFAULT_X_STEP = 300

const toCanvasNode = (node: WorkflowNode, index: number): Node => ({
  id: node.id,
  type: node.type,
  position: node.position ?? { x: DEFAULT_X + index * DEFAULT_X_STEP, y: DEFAULT_Y },
  data: {
    label: node.name ?? node.id,
    actionName: node.actionName,
    config: node.config ?? {},
    input: node.input ?? {},
  },
  ...(node.type === 'trigger' ? { deletable: false } : {}),
})

const toCanvasEdge = (c: WorkflowNodeConnection, index: number): Edge => ({
  id: `e-${c.sourceNodeId}-${c.targetNodeId}-${index}`,
  source: c.sourceNodeId,
  target: c.targetNodeId,
  label: c.label,
  animated: c.type === 'sequential',
  data: { type: c.type },
})

export const useWorkflowCanvas = (): WorkflowCanvasReturnType => {
  const toCanvas: WorkflowCanvasReturnType['toCanvas'] = (wf) => {
    const apiNodes = Array.isArray(wf?.nodes) ? wf!.nodes : []
    const apiConnections = Array.isArray(wf?.connections) ? wf!.connections : []
    return {
      nodes: apiNodes.map(toCanvasNode),
      edges: apiConnections.map(toCanvasEdge),
    }
  }

  return { toCanvas }
}
