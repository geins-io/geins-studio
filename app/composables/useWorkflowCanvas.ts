import type {
  ErrorHandlingStrategy,
  RetryPolicy,
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
// `ui.position` on older workflows — space them out so they're at least visible
// instead of stacked at (0,0).
const DEFAULT_X = 400;
const DEFAULT_Y = 200;
const DEFAULT_X_STEP = 300;

// Nodes and connections carry a free-form `ui` object for editor state. We
// use it as the source of truth for canvas position (`ui.position`) and keep
// the raw blob around on `data.ui` so unknown keys survive a round-trip.
type NodeUi = { position?: { x: number; y: number }; [key: string]: unknown };

const HTTP_NO_BODY_METHODS = new Set(['GET', 'DELETE']);

/** Whether a node's functionName is the HTTP request node (any provider/version). */
const isHttpRequest = (functionName: string | undefined): boolean => {
  if (!functionName) return false;
  const name = (functionName.split('@')[0] ?? functionName).split('.').pop();
  return name === 'httpRequest';
};

const sanitizeNodeConfig = (
  functionName: string | undefined,
  config: Record<string, unknown>,
): Record<string, unknown> => {
  if (
    isHttpRequest(functionName) &&
    HTTP_NO_BODY_METHODS.has(String(config.method ?? 'GET'))
  ) {
    const { body: _body, ...rest } = config;
    return rest;
  }
  return config;
};

export const sanitizeWorkflowNodes = <
  T extends {
    functionName?: string;
    config?: Record<string, unknown>;
  },
>(
  nodes: T[],
): T[] =>
  nodes.map((n) => {
    if (!n.config) return n;
    const sanitized = sanitizeNodeConfig(n.functionName, n.config);
    return sanitized === n.config ? n : ({ ...n, config: sanitized } as T);
  });

const readPosition = (node: WorkflowNode, index: number) =>
  (node.ui as NodeUi | undefined)?.position ?? {
    x: DEFAULT_X + index * DEFAULT_X_STEP,
    y: DEFAULT_Y,
  };

const toCanvasNode = (node: WorkflowNode, index: number): Node => {
  const kind = functionNameToNodeKind(node.functionName);
  const config = node.config ?? {};
  return {
    id: node.id,
    type: kind,
    position: readPosition(node, index),
    data: {
      label: node.name ?? node.id,
      functionName: node.functionName,
      config,
      ui: node.ui ?? {},
      retry: node.retry ?? null,
      timeout: node.timeout ?? null,
      errorHandlingStrategy: node.errorHandlingStrategy ?? null,
      // Condition branch metadata now lives under `config`; surface it on
      // `data` for the condition renderer/edge-label inference.
      conditions: config.conditions,
      defaultLabel: config.defaultLabel,
    },
  };
};

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
): Edge => {
  const { source, target } = readEndpoints(
    c as unknown as Record<string, unknown>,
  );
  const isConditional =
    c.type === 'conditional' || (!!source && conditionNodeIds.has(source));
  // Never infer a missing label from the node's branches: the engine routes
  // on the saved label only, so an unlabeled edge must look unrouted, not
  // attached to a branch it never runs.
  const label = c.label || undefined;
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
    // `functionName` is part of the API contract (workflow_nodeModel) — read it
    // straight from the response. Nodes missing it indicate non-conformant
    // (un-migrated) data and are surfaced by backend validation, not patched here.
    const apiNodes = Array.isArray(wf?.nodes) ? wf!.nodes : [];
    const apiConnections = Array.isArray(wf?.connections)
      ? wf!.connections
      : [];
    const kindOf = (n: WorkflowNode) => functionNameToNodeKind(n.functionName);
    const conditionNodeIds = new Set(
      apiNodes.filter((n) => kindOf(n) === 'condition').map((n) => n.id),
    );
    // Nodes whose outgoing edges leave from named structural handles. Their
    // handle identity is stored on the connection `label`, so the canvas must
    // restore `sourceHandle` from it on load (see `toCanvasEdge`).
    const HANDLE_SOURCE_KINDS = new Set(['iterator', 'paginator']);
    const handleSourceNodeIds = new Set(
      apiNodes
        .filter((n) => HANDLE_SOURCE_KINDS.has(kindOf(n)))
        .map((n) => n.id),
    );

    const nodes = apiNodes.map(toCanvasNode);
    const edges = apiConnections.map((c, i) =>
      toCanvasEdge(c, i, conditionNodeIds, handleSourceNodeIds),
    );
    return { nodes, edges };
  };

  const toApi: WorkflowCanvasReturnType['toApi'] = ({ nodes, edges }) => ({
    // The trigger is workflow-level metadata (stored on the Workflow itself),
    // not an entry in `nodes[]` — strip the synthetic trigger node.
    nodes: nodes
      .filter((n) => n.type !== 'trigger')
      .map((n) => {
        const existingUi = (n.data?.ui as NodeUi | undefined) ?? {};
        const position = { x: n.position.x, y: n.position.y };
        const functionName = (n.data?.functionName as string | undefined) ?? '';
        // Merge condition branch edits back into config (the condition editor
        // mutates `data.conditions`/`data.defaultLabel`).
        const config: Record<string, unknown> = {
          ...((n.data?.config as Record<string, unknown> | undefined) ?? {}),
        };
        if (n.data?.conditions != null) config.conditions = n.data.conditions;
        if (n.data?.defaultLabel != null)
          config.defaultLabel = n.data.defaultLabel;
        const retry = (n.data?.retry as RetryPolicy | null | undefined) ?? null;
        const timeout = (n.data?.timeout as string | null | undefined) ?? null;
        const errorHandlingStrategy =
          (n.data?.errorHandlingStrategy as
            | ErrorHandlingStrategy
            | null
            | undefined) ?? null;
        return {
          id: n.id,
          name: (n.data?.label as string | undefined) ?? n.id,
          functionName,
          config: sanitizeNodeConfig(functionName, config),
          // Persist position on the API-native `ui` field so the canvas can
          // restore it on next load (and any unrelated ui keys round-trip).
          ui: { ...existingUi, position },
          ...(retry ? { retry } : {}),
          ...(timeout ? { timeout } : {}),
          ...(errorHandlingStrategy ? { errorHandlingStrategy } : {}),
        } as WorkflowNode;
      }),
    connections: edges.map((e) => {
      const existingUi = (e.data as { ui?: NodeUi } | undefined)?.ui;
      const { type, label } = edgeConnectionRouting(e);
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
