import type {
  WorkflowSummary,
  WorkflowDefinition,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ValidateWorkflowResult,
  ExecutionLog,
  ExecutionDetails,
  ReplayChain,
  ConcurrencyState,
  StartWorkflowRequest,
  StartWorkflowResponse,
  CancelExecutionRequest,
  PauseExecutionRequest,
  ResumeExecutionRequest,
  ReplayExecutionRequest,
  BulkCancelRequest,
  BulkCancelResponse,
  BulkReplayFailedRequest,
  BulkReplayFailedResponse,
  ListExecutionLogsOptions,
  ListWorkflowExecutionsOptions,
  ListFailedExecutionsOptions,
  WorkflowMetrics,
  WorkflowMetricsOptions,
  AggregateMetrics,
  ErrorSummary,
  ErrorSummaryOptions,
  WorkflowHistory,
  WorkflowHistoryOptions,
  VersionComparison,
  WorkflowVariable,
  SaveVariableRequest,
  EditorManifest,
  WorkflowAction,
} from '#shared/types';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const WORKFLOW_ENDPOINT = '/workflow';

export function workflowRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  return {
    // -- Workflow CRUD ------------------------------------------------------

    workflow: {
      async list(): Promise<WorkflowSummary[]> {
        return await fetch<WorkflowSummary[]>(WORKFLOW_ENDPOINT);
      },

      async get(id: string): Promise<WorkflowDefinition> {
        return await fetch<WorkflowDefinition>(`${WORKFLOW_ENDPOINT}/${id}`);
      },

      async create(data: CreateWorkflowRequest): Promise<WorkflowDefinition> {
        return await fetch<WorkflowDefinition>(WORKFLOW_ENDPOINT, {
          method: 'POST',
          body: data,
        });
      },

      async update(
        id: string,
        data: UpdateWorkflowRequest,
      ): Promise<WorkflowDefinition> {
        return await fetch<WorkflowDefinition>(`${WORKFLOW_ENDPOINT}/${id}`, {
          method: 'PUT',
          body: data,
        });
      },

      async delete(id: string): Promise<void> {
        await fetch<null>(`${WORKFLOW_ENDPOINT}/${id}`, {
          method: 'DELETE',
        });
      },

      async validate(data: CreateWorkflowRequest): Promise<ValidateWorkflowResult> {
        return await fetch<ValidateWorkflowResult>(
          `${WORKFLOW_ENDPOINT}/validate`,
          {
            method: 'POST',
            body: data,
          },
        );
      },
    },

    // -- Executions ---------------------------------------------------------

    execution: {
      async start(
        workflowId: string,
        data?: StartWorkflowRequest,
      ): Promise<StartWorkflowResponse> {
        return await fetch<StartWorkflowResponse>(
          `${WORKFLOW_ENDPOINT}/${workflowId}/start`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
      },

      async cancel(
        instanceId: string,
        data?: CancelExecutionRequest,
      ): Promise<void> {
        await fetch<null>(
          `${WORKFLOW_ENDPOINT}/execution/${instanceId}/cancel`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
      },

      async pause(
        instanceId: string,
        data?: PauseExecutionRequest,
      ): Promise<void> {
        await fetch<null>(
          `${WORKFLOW_ENDPOINT}/execution/${instanceId}/pause`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
      },

      async resume(
        instanceId: string,
        data?: ResumeExecutionRequest,
      ): Promise<void> {
        await fetch<null>(
          `${WORKFLOW_ENDPOINT}/execution/${instanceId}/resume`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
      },

      async replay(
        instanceId: string,
        data?: ReplayExecutionRequest,
      ): Promise<StartWorkflowResponse> {
        return await fetch<StartWorkflowResponse>(
          `${WORKFLOW_ENDPOINT}/execution/${instanceId}/replay`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
      },

      async bulkCancel(data: BulkCancelRequest): Promise<BulkCancelResponse> {
        return await fetch<BulkCancelResponse>(
          `${WORKFLOW_ENDPOINT}/execution/bulk-cancel`,
          {
            method: 'POST',
            body: data,
          },
        );
      },

      async bulkReplayFailed(
        data: BulkReplayFailedRequest,
      ): Promise<BulkReplayFailedResponse> {
        return await fetch<BulkReplayFailedResponse>(
          `${WORKFLOW_ENDPOINT}/execution/bulk-replay`,
          {
            method: 'POST',
            body: data,
          },
        );
      },

      async listLogs(
        options?: ListExecutionLogsOptions,
      ): Promise<ExecutionLog[]> {
        return await fetch<ExecutionLog[]>(
          `${WORKFLOW_ENDPOINT}/execution`,
          { query: options },
        );
      },

      async listForWorkflow(
        workflowId: string,
        options?: ListWorkflowExecutionsOptions,
      ): Promise<ExecutionLog[]> {
        return await fetch<ExecutionLog[]>(
          `${WORKFLOW_ENDPOINT}/${workflowId}/execution`,
          { query: options },
        );
      },

      async listFailed(
        options?: ListFailedExecutionsOptions,
      ): Promise<ExecutionLog[]> {
        return await fetch<ExecutionLog[]>(
          `${WORKFLOW_ENDPOINT}/execution/failed`,
          { query: options },
        );
      },

      async get(instanceId: string): Promise<ExecutionDetails> {
        return await fetch<ExecutionDetails>(
          `${WORKFLOW_ENDPOINT}/execution/${instanceId}`,
        );
      },

      async getLog(instanceId: string): Promise<ExecutionLog> {
        return await fetch<ExecutionLog>(
          `${WORKFLOW_ENDPOINT}/execution/${instanceId}/log`,
        );
      },

      async getReplayChain(instanceId: string): Promise<ReplayChain> {
        return await fetch<ReplayChain>(
          `${WORKFLOW_ENDPOINT}/execution/${instanceId}/replay-chain`,
        );
      },

      async getConcurrency(workflowId: string): Promise<ConcurrencyState> {
        return await fetch<ConcurrencyState>(
          `${WORKFLOW_ENDPOINT}/${workflowId}/concurrency`,
        );
      },
    },

    // -- Metrics ------------------------------------------------------------

    metrics: {
      async get(
        workflowId: string,
        options?: WorkflowMetricsOptions,
      ): Promise<WorkflowMetrics> {
        return await fetch<WorkflowMetrics>(
          `${WORKFLOW_ENDPOINT}/${workflowId}/metrics`,
          { query: options },
        );
      },

      async listAll(): Promise<WorkflowMetrics[]> {
        return await fetch<WorkflowMetrics[]>(
          `${WORKFLOW_ENDPOINT}/metrics`,
        );
      },

      async getAggregate(): Promise<AggregateMetrics> {
        return await fetch<AggregateMetrics>(
          `${WORKFLOW_ENDPOINT}/metrics/aggregate`,
        );
      },

      async recalculate(workflowId: string): Promise<void> {
        await fetch<null>(
          `${WORKFLOW_ENDPOINT}/${workflowId}/metrics/recalculate`,
          { method: 'POST' },
        );
      },

      async getErrorSummary(
        options?: ErrorSummaryOptions,
      ): Promise<ErrorSummary> {
        return await fetch<ErrorSummary>(
          `${WORKFLOW_ENDPOINT}/metrics/errors`,
          { query: options },
        );
      },
    },

    // -- Versioning ---------------------------------------------------------

    version: {
      async getHistory(
        workflowId: string,
        options?: WorkflowHistoryOptions,
      ): Promise<WorkflowHistory> {
        return await fetch<WorkflowHistory>(
          `${WORKFLOW_ENDPOINT}/${workflowId}/history`,
          { query: options },
        );
      },

      async get(
        workflowId: string,
        version: number,
      ): Promise<WorkflowDefinition> {
        return await fetch<WorkflowDefinition>(
          `${WORKFLOW_ENDPOINT}/${workflowId}/version/${version}`,
        );
      },

      async compare(
        workflowId: string,
        fromVersion: number,
        toVersion: number,
      ): Promise<VersionComparison> {
        return await fetch<VersionComparison>(
          `${WORKFLOW_ENDPOINT}/${workflowId}/version/compare`,
          { query: { fromVersion, toVersion } },
        );
      },
    },

    // -- Variables -----------------------------------------------------------

    variable: {
      async list(): Promise<WorkflowVariable[]> {
        return await fetch<WorkflowVariable[]>(
          `${WORKFLOW_ENDPOINT}/variable`,
        );
      },

      async get(key: string): Promise<WorkflowVariable> {
        return await fetch<WorkflowVariable>(
          `${WORKFLOW_ENDPOINT}/variable/${key}`,
        );
      },

      async save(data: SaveVariableRequest): Promise<WorkflowVariable> {
        return await fetch<WorkflowVariable>(
          `${WORKFLOW_ENDPOINT}/variable`,
          {
            method: 'PUT',
            body: data,
          },
        );
      },

      async delete(key: string): Promise<void> {
        await fetch<null>(`${WORKFLOW_ENDPOINT}/variable/${key}`, {
          method: 'DELETE',
        });
      },
    },

    // -- Editor Manifest ----------------------------------------------------

    editor: {
      async getManifest(): Promise<EditorManifest> {
        return await fetch<EditorManifest>(
          `${WORKFLOW_ENDPOINT}/editor/manifest`,
        );
      },

      async listActions(): Promise<WorkflowAction[]> {
        return await fetch<WorkflowAction[]>(
          `${WORKFLOW_ENDPOINT}/editor/actions`,
        );
      },
    },
  };
}
