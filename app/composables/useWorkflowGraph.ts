import { computed, toValue, type MaybeRefOrGetter } from 'vue';

/**
 * Translates a Geins workflow definition (`nodes` + `connections` from the API)
 * into VueFlow `nodes` / `edges` arrays, with an auto-layout fallback when
 * positions are not persisted on `node.ui` / `connection.ui`.
 *
 * The layout is a layered BFS: every node gets a `level` = longest path from
 * a root (considering forward edges only). Back-edges (targets already at an
 * equal or smaller level) are preserved as edges but do NOT influence layout,
 * which keeps cyclic graphs (loops) readable.
 */

type AnyRecord = Record<string, unknown>;

export type WorkflowNodeLike = {
  id: string;
  type: string;
  name?: string;
  actionName?: string;
  ui?: { position?: { x: number; y: number } } | null;
  conditions?: Array<{
    label: string;
    condition?: string;
    description?: string;
  }> | null;
  defaultLabel?: string;
  loop?: AnyRecord | null;
  retry?: AnyRecord | null;
  timeout?: string;
  errorHandlingStrategy?: string | null;
} & AnyRecord;

export type WorkflowConnectionLike = {
  from: string;
  to: string;
  label?: string;
  type?: string;
  ui?: AnyRecord | null;
};

export type WorkflowLike = {
  nodes?: WorkflowNodeLike[] | null;
  connections?: WorkflowConnectionLike[] | null;
};

export type FlowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    raw: WorkflowNodeLike;
    // Convenience fields commonly rendered in node components:
    icon?: string;
    subtype?: string;
    actionName?: string;
    description?: string;
    config: Record<string, unknown>;
    hasRetry: boolean;
    hasLoop: boolean;
  };
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
  data: {
    raw: WorkflowConnectionLike;
    kind: 'sequential' | 'conditional' | 'loop' | 'other';
  };
};

const LEVEL_X = 400;
const ROW_Y = 300;
const KNOWN_VUEFLOW_TYPES = new Set([
  'trigger',
  'action',
  'condition',
  'loop',
  'delay',
]);

function mapNodeType(type: string): { type: string; subtype?: string } {
  if (KNOWN_VUEFLOW_TYPES.has(type)) return { type };
  // Unknown backend type (e.g. `workflow`, `http`, etc.) — render as a generic
  // action node but keep the original as a subtype so the node component can
  // differentiate visually if it wants to.
  return { type: 'action', subtype: type };
}

function classifyEdgeKind(
  conn: WorkflowConnectionLike,
): FlowEdge['data']['kind'] {
  const t = (conn.type ?? '').toLowerCase();
  if (t === 'conditional') return 'conditional';
  if (t === 'loop' || t === 'loop-back') return 'loop';
  if (t === 'sequential' || t === '') return 'sequential';
  return 'other';
}

/**
 * BFS level assignment. Returns a Map<nodeId, level>. `level` = longest
 * forward path from any root. Back-edges (seen after a node already has a
 * level and target.level <= source.level) are ignored for layout purposes.
 */
function assignLevels(
  nodes: WorkflowNodeLike[],
  connections: WorkflowConnectionLike[],
): Map<string, number> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const outgoing = new Map<string, string[]>();
  const incomingCount = new Map<string, number>();
  for (const n of nodes) {
    outgoing.set(n.id, []);
    incomingCount.set(n.id, 0);
  }
  for (const c of connections) {
    if (!byId.has(c.from) || !byId.has(c.to)) continue;
    outgoing.get(c.from)!.push(c.to);
    incomingCount.set(c.to, (incomingCount.get(c.to) ?? 0) + 1);
  }

  const roots: string[] = [];
  for (const n of nodes) {
    if ((incomingCount.get(n.id) ?? 0) === 0) roots.push(n.id);
  }
  // If every node has an incoming edge (fully cyclic), fall back to the first
  // node as the root so we still produce some layout.
  if (roots.length === 0 && nodes.length > 0) roots.push(nodes[0]!.id);

  const levels = new Map<string, number>();
  for (const r of roots) levels.set(r, 0);

  // Layered BFS — we may revisit nodes along longer paths, but never along
  // back-edges (which would reduce their level).
  const queue: string[] = [...roots];
  const seenEdges = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    const level = levels.get(id) ?? 0;
    for (const next of outgoing.get(id) ?? []) {
      const edgeKey = `${id}->${next}`;
      if (seenEdges.has(edgeKey)) continue;
      seenEdges.add(edgeKey);
      const current = levels.get(next);
      if (current === undefined || current < level + 1) {
        levels.set(next, level + 1);
        queue.push(next);
      }
    }
  }

  // Any node still without a level (disconnected or only reachable via
  // ignored back-edges) gets dropped on level 0 at the end.
  for (const n of nodes) {
    if (!levels.has(n.id)) levels.set(n.id, 0);
  }
  return levels;
}

function computePositions(
  nodes: WorkflowNodeLike[],
  levels: Map<string, number>,
): Map<string, { x: number; y: number }> {
  const buckets = new Map<number, string[]>();
  for (const n of nodes) {
    const lvl = levels.get(n.id) ?? 0;
    if (!buckets.has(lvl)) buckets.set(lvl, []);
    buckets.get(lvl)!.push(n.id);
  }
  const positions = new Map<string, { x: number; y: number }>();
  for (const [lvl, ids] of buckets) {
    ids.forEach((id, idx) => {
      positions.set(id, { x: lvl * LEVEL_X, y: idx * ROW_Y });
    });
  }
  return positions;
}

function toFlowNode(
  node: WorkflowNodeLike,
  position: { x: number; y: number },
): FlowNode {
  const { type, subtype } = mapNodeType(node.type);
  return {
    id: node.id,
    type,
    position,
    data: {
      label: node.name || node.id,
      raw: node,
      subtype,
      actionName: node.actionName || undefined,
      description: (node as AnyRecord).description as string | undefined,
      icon: (node.ui as AnyRecord | null)?.icon as string | undefined,
      config: ((node as AnyRecord).input as Record<string, unknown>) ?? {},
      hasRetry: !!node.retry,
      hasLoop: !!node.loop,
    },
  };
}

function toFlowEdge(conn: WorkflowConnectionLike): FlowEdge {
  const kind = classifyEdgeKind(conn);
  return {
    id: `${conn.from}->${conn.to}${conn.label ? `:${conn.label}` : ''}`,
    source: conn.from,
    target: conn.to,
    label: conn.label || undefined,
    type: kind === 'conditional' ? 'smoothstep' : 'default',
    animated: kind === 'loop',
    data: { raw: conn, kind },
  };
}

export function useWorkflowGraph(
  source: MaybeRefOrGetter<WorkflowLike | null | undefined>,
) {
  const nodes = computed<FlowNode[]>(() => {
    const wf = toValue(source);
    const rawNodes = Array.isArray(wf?.nodes) ? wf!.nodes! : [];
    if (rawNodes.length === 0) return [];
    const connections = Array.isArray(wf?.connections) ? wf!.connections! : [];
    const levels = assignLevels(rawNodes, connections);
    const positions = computePositions(rawNodes, levels);
    return rawNodes.map((n) =>
      toFlowNode(n, positions.get(n.id) ?? { x: 0, y: 0 }),
    );
  });

  const edges = computed<FlowEdge[]>(() => {
    const wf = toValue(source);
    const rawEdges = Array.isArray(wf?.connections) ? wf!.connections! : [];
    return rawEdges.map(toFlowEdge);
  });

  return { nodes, edges };
}

export type UseWorkflowGraphReturnType = ReturnType<typeof useWorkflowGraph>;
