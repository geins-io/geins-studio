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

  // Some node types render several output handles in a fixed vertical order:
  // condition branches, iterator/loop (foreach → completed) and paginator
  // (fetchPage → forEachPage → completed). Dagre is handle-agnostic, so its
  // targets can land in the wrong vertical order and cross the connections at
  // the source handles. For each such node, reorder its target rows so the
  // top handle's target sits highest, and shift each target's *exclusive*
  // downstream subtree by the same delta so independent branches move as a
  // unit (rather than tearing a target away from its own children).
  const adjacency = new Map<string, string[]>();
  for (const e of edges) {
    const list = adjacency.get(e.source);
    if (list) list.push(e.target);
    else adjacency.set(e.source, [e.target]);
  }

  // Nodes reachable downstream from `start` (inclusive), following edges.
  const reachableFrom = (start: string): Set<string> => {
    const seen = new Set<string>([start]);
    const queue = [start];
    while (queue.length) {
      const id = queue.shift()!;
      for (const next of adjacency.get(id) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    return seen;
  };

  // Vertical handle order per node. Condition order is data-driven (branch
  // labels); iterator/loop/paginator orders are fixed by their renderers.
  const handleOrderForNode = (n: GraphNode): string[] => {
    if (n.type === 'iterator' || n.type === 'loop') {
      return ['foreach', 'completed'];
    }
    if (n.type === 'paginator') {
      return ['fetchPage', 'forEachPage', 'completed'];
    }
    if (n.type === 'condition') {
      const branches: string[] = [];
      const conds = n.data?.conditions as { label: string }[] | undefined;
      if (Array.isArray(conds)) {
        for (const c of conds) if (c.label) branches.push(c.label);
      }
      const def = n.data?.defaultLabel as string | undefined;
      if (def) branches.push(def);
      return branches;
    }
    return [];
  };

  for (const node of nodes) {
    const handleOrder = handleOrderForNode(node);
    if (handleOrder.length < 2) continue;

    // Map each outgoing edge to its handle index (top-to-bottom).
    const handleTargets: { targetId: string; handleIndex: number }[] = [];
    for (const e of edges) {
      if (e.source !== node.id) continue;
      const handle = e.sourceHandle ?? e.label;
      const idx = typeof handle === 'string' ? handleOrder.indexOf(handle) : -1;
      if (idx >= 0 && positions.has(e.target)) {
        handleTargets.push({ targetId: e.target, handleIndex: idx });
      }
    }
    if (handleTargets.length < 2) continue;

    // Sort targets by handle order, then re-slot their Y positions in the same
    // ascending order so the topmost handle owns the topmost row.
    handleTargets.sort((a, b) => a.handleIndex - b.handleIndex);
    const currentYs = handleTargets
      .map((ht) => positions.get(ht.targetId)!.y)
      .sort((a, b) => a - b);

    // A node downstream of more than one target (a convergence point) can't
    // belong to a single branch — leave those to dagre and only move nodes
    // owned exclusively by one target.
    const reachSets = handleTargets.map((ht) => reachableFrom(ht.targetId));
    for (let i = 0; i < handleTargets.length; i++) {
      const target = handleTargets[i];
      const reach = reachSets[i];
      const newY = currentYs[i];
      if (!target || !reach || newY === undefined) continue;
      const targetPos = positions.get(target.targetId);
      if (!targetPos) continue;
      const delta = newY - targetPos.y;
      if (delta === 0) continue;
      for (const id of reach) {
        const pos = positions.get(id);
        if (!pos) continue;
        const sharedWithSibling = reachSets.some(
          (set, j) => j !== i && set.has(id),
        );
        if (sharedWithSibling) continue;
        pos.y += delta;
      }
    }
  }

  return nodes.map((n) => ({
    ...n,
    position: positions.get(n.id)!,
  }));
};
