import type { WorkflowNodeKind } from '#shared/types';

/** Flow-control node names that render with a dedicated canvas component. */
const FLOW_KINDS = new Set<WorkflowNodeKind>([
  'condition',
  'iterator',
  'paginator',
  'delay',
  'workflow',
]);

/**
 * Derive the canvas renderer kind from a node's `functionName`
 * (`provider.type.name[@version]`, e.g. `core.flow.condition`).
 *
 * Flow-control nodes (`core.flow.condition|iterator|paginator|delay|workflow`)
 * map to their own kind; everything else renders as a generic `action`. The
 * synthetic `trigger` node is created by the canvas, not derived here.
 */
export function functionNameToNodeKind(
  functionName: string | undefined | null,
): WorkflowNodeKind {
  if (!functionName) return 'action';
  const base = functionName.split('@')[0] ?? functionName;
  const parts = base.split('.');
  const name = (parts[parts.length - 1] ?? '') as WorkflowNodeKind;
  const category = parts.length >= 2 ? parts[parts.length - 2] : '';
  // `loop` is a legacy alias for `iterator` seen in older definitions.
  if (name === ('loop' as WorkflowNodeKind)) return 'iterator';
  if (category === 'flow' && FLOW_KINDS.has(name)) return name;
  return 'action';
}
