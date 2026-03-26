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

// todo: under renaming
// const ORCHESTRATOR_ENDPOINT = '/orchestrator';
const ORCHESTRATOR_ENDPOINT = '/workflow';
const ORCHESTRATOR_ENDPOINT_LIST = `${ORCHESTRATOR_ENDPOINT}/metric`;

export function orchestratorRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  return {
    // -- Workflow CRUD ------------------------------------------------------

    workflow: {
      async list(): Promise<WorkflowSummary[]> {     
        return await fetch<WorkflowSummary[]>(ORCHESTRATOR_ENDPOINT_LIST);
      },

      async get(id: string): Promise<WorkflowDefinition> {
        return await fetch<WorkflowDefinition>(`${ORCHESTRATOR_ENDPOINT}/${id}`);
      },

      async create(data: CreateWorkflowRequest): Promise<WorkflowDefinition> {
        return await fetch<WorkflowDefinition>(ORCHESTRATOR_ENDPOINT, {
          method: 'POST',
          body: data,
        });
      },

      async update(
        id: string,
        data: UpdateWorkflowRequest,
      ): Promise<WorkflowDefinition> {
        return await fetch<WorkflowDefinition>(`${ORCHESTRATOR_ENDPOINT}/${id}`, {
          method: 'PUT',
          body: data,
        });
      },

      async delete(id: string): Promise<void> {
        await fetch<null>(`${ORCHESTRATOR_ENDPOINT}/${id}`, {
          method: 'DELETE',
        });
      },

      async validate(data: CreateWorkflowRequest): Promise<ValidateWorkflowResult> {
        return await fetch<ValidateWorkflowResult>(
          `${ORCHESTRATOR_ENDPOINT}/validate`,
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
          `${ORCHESTRATOR_ENDPOINT}/${workflowId}/start`,
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
          `${ORCHESTRATOR_ENDPOINT}/execution/${instanceId}/cancel`,
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
          `${ORCHESTRATOR_ENDPOINT}/execution/${instanceId}/pause`,
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
          `${ORCHESTRATOR_ENDPOINT}/execution/${instanceId}/resume`,
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
          `${ORCHESTRATOR_ENDPOINT}/execution/${instanceId}/replay`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
      },

      async bulkCancel(data: BulkCancelRequest): Promise<BulkCancelResponse> {
        return await fetch<BulkCancelResponse>(
          `${ORCHESTRATOR_ENDPOINT}/execution/bulk-cancel`,
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
          `${ORCHESTRATOR_ENDPOINT}/execution/bulk-replay`,
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
          `${ORCHESTRATOR_ENDPOINT}/execution`,
          { query: options },
        );
      },

      async listForWorkflow(
        workflowId: string,
        options?: ListWorkflowExecutionsOptions,
      ): Promise<ExecutionLog[]> {
        return await fetch<ExecutionLog[]>(
          `${ORCHESTRATOR_ENDPOINT}/${workflowId}/execution`,
          { query: options },
        );
      },

      async listFailed(
        options?: ListFailedExecutionsOptions,
      ): Promise<ExecutionLog[]> {
        return await fetch<ExecutionLog[]>(
          `${ORCHESTRATOR_ENDPOINT}/execution/failed`,
          { query: options },
        );
      },

      async get(instanceId: string): Promise<ExecutionDetails> {
        return await fetch<ExecutionDetails>(
          `${ORCHESTRATOR_ENDPOINT}/execution/${instanceId}`,
        );
      },

      async getLog(instanceId: string): Promise<ExecutionLog> {
        return await fetch<ExecutionLog>(
          `${ORCHESTRATOR_ENDPOINT}/execution/${instanceId}/log`,
        );
      },

      async getReplayChain(instanceId: string): Promise<ReplayChain> {
        return await fetch<ReplayChain>(
          `${ORCHESTRATOR_ENDPOINT}/execution/${instanceId}/replay-chain`,
        );
      },

      async getConcurrency(workflowId: string): Promise<ConcurrencyState> {
        return await fetch<ConcurrencyState>(
          `${ORCHESTRATOR_ENDPOINT}/${workflowId}/concurrency`,
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
          `${ORCHESTRATOR_ENDPOINT}/${workflowId}/metric`,
          { query: options },
        );
      },

      async list(): Promise<WorkflowMetrics[]> {
        return await fetch<WorkflowMetrics[]>(
          `${ORCHESTRATOR_ENDPOINT}/metric`,
        );
      },

      async getAggregate(): Promise<AggregateMetrics> {
        return await fetch<AggregateMetrics>(
          `${ORCHESTRATOR_ENDPOINT}/metric/aggregate`,
        );
      },

      async recalculate(workflowId: string): Promise<void> {
        await fetch<null>(
          `${ORCHESTRATOR_ENDPOINT}/${workflowId}/metric/recalculate`,
          { method: 'POST' },
        );
      },

      async getErrorSummary(
        options?: ErrorSummaryOptions,
      ): Promise<ErrorSummary> {
        return await fetch<ErrorSummary>(
          `${ORCHESTRATOR_ENDPOINT}/metric/errors`,
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
          `${ORCHESTRATOR_ENDPOINT}/${workflowId}/history`,
          { query: options },
        );
      },

      async get(
        workflowId: string,
        version: number,
      ): Promise<WorkflowDefinition> {
        return await fetch<WorkflowDefinition>(
          `${ORCHESTRATOR_ENDPOINT}/${workflowId}/version/${version}`,
        );
      },

      async compare(
        workflowId: string,
        fromVersion: number,
        toVersion: number,
      ): Promise<VersionComparison> {
        return await fetch<VersionComparison>(
          `${ORCHESTRATOR_ENDPOINT}/${workflowId}/version/compare`,
          { query: { fromVersion, toVersion } },
        );
      },
    },

    // -- Variables -----------------------------------------------------------

    variable: {
      async list(): Promise<WorkflowVariable[]> {
        return await fetch<WorkflowVariable[]>(
          `${ORCHESTRATOR_ENDPOINT}/variable`,
        );
      },

      async get(key: string): Promise<WorkflowVariable> {
        return await fetch<WorkflowVariable>(
          `${ORCHESTRATOR_ENDPOINT}/variable/${key}`,
        );
      },

      async save(data: SaveVariableRequest): Promise<WorkflowVariable> {
        return await fetch<WorkflowVariable>(
          `${ORCHESTRATOR_ENDPOINT}/variable`,
          {
            method: 'PUT',
            body: data,
          },
        );
      },

      async delete(key: string): Promise<void> {
        await fetch<null>(`${ORCHESTRATOR_ENDPOINT}/variable/${key}`, {
          method: 'DELETE',
        });
      },
    },

    // -- Editor Manifest ----------------------------------------------------

    editor: {
      async getManifest(): Promise<EditorManifest> {
        return await fetch<EditorManifest>(
          `${ORCHESTRATOR_ENDPOINT}/editor/manifest`,
        );
      },

      async listActions(): Promise<WorkflowAction[]> {
        return await fetch<WorkflowAction[]>(
          `${ORCHESTRATOR_ENDPOINT}/editor/actions`,
        );
      },
    },
  };
}
