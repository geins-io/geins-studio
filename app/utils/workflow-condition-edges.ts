import type { ConnectionType } from '#shared/types';

type EdgeRoutingLike = {
  label?: unknown;
  sourceHandle?: string | null;
  data?: unknown;
};

type ConditionNodeDataLike = {
  conditions?: unknown;
  defaultLabel?: unknown;
};

/**
 * The `type` and `label` a canvas edge is saved with. Edges drawn from a named
 * handle carry the handle id on `sourceHandle` until a label is set on them.
 */
export function edgeConnectionRouting(edge: EdgeRoutingLike): {
  type: ConnectionType;
  label: string;
} {
  const storedType = (edge.data as { type?: ConnectionType } | undefined)?.type;
  const type: ConnectionType =
    storedType ?? (edge.sourceHandle ? 'conditional' : 'sequential');
  const label =
    typeof edge.label === 'string' && edge.label
      ? edge.label
      : type === 'conditional'
        ? (edge.sourceHandle ?? '')
        : '';
  return { type, label };
}

/** Labels a condition node routes on: each branch label, then the default. */
export function conditionBranchLabels(
  data: ConditionNodeDataLike | null | undefined,
): string[] {
  const labels: string[] = [];
  if (Array.isArray(data?.conditions)) {
    for (const c of data.conditions as Array<{ label?: unknown } | null>) {
      if (typeof c?.label === 'string' && c.label) labels.push(c.label);
    }
  }
  if (typeof data?.defaultLabel === 'string' && data.defaultLabel) {
    labels.push(data.defaultLabel);
  }
  return labels;
}

/**
 * Whether an edge leaving a condition node matches none of its branches. The
 * engine follows an edge only when its saved `label` equals the matched branch
 * label exactly, so such an edge never runs.
 */
export function isUnroutedConditionEdge(
  edge: EdgeRoutingLike,
  sourceData: ConditionNodeDataLike | null | undefined,
): boolean {
  return !conditionBranchLabels(sourceData).includes(
    edgeConnectionRouting(edge).label,
  );
}

/**
 * The edge rename a branch-label keystroke implies. The label input updates
 * per keystroke, so retyping a label passes through `''`: `pending` holds the
 * label the branch's edges still carry until a non-empty label arrives, instead
 * of renaming them to `''`.
 */
export function resolveBranchLabelRename(
  pending: Map<number, string>,
  index: number,
  oldLabel: string,
  newLabel: string,
): { from: string; to: string } | null {
  const from = oldLabel || pending.get(index);
  if (!newLabel) {
    if (from) pending.set(index, from);
    return null;
  }
  pending.delete(index);
  return from && from !== newLabel ? { from, to: newLabel } : null;
}
