import type {
  ConnectionType,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowNodeConnection,
} from '#shared/types';
import type { Edge, Node } from '@vue-flow/core';

interface WorkflowCanvasReturnType {
  toCanvas: (
    wf: Pick<WorkflowDefinition, 'nodes' | 'connections'> | null | undefined,
  ) => {
    nodes: Node[];
    edges: Edge[];
  };
  toApi: (graph: { nodes: Node[]; edges: Edge[] }) => {
    nodes: WorkflowNode[];
    connections: WorkflowNodeConnection[];
  };
}

// Fallback grid layout for nodes without stored positions. The API may omit
// `position` on older workflows — space them out so they're at least visible
// instead of stacked at (0,0).
const DEFAULT_X = 400;
const DEFAULT_Y = 200;
const DEFAULT_X_STEP = 300;

// Nodes and connections carry a free-form `ui` object for editor state. We
// use it as the source of truth for canvas position (`ui.position`) and keep
// the raw blob around on `data.ui` so unknown keys survive a round-trip.
type NodeUi = { position?: { x: number; y: number }; [key: string]: unknown };
type WithUi = { ui?: NodeUi };

const HTTP_NO_BODY_METHODS = new Set(['GET', 'DELETE']);

const sanitizeNodeInput = (
  nodeType: string,
  input: Record<string, unknown>,
): Record<string, unknown> => {
  if (
    (nodeType === 'httpRequest' || nodeType === 'net.httpRequest') &&
    HTTP_NO_BODY_METHODS.has(String(input.method ?? 'GET'))
  ) {
    const { body: _, ...rest } = input;
    return rest;
  }
  return input;
};

export const sanitizeWorkflowNodes = <
  T extends {
    type?: string;
    actionName?: string;
    input?: Record<string, unknown>;
  },
>(
  nodes: T[],
): T[] =>
  nodes.map((n) => {
    const nodeType = n.actionName ?? n.type ?? '';
    if (!n.input) return n;
    const sanitized = sanitizeNodeInput(nodeType, n.input);
    return sanitized === n.input ? n : ({ ...n, input: sanitized } as T);
  });

const readPosition = (node: WorkflowNode & WithUi, index: number) =>
  node.ui?.position ??
  node.position ?? { x: DEFAULT_X + index * DEFAULT_X_STEP, y: DEFAULT_Y };

const toCanvasNode = (node: WorkflowNode & WithUi, index: number): Node => ({
  id: node.id,
  type: node.type,
  position: readPosition(node, index),
  data: {
    label: node.name ?? node.id,
    actionName: node.actionName,
    config: node.config ?? {},
    input: node.input ?? {},
    ui: node.ui ?? {},
    conditions:
      'conditions' in node
        ? (node as { conditions: unknown }).conditions
        : undefined,
    defaultLabel:
      'defaultLabel' in node
        ? (node as { defaultLabel: unknown }).defaultLabel
        : undefined,
  },
  ...(node.type === 'trigger' ? { deletable: false } : {}),
});

// The API has shipped connections under a few different field names across
// versions (`sourceNodeId`/`targetNodeId`, `source`/`target`, `from`/`to`).
// Read all three so the canvas renders regardless of payload shape.
const readEndpoints = (
  c: Record<string, unknown>,
): { source?: string; target?: string } => ({
  source: (c.sourceNodeId ?? c.source ?? c.from ?? c.fromNodeId) as
    | string
    | undefined,
  target: (c.targetNodeId ?? c.target ?? c.to ?? c.toNodeId) as
    | string
    | undefined,
});

const toCanvasEdge = (
  c: WorkflowNodeConnection,
  index: number,
  conditionNodeIds: Set<string>,
  handleSourceNodeIds: Set<string>,
  inferLabel?: (
    source: string,
    connection: WorkflowNodeConnection,
  ) => string | undefined,
): Edge => {
  const { source, target } = readEndpoints(
    c as unknown as Record<string, unknown>,
  );
  const isConditional =
    c.type === 'conditional' || (!!source && conditionNodeIds.has(source));
  let label = c.label;
  // Infer missing labels for condition node edges from the node's branch config.
  if (isConditional && !label && source && inferLabel) {
    label = inferLabel(source, c);
  }
  // Restore the source handle from the saved `label` for any node that routes
  // through named handles: condition branches AND the structural handles on
  // iterator/loop (foreach/completed) and paginator (fetchPage/forEachPage/
  // completed). These edges are persisted with `type: 'parallel'` as often as
  // `'conditional'`, so the handle identity lives on `label`, not the type —
  // without this, `WorkflowHandlePlus` can't match the edge to its handle and
  // keeps showing the "+" affordance on an already-connected handle.
  const isHandleSource = !!source && handleSourceNodeIds.has(source);
  const sourceHandle =
    (isConditional || isHandleSource) && label ? label : undefined;
  return {
    id: `e-${source ?? 'src'}-${target ?? 'tgt'}-${index}`,
    source: source ?? '',
    target: target ?? '',
    sourceHandle,
    label,
    animated: false,
    data: { type: isConditional ? 'conditional' : c.type, ui: c.ui ?? {} },
  };
};

