import dagre from '@dagrejs/dagre';
import type { Edge, GraphNode, Node } from '@vue-flow/core';

// layout parameters (GRID_SIZE=16, ranksep=8*grid, nodesep=6*grid).
// `LR` lays nodes out left-to-right, matching the workflow's source → target flow.
const RANKDIR = 'LR';
const RANKSEP = 128;
const NODESEP = 96;
const DEFAULT_WIDTH = 240;
const DEFAULT_HEIGHT = 100;

// `GraphNode` is VueFlow's internal shape (what `nodes.value` holds after init),
// which exposes measured `dimensions`. Fall back to defaults for nodes that
// haven't been measured yet (e.g. just-added nodes on first render).
const nodeSize = (n: GraphNode) => ({
  width: n.dimensions?.width || DEFAULT_WIDTH,
  height: n.dimensions?.height || DEFAULT_HEIGHT,
});

// Dagre emits center positions while VueFlow positions nodes by their top-left
// corner, so we offset by half the node's size to align them.
export const tidyUpLayout = (nodes: GraphNode[], edges: Edge[]): Node[] => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: RANKDIR,
    ranksep: RANKSEP,
    nodesep: NODESEP,
    edgesep: NODESEP,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of nodes) g.setNode(n.id, nodeSize(n));
  for (const e of edges) g.setEdge(e.source, e.target);

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const laid = g.node(n.id);
    const { width, height } = nodeSize(n);
    positions.set(n.id, { x: laid.x - width / 2, y: laid.y - height / 2 });
  }

  // Condition/switch nodes render handles in a fixed vertical order (matching
  // the branch array). Dagre doesn't know about handles so targets may end up
  // in the wrong vertical order, causing edges to cross. Reorder target Y
  // positions to match the handle order on each condition node.
  const conditionNodes = nodes.filter((n) => n.type === 'condition');
  for (const cn of conditionNodes) {
    const branches: string[] = [];
    const conds = cn.data?.conditions as { label: string }[] | undefined;
    if (Array.isArray(conds)) {
      for (const c of conds) if (c.label) branches.push(c.label);
    }
    const def = cn.data?.defaultLabel as string | undefined;
    if (def) branches.push(def);
    if (branches.length < 2) continue;

    // Map each branch label to its target node via edges
    const branchTargets: { targetId: string; handleIndex: number }[] = [];
    for (const e of edges) {
      if (e.source !== cn.id) continue;
      const handle = e.sourceHandle ?? e.label;
      const idx = typeof handle === 'string' ? branches.indexOf(handle) : -1;
      if (idx >= 0 && positions.has(e.target)) {
        branchTargets.push({ targetId: e.target, handleIndex: idx });
      }
    }
    if (branchTargets.length < 2) continue;

    // Sort by handle index (top-to-bottom) and collect current Y positions
    branchTargets.sort((a, b) => a.handleIndex - b.handleIndex);
    const currentYs = branchTargets
      .map((bt) => positions.get(bt.targetId)!.y)
      .sort((a, b) => a - b);

    // Assign sorted Y values so the top handle's target is visually highest
    for (let i = 0; i < branchTargets.length; i++) {
      const pos = positions.get(branchTargets[i].targetId)!;
      pos.y = currentYs[i];
    }
  }

  return nodes.map((n) => ({
    ...n,
    position: positions.get(n.id)!,
  }));
};
