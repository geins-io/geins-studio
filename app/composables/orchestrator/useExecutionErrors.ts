import type {
  ExecutionError,
  ExecutionLog,
  ExecutionNodeExecution,
} from '#shared/types';

export interface ExecutionChildFailure {
  instanceId: string | null;
  workflowId: string | null;
  nodeName: string | null;
  message: string | null;
  type: string | null;
}

type ExecutionErrorSource = Pick<ExecutionLog, 'error' | 'errors'>;
type NodeErrorSource = Pick<ExecutionNodeExecution, 'error' | 'retryErrors'> & {
  nodeId?: string;
  status?: string | null;
};

interface UseExecutionErrorsReturnType {
  executionErrors: (
    execution: ExecutionErrorSource | null | undefined,
  ) => ExecutionError[];
  errorForNode: (
    execution: ExecutionErrorSource | null | undefined,
    node: NodeErrorSource,
  ) => ExecutionError | null;
  nodeErrorMessage: (
    node: NodeErrorSource | null | undefined,
    execution?: ExecutionErrorSource | null,
  ) => string | null;
  childFailure: (
    error: ExecutionError | null | undefined,
  ) => ExecutionChildFailure | null;
  errorCode: (error: ExecutionError | null | undefined) => string | null;
}

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

// Executions persisted before errors became structured hold plain strings.
const toExecutionError = (value: unknown): ExecutionError | null => {
  const message = asString(value);
  if (message) return { message };
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as { message?: unknown }).message === 'string'
  )
    return value as ExecutionError;
  return null;
};

const isSameError = (a: ExecutionError, b: ExecutionError) =>
  a.message === b.message && (a.failedNodeId ?? '') === (b.failedNodeId ?? '');

/**
 * Reads the orchestrator's structured error objects. An execution carries its
 * primary failure in `error` (naming the failed node) and, for
 * `continueOnError` runs, every failure in `errors`; the failing step carries
 * its own `error` plus one `retryErrors` entry per failed attempt.
 */
export const useExecutionErrors = (): UseExecutionErrorsReturnType => {
  const { isFailedStatus } = useExecutionStatus();

  const executionErrors = (
    execution: ExecutionErrorSource | null | undefined,
  ): ExecutionError[] => {
    if (!execution) return [];
    const primary = toExecutionError(execution.error);
    const rest = (Array.isArray(execution.errors) ? execution.errors : [])
      .map(toExecutionError)
      .filter((err): err is ExecutionError => !!err);
    if (!primary) return rest;
    // `errors` repeats the primary error; identical failures on later
    // iterations are distinct entries and must stay.
    const dupIdx = rest.findIndex((err) => isSameError(err, primary));
    return [primary, ...rest.filter((_, idx) => idx !== dupIdx)];
  };

  // Detailed node logs can be paged out or trimmed, so a failed node falls
  // back to the execution-level error that names it.
  const errorForNode = (
    execution: ExecutionErrorSource | null | undefined,
    node: NodeErrorSource,
  ): ExecutionError | null => {
    const own = toExecutionError(node.error);
    if (own) return own;
    if (!node.nodeId || !isFailedStatus(node.status)) return null;
    return (
      executionErrors(execution).find(
        (err) => err.failedNodeId === node.nodeId,
      ) ?? null
    );
  };

  const nodeErrorMessage = (
    node: NodeErrorSource | null | undefined,
    execution?: ExecutionErrorSource | null,
  ): string | null => {
    if (!node) return null;
    const error = errorForNode(execution, node);
    if (error) return error.message;
    // A node that recovered after retries still lists its retryErrors.
    if (!isFailedStatus(node.status)) return null;
    const retries = Array.isArray(node.retryErrors) ? node.retryErrors : [];
    return asString(retries[retries.length - 1]);
  };

  const childFailure = (
    error: ExecutionError | null | undefined,
  ): ExecutionChildFailure | null => {
    const ctx = error?.context;
    if (!ctx) return null;
    const failure: ExecutionChildFailure = {
      instanceId: asString(ctx.childInstanceId),
      workflowId: asString(ctx.childWorkflowId),
      nodeName:
        asString(ctx.childFailedNodeName) ?? asString(ctx.childFailedNodeId),
      message: asString(ctx.childErrorMessage),
      type: asString(ctx.childErrorType),
    };
    return failure.instanceId || failure.message ? failure : null;
  };

  const errorCode = (error: ExecutionError | null | undefined): string | null =>
    asString(error?.context?.code) ?? asString(error?.context?.childErrorCode);

  return {
    executionErrors,
    errorForNode,
    nodeErrorMessage,
    childFailure,
    errorCode,
  };
};
