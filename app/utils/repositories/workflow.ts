import type {
  Workflow,
  WorkflowCreate,
  WorkflowUpdate,
  WorkflowApiOptions,
  WorkflowValidationResult,
  WorkflowExecution,
  WorkflowExecutionApiOptions,
  WorkflowExecutionStartRequest,
  WorkflowExecutionLog,
  WorkflowExecutionConcurrency,
  WorkflowMetrics,
  WorkflowAggregateMetrics,
  WorkflowErrorSummary,
  WorkflowVersion,
  WorkflowVersionComparison,
  WorkflowVariable,
  WorkflowVariableCreate,
  WorkflowEditorManifest,
  WorkflowAction,
} from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const WORKFLOW_ENDPOINT = '/workflow';
const EXECUTION_ENDPOINT = '/workflow/execution';
const METRICS_ENDPOINT = '/workflow/metrics';
const VERSION_ENDPOINT = '/workflow/version';
const VARIABLE_ENDPOINT = '/workflow/variable';
const EDITOR_ENDPOINT = '/workflow/editor';

/**
 * Repository for managing workflow engine operations.
 *
 * Sub-objects: workflow, execution, metrics, version, variable, editor
 */
export function workflowRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  // Standard CRUD for workflow entity
  const workflowCrud = repo.entity<
    Workflow,
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowApiOptions
  >(WORKFLOW_ENDPOINT, fetch);

  // Standard CRUD for variables (save = create/update via POST)
  const variableBase = repo.entityBase<WorkflowVariable>(
    VARIABLE_ENDPOINT,
    fetch,
  );

  return {
    /**
     * Workflow CRUD + validate
     */
    workflow: {
      ...workflowCrud,

      async validate(id: string): Promise<WorkflowValidationResult> {
        return await fetch<WorkflowValidationResult>(
          `${WORKFLOW_ENDPOINT}/${id}/validate`,
          { method: 'POST' },
        );
      },
    },

    /**
     * Execution management — start, cancel, pause, resume, replay, bulk ops, logs
     */
    execution: {
      async list(
        options?: WorkflowExecutionApiOptions,
      ): Promise<WorkflowExecution[]> {
        return await fetch<WorkflowExecution[]>(`${EXECUTION_ENDPOINT}/list`, {
          query: buildQueryObject(options),
        });
      },

      async listFailed(
        options?: WorkflowExecutionApiOptions,
      ): Promise<WorkflowExecution[]> {
        return await fetch<WorkflowExecution[]>(
          `${EXECUTION_ENDPOINT}/failed`,
          {
            query: buildQueryObject(options),
          },
        );
      },

      async get(
        id: string,
        options?: WorkflowExecutionApiOptions,
      ): Promise<WorkflowExecution> {
        return await fetch<WorkflowExecution>(`${EXECUTION_ENDPOINT}/${id}`, {
          query: buildQueryObject(options),
        });
      },

      async start(
        workflowId: string,
        data?: WorkflowExecutionStartRequest,
      ): Promise<WorkflowExecution> {
        return await fetch<WorkflowExecution>(
          `${EXECUTION_ENDPOINT}/${workflowId}/start`,
          {
            method: 'POST',
            body: data,
          },
        );
      },

      async cancel(id: string): Promise<void> {
        await fetch<null>(`${EXECUTION_ENDPOINT}/${id}/cancel`, {
          method: 'POST',
        });
      },

      async pause(id: string): Promise<void> {
        await fetch<null>(`${EXECUTION_ENDPOINT}/${id}/pause`, {
          method: 'POST',
        });
      },

      async resume(id: string): Promise<void> {
        await fetch<null>(`${EXECUTION_ENDPOINT}/${id}/resume`, {
          method: 'POST',
        });
      },

      async replay(id: string): Promise<WorkflowExecution> {
        return await fetch<WorkflowExecution>(
          `${EXECUTION_ENDPOINT}/${id}/replay`,
          { method: 'POST' },
        );
      },

      async bulkCancel(ids: string[]): Promise<void> {
        await fetch<null>(`${EXECUTION_ENDPOINT}/bulk/cancel`, {
          method: 'POST',
          body: { ids },
        });
      },

      async bulkReplayFailed(workflowId: string): Promise<void> {
        await fetch<null>(
          `${EXECUTION_ENDPOINT}/${workflowId}/bulk/replay-failed`,
          { method: 'POST' },
        );
      },

      async getLog(
        id: string,
        stepId: string,
      ): Promise<WorkflowExecutionLog> {
        return await fetch<WorkflowExecutionLog>(
          `${EXECUTION_ENDPOINT}/${id}/log/${stepId}`,
        );
      },

      async listLogs(id: string): Promise<WorkflowExecutionLog[]> {
        return await fetch<WorkflowExecutionLog[]>(
          `${EXECUTION_ENDPOINT}/${id}/logs`,
        );
      },

      async getReplayChain(id: string): Promise<WorkflowExecution[]> {
        return await fetch<WorkflowExecution[]>(
          `${EXECUTION_ENDPOINT}/${id}/replay-chain`,
        );
      },

      async getConcurrency(
        workflowId: string,
      ): Promise<WorkflowExecutionConcurrency> {
        return await fetch<WorkflowExecutionConcurrency>(
          `${EXECUTION_ENDPOINT}/${workflowId}/concurrency`,
        );
      },
    },

    /**
     * Workflow metrics and error summaries
     */
    metrics: {
      async get(workflowId: string): Promise<WorkflowMetrics> {
        return await fetch<WorkflowMetrics>(
          `${METRICS_ENDPOINT}/${workflowId}`,
        );
      },

      async listAll(): Promise<WorkflowMetrics[]> {
        return await fetch<WorkflowMetrics[]>(`${METRICS_ENDPOINT}/list`);
      },

      async getAggregate(): Promise<WorkflowAggregateMetrics> {
        return await fetch<WorkflowAggregateMetrics>(
          `${METRICS_ENDPOINT}/aggregate`,
        );
      },

      async recalculate(workflowId: string): Promise<void> {
        await fetch<null>(`${METRICS_ENDPOINT}/${workflowId}/recalculate`, {
          method: 'POST',
        });
      },

      async getErrorSummary(workflowId: string): Promise<WorkflowErrorSummary[]> {
        return await fetch<WorkflowErrorSummary[]>(
          `${METRICS_ENDPOINT}/${workflowId}/errors`,
        );
      },
    },

    /**
     * Version history and comparison
     */
    version: {
      async getHistory(workflowId: string): Promise<WorkflowVersion[]> {
        return await fetch<WorkflowVersion[]>(
          `${VERSION_ENDPOINT}/${workflowId}/history`,
        );
      },

      async get(
        workflowId: string,
        version: number,
      ): Promise<WorkflowVersion> {
        return await fetch<WorkflowVersion>(
          `${VERSION_ENDPOINT}/${workflowId}/${version}`,
        );
      },

      async compare(
        workflowId: string,
        fromVersion: number,
        toVersion: number,
      ): Promise<WorkflowVersionComparison> {
        return await fetch<WorkflowVersionComparison>(
          `${VERSION_ENDPOINT}/${workflowId}/compare`,
          {
            query: { from: fromVersion, to: toVersion },
          },
        );
      },
    },

    /**
     * Workflow variables — CRUD with secret support
     */
    variable: {
      ...variableBase,

      async save(data: WorkflowVariableCreate): Promise<WorkflowVariable> {
        return await fetch<WorkflowVariable>(VARIABLE_ENDPOINT, {
          method: 'POST',
          body: data,
        });
      },

      async delete(id: string): Promise<void> {
        await fetch<null>(`${VARIABLE_ENDPOINT}/${id}`, {
          method: 'DELETE',
        });
      },
    },

    /**
     * Editor manifest and action catalog
     */
    editor: {
      async getManifest(): Promise<WorkflowEditorManifest> {
        return await fetch<WorkflowEditorManifest>(
          `${EDITOR_ENDPOINT}/manifest`,
        );
      },

      async listActions(): Promise<WorkflowAction[]> {
        return await fetch<WorkflowAction[]>(`${EDITOR_ENDPOINT}/actions`);
      },
    },
  };
}