export const useWorkflowCanvas = (): WorkflowCanvasReturnType => {
  const toCanvas: WorkflowCanvasReturnType['toCanvas'] = (wf) => {
    const apiNodes = Array.isArray(wf?.nodes) ? wf!.nodes : [];
    const apiConnections = Array.isArray(wf?.connections)
      ? wf!.connections
      : [];
    const conditionNodeIds = new Set(
      apiNodes.filter((n) => n.type === 'condition').map((n) => n.id),
    );
    // Nodes whose outgoing edges leave from named structural handles. Their
    // handle identity is stored on the connection `label`, so the canvas must
    // restore `sourceHandle` from it on load (see `toCanvasEdge`). `loop` is a
    // legacy alias for `iterator` that can still appear in saved definitions.
    const HANDLE_SOURCE_TYPES = new Set(['iterator', 'loop', 'paginator']);
    const handleSourceNodeIds = new Set(
      apiNodes.filter((n) => HANDLE_SOURCE_TYPES.has(n.type)).map((n) => n.id),
    );

    // Build branch labels per condition node so we can infer missing labels
    // on legacy connections that were saved with empty label/type.
    const conditionBranches = new Map<string, string[]>();
    for (const n of apiNodes) {
      if (n.type !== 'condition') continue;
      const labels: string[] = [];
      const conds = (n as { conditions?: { label: string }[] }).conditions;
      if (Array.isArray(conds)) {
        for (const c of conds) if (c.label) labels.push(c.label);
      }
      const def = (n as { defaultLabel?: string }).defaultLabel;
      if (def) labels.push(def);
      if (labels.length) conditionBranches.set(n.id, labels);
    }

    // Collect labels already claimed per source node so we can find the
    // unclaimed one for a connection with an empty label.
    const claimedLabels = new Map<string, Set<string>>();
    for (const c of apiConnections) {
      if (!c.label) continue;
      const { source } = readEndpoints(c as unknown as Record<string, unknown>);
      if (!source) continue;
      if (!claimedLabels.has(source)) claimedLabels.set(source, new Set());
      claimedLabels.get(source)!.add(c.label);
    }

    // Pre-assign labels to unlabeled condition edges so each gets a unique
    // branch. When only one label is unclaimed the match is unambiguous;
    // otherwise assign unclaimed labels in order so edges at least attach to
    // real handles instead of the node centre.
    const inferredLabels = new Map<WorkflowNodeConnection, string>();
    const unlabeledBySource = new Map<string, WorkflowNodeConnection[]>();
    for (const c of apiConnections) {
      if (c.label) continue;
      const { source } = readEndpoints(c as unknown as Record<string, unknown>);
      if (!source || !conditionNodeIds.has(source)) continue;
      if (!unlabeledBySource.has(source)) unlabeledBySource.set(source, []);
      unlabeledBySource.get(source)!.push(c);
    }
    for (const [source, conns] of unlabeledBySource) {
      const allLabels = conditionBranches.get(source);
      if (!allLabels) continue;
      const claimed = claimedLabels.get(source);
      const unclaimed = allLabels.filter((l) => !claimed?.has(l));
      for (let i = 0; i < conns.length && i < unclaimed.length; i++) {
        const conn = conns[i];
        const branchLabel = unclaimed[i];
        if (conn && branchLabel) inferredLabels.set(conn, branchLabel);
      }
    }

    const inferLabel = (
      _source: string,
      connection: WorkflowNodeConnection,
    ): string | undefined => inferredLabels.get(connection);

    const nodes = apiNodes.map(toCanvasNode);
    const edges = apiConnections.map((c, i) =>
      toCanvasEdge(c, i, conditionNodeIds, handleSourceNodeIds, inferLabel),
    );
    return { nodes, edges };
  };

  const toApi: WorkflowCanvasReturnType['toApi'] = ({ nodes, edges }) => ({
    // The trigger is workflow-level metadata (stored on the Workflow itself),
    // not an entry in `nodes[]` — strip it so we don't double-persist it.
    nodes: nodes
      .filter((n) => n.type !== 'trigger')
      .map((n) => {
        const existingUi = (n.data?.ui as NodeUi | undefined) ?? {};
        const position = { x: n.position.x, y: n.position.y };
        return {
          id: n.id,
          type: n.type as WorkflowNode['type'],
          name: (n.data?.label as string | undefined) ?? n.id,
          actionName: n.data?.actionName as string | undefined,
          config: (n.data?.config as Record<string, unknown> | undefined) ?? {},
          input: sanitizeNodeInput(
            (n.data?.actionName as string) ?? (n.type as string),
            (n.data?.input as Record<string, unknown> | undefined) ?? {},
          ),
          position,
          // Persist position on the API-native `ui` field so the canvas can
          // restore it on next load (and any unrelated ui keys round-trip).
          ui: { ...existingUi, position },
          ...(n.data?.conditions != null
            ? { conditions: n.data.conditions }
            : {}),
          ...(n.data?.defaultLabel != null
            ? { defaultLabel: n.data.defaultLabel }
            : {}),
        } as WorkflowNode & WithUi;
      }),
    connections: edges.map((e) => {
      const storedType = (e.data as { type?: ConnectionType } | undefined)
        ?.type;
      const existingUi = (e.data as { ui?: NodeUi } | undefined)?.ui;
      const type: ConnectionType =
        storedType ?? (e.sourceHandle ? 'conditional' : 'sequential');
      // Conditional edges carry the branch name on `sourceHandle`. Fall back to
      // it so the API stores which branch this edge represents.
      const label =
        typeof e.label === 'string' && e.label
          ? e.label
          : type === 'conditional'
            ? (e.sourceHandle ?? '')
            : '';
      // The API expects `null` (not `{}`) when no editor metadata is attached;
      // only emit an object once at least one ui key exists.
      const ui =
        existingUi && Object.keys(existingUi).length > 0 ? existingUi : null;
      return {
        from: e.source,
        to: e.target,
        label,
        type,
        ui,
      } as WorkflowNodeConnection;
    }),
  });

  return { toCanvas, toApi };
};
