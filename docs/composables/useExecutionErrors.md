# `useExecutionErrors`

`useExecutionErrors` reads the structured error objects the orchestrator records on a failed workflow execution. It is pure (no state, no API calls), so it is safe to call inside computeds and polling loops.

## Where errors live

When a workflow fails, the orchestrator records the failure in two places:

| Field                          | Shape              | Notes                                                                                                                                                                |
| ------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execution.error`              | `ExecutionError`   | The primary failure. `failedNodeId`/`failedNodeName` name the failing step; both are absent when the run failed outside a step (input validation, workflow timeout). |
| `execution.errors`             | `ExecutionError[]` | Every failure of a `continueOnError` run. List endpoints only return it with `?fields=errors`.                                                                       |
| `nodeExecutions[].error`       | `ExecutionError`   | The step's own error. It has no `failedNode*` fields.                                                                                                                |
| `nodeExecutions[].retryErrors` | `string[]`         | One message per failed attempt, including the final one.                                                                                                             |

`ExecutionError.context` carries extra detail:

- **Child workflow failures:** `childInstanceId` (the child's execution id), `childWorkflowId`, `childFailedNodeName`, `childErrorMessage`, `childErrorType`.
- **Fail nodes:** `code`.

HTTP request failures append up to 500 characters of the response body to `message`.

## Usage

```ts
const {
  executionErrors,
  errorForNode,
  nodeErrorMessage,
  childFailure,
  errorCode,
} = useExecutionErrors();

// Banner: primary error first, then continueOnError errors, deduplicated
const errors = computed(() => executionErrors(execution.value));

// Step list: the node's own error, else the execution error naming that node
const error = errorForNode(execution.value, node);

// One-line message for logs/tooltips; falls back to the last retry error
const message = nodeErrorMessage(node, execution.value);
```

## API

| Function                             | Returns                         | Description                                                                                                                                                                |
| ------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `executionErrors(execution)`         | `ExecutionError[]`              | `error` followed by `errors`; the one copy of `error` inside `errors` is dropped, repeated failures are kept. Plain-string errors (older executions) become `{ message }`. |
| `errorForNode(execution, node)`      | `ExecutionError \| null`        | The node's `error`. For a failed node (`status` failed/timed out), falls back to the execution error whose `failedNodeId` matches (covers paged-out node logs).            |
| `nodeErrorMessage(node, execution?)` | `string \| null`                | `errorForNode(...)?.message`; a failed node falls back to its last `retryErrors` entry. A node that recovered after retries returns `null`.                                |
| `childFailure(error)`                | `ExecutionChildFailure \| null` | Typed read of the `context.child*` fields.                                                                                                                                 |
| `errorCode(error)`                   | `string \| null`                | A Fail node's `context.code`, else `context.childErrorCode`.                                                                                                               |

Pass the node's `status` — the fallbacks only apply to failed nodes, decided by `useExecutionStatus().isFailedStatus` (`failed`, `timedout`).

## Related

- [`OrchestratorExecutionErrorDetails`](/components/orchestrator/OrchestratorExecutionErrorDetails.md) renders one `ExecutionError`.
