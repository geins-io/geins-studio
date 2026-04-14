import type {
  WorkflowSummary,
  WorkflowDefinition,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  ValidateWorkflowResult,
  ExecutionLog,
  ExecutionDetails,
  ExecutionDetailsResponse,
  BulkEnableDisableRequest,
  BulkWorkflowOperationResponse,
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

function toCamelKey(key: string): string {
  return key.charAt(0).toLowerCase() + key.slice(1);
}

function normalizeKeys<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((v) => normalizeKeys(v)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[toCamelKey(k)] = normalizeKeys(v);
    }
    return out as T;
  }
  return value as T;
}
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
        const res = await fetch<WorkflowSummary[] | { workflows?: WorkflowSummary[]; items?: WorkflowSummary[] }>(WORKFLOW_ENDPOINT);
        if (Array.isArray(res)) return res;
        return res?.workflows ?? res?.items ?? [];
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

      async listExecutions(id: string, options?: ListExecutionLogsOptions): Promise<ExecutionLog[]> {
        return await fetch<ExecutionLog[]>(`${WORKFLOW_ENDPOINT}/${id}/logs`, { query: options });
      },

      async enable(id: string): Promise<void> {
        await fetch<null>(`${WORKFLOW_ENDPOINT}/${id}/enable`, { method: 'POST' });
      },

      async disable(id: string): Promise<void> {
        await fetch<null>(`${WORKFLOW_ENDPOINT}/${id}/disable`, { method: 'POST' });
      },

      async bulkEnable(workflowIds: string[]): Promise<BulkWorkflowOperationResponse> {
        const raw = await fetch<unknown>(`${WORKFLOW_ENDPOINT}/bulk-enable`, {
          method: 'POST',
          body: { workflowIds } satisfies BulkEnableDisableRequest,
        });
        const { geinsLog } = useGeinsLog('orchestratorRepo.bulkEnable');
        geinsLog('raw response', raw);
        return normalizeKeys<BulkWorkflowOperationResponse>(raw);
      },

      async bulkDisable(workflowIds: string[]): Promise<BulkWorkflowOperationResponse> {
        const raw = await fetch<unknown>(`${WORKFLOW_ENDPOINT}/bulk-disable`, {
          method: 'POST',
          body: { workflowIds } satisfies BulkEnableDisableRequest,
        });
        const { geinsLog } = useGeinsLog('orchestratorRepo.bulkDisable');
        geinsLog('raw response', raw);
        return normalizeKeys<BulkWorkflowOperationResponse>(raw);
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
        const raw = await fetch<unknown>(
          `${EXECUTION_ENDPOINT}/${executionId}/replay`,
          {
            method: 'POST',
            body: data ?? {},
          },
        );
        return normalizeKeys<StartWorkflowResponse>(raw);
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

      async list(
        options?: ListExecutionLogsOptions,
      ): Promise<ExecutionLog[]> {
        const url = options?.workflowId
          ? `${WORKFLOW_ENDPOINT}/${options.workflowId}/logs`
          : `${EXECUTION_ENDPOINT}/logs`;

        const res = await fetch<unknown>(url, { query: options });

        const raw = Array.isArray(res)
          ? res
          : (res as { logs?: unknown[]; executions?: unknown[]; items?: unknown[] })?.logs
            ?? (res as { executions?: unknown[] })?.executions
            ?? (res as { items?: unknown[] })?.items
            ?? [];

        return normalizeKeys<ExecutionLog[]>(raw);
      },

      async get(executionId: string): Promise<ExecutionDetailsResponse> {
        const raw = await fetch<unknown>(`${EXECUTION_ENDPOINT}/${executionId}`);
        return normalizeKeys<ExecutionDetailsResponse>(raw);
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
        const res = await fetch<WorkflowMetrics[] | (WorkflowMetricsListResponse & { items?: WorkflowMetrics[] })>(METRICS_ENDPOINT);
        if (Array.isArray(res)) return res;
        return res?.workflows ?? res?.items ?? [];
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
        const res = await fetch<unknown>(VARIABLE_ENDPOINT);
        const raw = Array.isArray(res)
          ? res
          : (res as { variables?: unknown[]; items?: unknown[] })?.variables
            ?? (res as { items?: unknown[] })?.items
            ?? [];
        return normalizeKeys<WorkflowVariable[]>(raw);
      },

      async get(key: string): Promise<WorkflowVariable> {
        const raw = await fetch<unknown>(`${VARIABLE_ENDPOINT}/${encodeURIComponent(key)}`);
        return normalizeKeys<WorkflowVariable>(raw);
      },

      async save(data: SaveVariableRequest): Promise<WorkflowVariable> {
        const raw = await fetch<unknown>(VARIABLE_ENDPOINT, {
          method: 'POST',
          body: data,
        });
        return normalizeKeys<WorkflowVariable>(raw);
      },

      async delete(key: string): Promise<void> {
        await fetch<null>(`${VARIABLE_ENDPOINT}/${encodeURIComponent(key)}`, {
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
