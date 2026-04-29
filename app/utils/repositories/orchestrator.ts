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
  WorkflowMetrics,
  WorkflowMetricsListResponse,
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
} from '#shared/types';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE = '/orchestrator';
const WORKFLOW_ENDPOINT = `${BASE}/workflows`;
const EXECUTION_ENDPOINT = `${BASE}/executions`;
const METRICS_ENDPOINT = `${BASE}/workflows/metrics`;
const VARIABLE_ENDPOINT = `${BASE}/variables`;
const MANIFEST_ENDPOINT = `${BASE}/manifest`;

export function orchestratorRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  return {
    // -- Workflow CRUD ------------------------------------------------------

    workflow: {
      async list(): Promise<WorkflowSummary[]> {
        const res = await fetch<{ workflows: WorkflowSummary[] }>(WORKFLOW_ENDPOINT);
        return res?.workflows ?? [];
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
          `${WORKFLOW_ENDPOINT}/${workflowId}/execute`,
          {
            method: 'GET',
            body: data ?? {},
          },
        );
      },

      async cancel(
        executionId: string,
        data?: CancelExecutionRequest,
      ): Promise<void> {
        await fetch<null>(
          `${EXECUTION_ENDPOINT}/${executionId}/cancel`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
      },

      async pause(
        executionId: string,
        data?: PauseExecutionRequest,
      ): Promise<void> {
        await fetch<null>(
          `${EXECUTION_ENDPOINT}/${executionId}/pause`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
      },

      async resume(
        executionId: string,
        data?: ResumeExecutionRequest,
      ): Promise<void> {
        await fetch<null>(
          `${EXECUTION_ENDPOINT}/${executionId}/resume`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
      },

      async replay(
        executionId: string,
        data?: ReplayExecutionRequest,
      ): Promise<StartWorkflowResponse> {
        return await fetch<StartWorkflowResponse>(
          `${EXECUTION_ENDPOINT}/${executionId}/replay`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
      },

      async bulkCancel(data: BulkCancelRequest): Promise<BulkCancelResponse> {
        return await fetch<BulkCancelResponse>(
          `${EXECUTION_ENDPOINT}/bulk-cancel`,
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
          `${EXECUTION_ENDPOINT}/bulk-replay`,
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
          `${EXECUTION_ENDPOINT}/logs`,
          { query: options },
        );
      },

      async get(executionId: string): Promise<ExecutionDetails> {
        return await fetch<ExecutionDetails>(
          `${EXECUTION_ENDPOINT}/${executionId}`,
        );
      },

      async getReplayChain(executionId: string): Promise<ReplayChain> {
        return await fetch<ReplayChain>(
          `${EXECUTION_ENDPOINT}/${executionId}/replay-chain`,
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

      async list(): Promise<WorkflowMetrics[]> {
        const res = await fetch<WorkflowMetricsListResponse>(METRICS_ENDPOINT);
        return res?.workflows ?? [];
      },

      async getAggregate(): Promise<AggregateMetrics> {
        return await fetch<AggregateMetrics>(`${METRICS_ENDPOINT}/aggregate`);
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
          `${EXECUTION_ENDPOINT}/errors`,
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
        from: number,
        to: number,
      ): Promise<VersionComparison> {
        return await fetch<VersionComparison>(
          `${WORKFLOW_ENDPOINT}/${workflowId}/version/diff`,
          { query: { from, to } },
        );
      },
    },

    // -- Variables -----------------------------------------------------------

    variable: {
      async list(): Promise<WorkflowVariable[]> {
        return await fetch<WorkflowVariable[]>(VARIABLE_ENDPOINT);
      },

      async get(key: string): Promise<WorkflowVariable> {
        return await fetch<WorkflowVariable>(`${VARIABLE_ENDPOINT}/${key}`);
      },

      async save(data: SaveVariableRequest): Promise<WorkflowVariable> {
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

    // -- Editor Manifest ----------------------------------------------------

    editor: {
      async getManifest(): Promise<EditorManifest> {
        return await fetch<EditorManifest>(MANIFEST_ENDPOINT);
      },
    },
  };
}
