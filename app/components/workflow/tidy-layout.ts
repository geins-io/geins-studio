import dagre from '@dagrejs/dagre'
import type { Edge, GraphNode, Node } from '@vue-flow/core'

// layout parameters (GRID_SIZE=16, ranksep=8*grid, nodesep=6*grid).
// `LR` lays nodes out left-to-right, matching the workflow's source → target flow.
const RANKDIR = 'LR'
const RANKSEP = 128
const NODESEP = 96
const DEFAULT_WIDTH = 240
const DEFAULT_HEIGHT = 100

// `GraphNode` is VueFlow's internal shape (what `nodes.value` holds after init),
// which exposes measured `dimensions`. Fall back to defaults for nodes that
// haven't been measured yet (e.g. just-added nodes on first render).
const nodeSize = (n: GraphNode) => ({
  width: n.dimensions?.width || DEFAULT_WIDTH,
  height: n.dimensions?.height || DEFAULT_HEIGHT,
})

// Dagre emits center positions while VueFlow positions nodes by their top-left
// corner, so we offset by half the node's size to align them.
export const tidyUpLayout = (nodes: GraphNode[], edges: Edge[]): Node[] => {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: RANKDIR, ranksep: RANKSEP, nodesep: NODESEP, edgesep: NODESEP })
  g.setDefaultEdgeLabel(() => ({}))

  for (const n of nodes) g.setNode(n.id, nodeSize(n))
  for (const e of edges) g.setEdge(e.source, e.target)

  dagre.layout(g)

  return nodes.map((n) => {
    const laid = g.node(n.id)
    const { width, height } = nodeSize(n)
    return {
      ...n,
      position: { x: laid.x - width / 2, y: laid.y - height / 2 },
    }
  })
}
