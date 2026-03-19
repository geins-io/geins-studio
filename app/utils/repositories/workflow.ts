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
const WORKFLOW_DEFINITION_ENDPOINT = '/workflow/definition';
const METRIC_ENDPOINT = '/workflow/metric';
const VARIABLE_ENDPOINT = '/workflow/variable';
const EDITOR_ENDPOINT = '/workflow/editor';
const ACTION_ENDPOINT = '/workflow/action';

/**
 * Repository for managing workflow engine operations.
 *
 * Sub-objects: workflow, execution, metrics, version, variable, editor
 */
export function workflowRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  return {
    /**
     * Workflow CRUD + validate
     */
    workflow: {
      async list(options?: WorkflowApiOptions): Promise<Workflow[]> {
        return await fetch<Workflow[]>(WORKFLOW_DEFINITION_ENDPOINT, {
          query: buildQueryObject(options),
        });
      },

      async get(id: string, options?: WorkflowApiOptions): Promise<Workflow> {
        return await fetch<Workflow>(`${WORKFLOW_DEFINITION_ENDPOINT}/${id}`, {
          query: buildQueryObject(options),
        });
      },

      async create(data: WorkflowCreate, options?: WorkflowApiOptions): Promise<Workflow> {
        return await fetch<Workflow>(WORKFLOW_DEFINITION_ENDPOINT, {
          method: 'POST',
          body: data,
          query: buildQueryObject(options),
        });
      },

      async update(
        id: string,
        data: WorkflowUpdate,
        options?: WorkflowApiOptions,
      ): Promise<Workflow> {
        return await fetch<Workflow>(`${WORKFLOW_DEFINITION_ENDPOINT}/${id}`, {
          method: 'PUT',
          body: data,
          query: buildQueryObject(options),
        });
      },

      async delete(id: string): Promise<void> {
        await fetch<null>(`${WORKFLOW_DEFINITION_ENDPOINT}/${id}`, {
          method: 'DELETE',
        });
      },

      async validate(data: WorkflowCreate): Promise<WorkflowValidationResult> {
        return await fetch<WorkflowValidationResult>(
          `${WORKFLOW_DEFINITION_ENDPOINT}/validate`,
          {
            method: 'POST',
            body: data,
          },
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
        return await fetch<WorkflowExecution[]>(`${EXECUTION_ENDPOINT}/logs`, {
          query: buildQueryObject(options),
        });
      },

      async listFailed(
        options?: WorkflowExecutionApiOptions,
      ): Promise<WorkflowExecution[]> {
        return await fetch<WorkflowExecution[]>(
          `${EXECUTION_ENDPOINT}/errors`,
          {
            query: buildQueryObject(options),
          },
        );
      },

      async get(
        id: string,
        options?: WorkflowExecutionApiOptions,
      ): Promise<WorkflowExecution> {
        return await fetch<WorkflowExecution>(`${EXECUTION_ENDPOINT}/details`, {
          query: { instanceId: id, ...buildQueryObject(options) },
        });
      },

      async start(
        workflowId: string,
        data?: WorkflowExecutionStartRequest,
      ): Promise<WorkflowExecution> {
        return await fetch<WorkflowExecution>(
          `${WORKFLOW_DEFINITION_ENDPOINT}/${workflowId}/execute`,
          {
            method: 'GET',
            body: data,
          },
        );
      },

      async cancel(id: string): Promise<void> {
        await fetch<null>(`${EXECUTION_ENDPOINT}/cancel`, {
          method: 'POST',
          body: { instanceId: id },
        });
      },

      async pause(id: string): Promise<void> {
        await fetch<null>(`${EXECUTION_ENDPOINT}/pause`, {
          method: 'POST',
          body: { instanceId: id },
        });
      },

      async resume(id: string): Promise<void> {
        await fetch<null>(`${EXECUTION_ENDPOINT}/resume`, {
          method: 'POST',
          body: { instanceId: id },
        });
      },

      async replay(id: string): Promise<WorkflowExecution> {
        return await fetch<WorkflowExecution>(
          `${EXECUTION_ENDPOINT}/replay`,
          {
            method: 'POST',
            body: { originalInstanceId: id },
          },
        );
      },

      async bulkCancel(ids: string[]): Promise<void> {
        await fetch<null>(`${EXECUTION_ENDPOINT}/bulk-cancel`, {
          method: 'POST',
          body: { instanceIds: ids },
        });
      },

      async bulkReplayFailed(workflowId: string): Promise<void> {
        await fetch<null>(`${EXECUTION_ENDPOINT}/bulk-replay`, {
          method: 'POST',
          body: { workflowId },
        });
      },

      async getLog(
        id: string,
        stepId: string,
      ): Promise<WorkflowExecutionLog> {
        const logs = await fetch<WorkflowExecutionLog[]>(`${EXECUTION_ENDPOINT}/logs`, {
          query: { instanceId: id },
        });
        return (
          logs.find((log) => log.stepId === stepId) ??
          ({
            stepId,
            stepName: '',
            status: '',
            startedAt: '',
          } as WorkflowExecutionLog)
        );
      },

      async listLogs(id: string): Promise<WorkflowExecutionLog[]> {
        return await fetch<WorkflowExecutionLog[]>(
          `${EXECUTION_ENDPOINT}/logs`,
          { query: { instanceId: id } },
        );
      },

      async getReplayChain(id: string): Promise<WorkflowExecution[]> {
        return await fetch<WorkflowExecution[]>(
          `${EXECUTION_ENDPOINT}/replay-chain`,
          { query: { instanceId: id } },
        );
      },

      async getConcurrency(
        workflowId: string,
      ): Promise<WorkflowExecutionConcurrency> {
        return await fetch<WorkflowExecutionConcurrency>(
          `${WORKFLOW_ENDPOINT}/${workflowId}/concurrency`,
        );
      },
    },

    /**
     * Workflow metrics and error summaries
     */
    metrics: {
      async get(workflowId: string): Promise<WorkflowMetrics> {
        return await fetch<WorkflowMetrics>(
          `${WORKFLOW_DEFINITION_ENDPOINT}/${workflowId}/metric`,
        );
      },

      async listAll(): Promise<WorkflowMetrics[]> {
        return await fetch<WorkflowMetrics[]>(METRIC_ENDPOINT);
      },

      async getAggregate(): Promise<WorkflowAggregateMetrics> {
        return await fetch<WorkflowAggregateMetrics>(
          `${METRIC_ENDPOINT}/aggregate`,
        );
      },

      async recalculate(workflowId: string): Promise<void> {
        await fetch<null>(`${WORKFLOW_DEFINITION_ENDPOINT}/${workflowId}/metric/recalculate`, {
          method: 'POST',
        });
      },

      async getErrorSummary(workflowId: string): Promise<WorkflowErrorSummary[]> {
        return await fetch<WorkflowErrorSummary[]>(
          `${EXECUTION_ENDPOINT}/errors`,
          { query: { workflowId } },
        );
      },
    },

    /**
     * Version history and comparison
     */
    version: {
      async getHistory(workflowId: string): Promise<WorkflowVersion[]> {
        return await fetch<WorkflowVersion[]>(
          `${WORKFLOW_DEFINITION_ENDPOINT}/${workflowId}/history`,
        );
      },

      async get(
        workflowId: string,
        version: number,
      ): Promise<WorkflowVersion> {
        return await fetch<WorkflowVersion>(
          `${WORKFLOW_DEFINITION_ENDPOINT}/${workflowId}/version/${version}`,
        );
      },

      async compare(
        workflowId: string,
        fromVersion: number,
        toVersion: number,
      ): Promise<WorkflowVersionComparison> {
        return await fetch<WorkflowVersionComparison>(
          `${WORKFLOW_DEFINITION_ENDPOINT}/${workflowId}/version/diff`,
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
      async list(): Promise<WorkflowVariable[]> {
        return await fetch<WorkflowVariable[]>(VARIABLE_ENDPOINT);
      },

      async get(key: string): Promise<WorkflowVariable> {
        return await fetch<WorkflowVariable>(`${VARIABLE_ENDPOINT}/${key}`);
      },

      async save(data: WorkflowVariableCreate): Promise<WorkflowVariable> {
        return await fetch<WorkflowVariable>(VARIABLE_ENDPOINT, {
          method: 'POST',
          body: data,
        });
      },

      async delete(key: string): Promise<void> {
        await fetch<null>(`${VARIABLE_ENDPOINT}/${key}`, {
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
        return await fetch<WorkflowAction[]>(ACTION_ENDPOINT);
      },
    },
  };
}
