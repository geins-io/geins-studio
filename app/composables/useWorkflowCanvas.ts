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

const toCanvasEdge = (c: WorkflowNodeConnection, index: number): Edge => {
  const { source, target } = readEndpoints(
    c as unknown as Record<string, unknown>,
  );
  // `conditional` connections carry the branch name in `label`. Route to a
  // matching sourceHandle so the edge attaches to the right output port on
  // condition / switch nodes (which render one handle per branch).
  const sourceHandle =
    c.type === 'conditional' && c.label ? c.label : undefined;
  return {
    id: `e-${source ?? 'src'}-${target ?? 'tgt'}-${index}`,
    source: source ?? '',
    target: target ?? '',
    sourceHandle,
    label: c.label,
    animated: false,
    data: { type: c.type, ui: c.ui ?? {} },
  };
};

export const useWorkflowCanvas = (): WorkflowCanvasReturnType => {
  const toCanvas: WorkflowCanvasReturnType['toCanvas'] = (wf) => {
    const apiNodes = Array.isArray(wf?.nodes) ? wf!.nodes : [];
    const apiConnections = Array.isArray(wf?.connections)
      ? wf!.connections
      : [];
    const nodes = apiNodes.map(toCanvasNode);
    const edges = apiConnections.map(toCanvasEdge);
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
          input: (n.data?.input as Record<string, unknown> | undefined) ?? {},
          position,
          // Persist position on the API-native `ui` field so the canvas can
          // restore it on next load (and any unrelated ui keys round-trip).
          ui: { ...existingUi, position },
        } as WorkflowNode & WithUi;
      }),
    connections: edges.map((e) => {
      const storedType = (e.data as { type?: ConnectionType } | undefined)
        ?.type;
      const existingUi = (e.data as { ui?: NodeUi } | undefined)?.ui;
      const type: ConnectionType =
        storedType ??
        (e.sourceHandle === 'true' || e.sourceHandle === 'false'
          ? 'conditional'
          : 'sequential');
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
