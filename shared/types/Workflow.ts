import type { ApiOptions } from './Api';
import type { CreateEntity, UpdateEntity, ResponseEntity } from './Global';

// ---------------------------------------------------------------------------
// Workflow Engine Types (Orchestrator)
// ---------------------------------------------------------------------------

// -- Enums ------------------------------------------------------------------

export type WorkflowType = 'onDemand' | 'scheduled' | 'event';

export type ExecutionStatus =
  | 'Running'
  | 'Completed'
  | 'Failed'
  | 'Canceled'
  | 'TimedOut'
  | 'Suspended'
  | 'Pending'
  | 'ContinuedAsNew'
  | 'Terminated';

export type HealthStatus =
  | 'Healthy'
  | 'Degraded'
  | 'Unhealthy'
  | 'Disabled'
  | 'Unknown';

export type ConnectionType = 'sequential' | 'conditional' | 'parallel';

export type WorkflowNodeType =
  | 'Action'
  | 'Condition'
  | 'Iterator'
  | 'Delay'
  | 'Trigger'
  | 'Workflow';

// -- Workflow Definition ----------------------------------------------------

export interface WorkflowTrigger {
  enabled: boolean;
  type: WorkflowType;
  cron?: string;
  entity?: string;
  action?: string;
  subEntity?: string;
  eventFilters?: Record<string, unknown>;
  timeWindow?: string;
}

export interface WorkflowNodeConnection {
  sourceNodeId: string;
  targetNodeId: string;
  type: ConnectionType;
  label?: string;
}

export interface WorkflowNodeConfig {
  [key: string]: unknown;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  name?: string;
  actionName?: string;
  config?: WorkflowNodeConfig;
  input?: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface WorkflowInput {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
}

export interface WorkflowSettings {
  maxConcurrency?: number;
  maxQueueDepth?: number;
  timeout?: string;
  timeoutBehavior?: string;
  retryPolicy?: Record<string, unknown>;
  rateLimiting?: Record<string, unknown>;
  circuitBreaker?: Record<string, unknown>;
  logging?: Record<string, unknown>;
  errorHandling?: Record<string, unknown>;
}

export interface WorkflowUiMetadata {
  viewport?: { x: number; y: number; zoom: number };
  [key: string]: unknown;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description?: string;
  type: WorkflowType;
  group?: string;
  tags?: string[];
  /** Whether the workflow trigger is enabled. */
  enabled: boolean;
  /** Cron expression when type is 'scheduled'. */
  cronExpression?: string;
  /** Event name when type is 'event'. */
  eventName?: string;
  nodeCount: number;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowDefinition extends WorkflowSummary {
  input?: WorkflowInput[];
  nodes: WorkflowNode[];
  connections: WorkflowNodeConnection[];
  settings?: WorkflowSettings;
  ui?: WorkflowUiMetadata;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  tags?: string[];
  type?: WorkflowType;
  enabled?: boolean;
  cronExpression?: string;
  eventName?: string;
  input?: WorkflowInput[];
  nodes?: WorkflowNode[];
  connections?: WorkflowNodeConnection[];
  settings?: WorkflowSettings;
  ui?: WorkflowUiMetadata;
}

export interface UpdateWorkflowRequest extends CreateWorkflowRequest {
  name: string;
}

export interface ValidateWorkflowResult {
  valid: boolean;
  errors?: WorkflowValidationError[];
}

export interface WorkflowValidationError {
  message: string;
  nodeId?: string;
  field?: string;
}

// -- Executions -------------------------------------------------------------

export interface ExecutionNodeExecution {
  nodeId: string;
  nodeName?: string;
  nodeType: string;
  activityName?: string | null;
  status: string;
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  retryCount?: number;
  retryErrors?: string[] | null;
  executionOrder?: number;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
}

export interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  group?: string;
  status: string;
  startTime: string;
  endTime?: string | null;
  durationMs?: number | null;
  totalNodes?: number;
  completedNodes?: number;
  failedNodes?: number;
  skippedNodes?: number;
  isScheduled?: boolean;
  triggerType?: string | null;
  startedBy?: string | null;
  cronExpression?: string | null;
  eventName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  workflowVersion?: string | number;
  tags?: string[] | null;
  childExecutionIds?: string[] | null;
  cascadeCancellation?: boolean;
  idempotencyKey?: string | null;
  replayOf?: string | null;
  replayedBy?: string | null;
  replayedAt?: string | null;
  pauseReason?: string | null;
  pausedBy?: string | null;
  pausedAt?: string | null;
  cancelledBy?: string | null;
  cancellationReason?: string | null;
  errors?: string[] | null;
  errorCount?: number;
  isTestRun?: boolean;
  nodeExecutions?: ExecutionNodeExecution[] | null;
}

export interface ExecutionDetailsResponse {
  execution: ExecutionLog;
  orchestrationStatus: string | null;
  canCancel: boolean;
  canPause: boolean;
  canReplay: boolean;
}

export interface ExecutionNodeResult {
  nodeId: string;
  nodeName?: string;
  nodeType: WorkflowNodeType;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionDetails extends ExecutionLog {
  workflowVersion: number;
  parameters?: Record<string, unknown>;
  nodeResults: ExecutionNodeResult[];
  availableActions: string[];
}

export interface ReplayChainEntry {
  instanceId: string;
  status: ExecutionStatus;
  startedAt: string;
  completedAt?: string;
  replayedBy?: string;
  isOriginal: boolean;
}

export interface ReplayChain {
  entries: ReplayChainEntry[];
}

export interface ConcurrencyState {
  workflowId: string;
  runningCount: number;
  maxConcurrency: number;
  queuedCount?: number;
  slotsAcquired?: number;
  slotsRejected?: number;
}

export interface StartWorkflowRequest {
  parameters?: Record<string, unknown>;
  idempotencyKey?: string;
  startedBy?: string;
}

export interface StartWorkflowResponse {
  instanceId: string;
}

export interface CancelExecutionRequest {
  cancelledBy?: string;
  reason?: string;
}

export interface PauseExecutionRequest {
  pausedBy?: string;
  reason?: string;
}

export interface ResumeExecutionRequest {
  resumedBy?: string;
}

export interface ReplayExecutionRequest {
  replayedBy?: string;
}

export interface BulkCancelRequest {
  instanceIds?: string[];
  workflowId?: string;
  cancelledBy?: string;
  reason?: string;
}

export interface BulkCancelResponse {
  cancelledCount: number;
  failedCount?: number;
}

export interface BulkReplayFailedRequest {
  workflowId?: string;
  since?: string;
  maxReplays?: number;
  replayedBy?: string;
}

export interface BulkReplayFailedResponse {
  replayedCount: number;
  skippedCount?: number;
}

export interface ListExecutionLogsOptions {
  status?: ExecutionStatus;
  startedAfter?: string;
  startedBefore?: string;
  limit?: number;
  workflowId?: string;
}

export interface ListWorkflowExecutionsOptions {
  limit?: number;
}

export interface ListFailedExecutionsOptions {
  since?: string;
  limit?: number;
}

// -- Metrics ----------------------------------------------------------------

export interface MetricsWindow {
  windowStart: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  lastSuccessTime: string | null;
  lastFailureTime: string | null;
  successRate: number;
  failureRate: number;
}

export interface WorkflowStatus {
  runningInstances: number;
  lastExecutionStart: string | null;
  lastExecutionEnd: string | null;
  lastExecutionStatus: string | null;
  lastExecutionDurationMs: number;
  lastErrorMessage: string;
  nextScheduledExecution: string | null;
  health: HealthStatus;
}

/** Extends WorkflowSummary with real-time status and pre-computed metric windows. */
export interface WorkflowMetrics extends WorkflowSummary {
  /** Runtime status and last-execution details. */
  status: WorkflowStatus;
  /** Metrics for the last 24 hours. */
  metrics24h: MetricsWindow;
  /** Metrics for the last 7 days. */
  metrics7d: MetricsWindow;
  /** Metrics for the last 30 days. */
  metrics30d: MetricsWindow;
  /** All-time aggregate metrics. */
  metricsAllTime: MetricsWindow;
  /** ISO timestamp of when this metrics record was last refreshed. */
  lastMetricsUpdate: string;
}

export interface WorkflowMetricsOptions {
  startDate?: string;
  endDate?: string;
}

export interface AggregateMetrics {
  workflowCount: number;
  healthSummary: Record<Lowercase<HealthStatus>, number>;
  totalExecutions24h: number;
  totalFailures24h: number;
  overallSuccessRate24h: number;
}

/** Paged envelope returned by GET /orchestrator/workflows/metrics */
export interface WorkflowMetricsListResponse {
  count: number;
  continuationToken: string;
  hasMore: boolean;
  workflows: WorkflowMetrics[];
}

export interface ErrorSummaryEntry {
  workflowId?: string;
  workflowName?: string;
  errorType: string;
  message: string;
  count: number;
  lastOccurrence: string;
}

export interface ErrorSummary {
  entries: ErrorSummaryEntry[];
  totalErrors: number;
}

export interface ErrorSummaryOptions {
  workflowId?: string;
  since?: string;
  limit?: number;
}

// -- Versioning -------------------------------------------------------------

export interface WorkflowVersionEntry {
  version: number;
  createdAt: string;
  createdBy?: string;
  description?: string;
}

export interface WorkflowHistory {
  workflowId: string;
  versions: WorkflowVersionEntry[];
}

export interface WorkflowHistoryOptions {
  limit?: number;
}

export interface VersionDiffChange {
  path: string;
  type: 'added' | 'removed' | 'changed';
  from?: unknown;
  to?: unknown;
}

export interface VersionComparison {
  workflowId: string;
  fromVersion: number;
  toVersion: number;
  changes: VersionDiffChange[];
}

// -- Variables --------------------------------------------------------------

export interface WorkflowVariable {
  key: string;
  value: string;
  description?: string;
  isSecret: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveVariableRequest {
  key: string;
  value?: string;
  description?: string;
  isSecret?: boolean;
}

// -- Editor Manifest --------------------------------------------------------

export interface ManifestNodeTypeConnection {
  allowedTypes: ConnectionType[];
  maxOutgoing?: number;
  labels?: string[];
  customLabels?: boolean;
}

export interface ManifestNodeTypeConfig {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  editorHint?: string;
  description?: string;
}

export interface ManifestNodeType {
  type: WorkflowNodeType;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  connections: ManifestNodeTypeConnection;
  config?: ManifestNodeTypeConfig[];
}

export interface ManifestActionParameter {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: unknown;
  description?: string;
}

export interface ManifestActionOutput {
  name: string;
  type: string;
  description?: string;
}

export interface WorkflowAction {
  name: string;
  displayName: string;
  description?: string;
  category: string;
  icon?: string;
  parameters?: ManifestActionParameter[];
  output?: ManifestActionOutput[];
}

export interface ManifestActionCategory {
  name: string;
  displayName: string;
  icon?: string;
}

export interface ManifestExpressionFunction {
  name: string;
  description?: string;
  parameters?: { name: string; type: string; description?: string }[];
  returnType?: string;
  example?: string;
}

export interface ManifestExpressionVariable {
  pattern: string;
  description?: string;
  example?: string;
}

export interface ManifestTriggerType {
  type: WorkflowType;
  displayName: string;
  description?: string;
}

export interface ManifestEventEntityAction {
  name: string;
  displayName: string;
}

export interface ManifestEventEntity {
  name: string;
  displayName: string;
  actions: ManifestEventEntityAction[];
  subEntities?: string[];
}

export interface EditorManifest {
  schemaVersion: string;
  nodeTypes: ManifestNodeType[];
  actions: WorkflowAction[];
  actionCategories: ManifestActionCategory[];
  expressionFunctions: ManifestExpressionFunction[];
  expressionVariables: ManifestExpressionVariable[];
  triggerTypes: ManifestTriggerType[];
  eventEntities: ManifestEventEntity[];
  enums: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// Workflow Entity Types (next branch — entity-pattern CRUD)
// ---------------------------------------------------------------------------

export interface WorkflowEntityBase {
  name: string;
  description: string;
  status: WorkflowEntityStatus;
  trigger: WorkflowEntityTrigger;
  steps: WorkflowStep[];
  tags: string[];
  version: number;
  enabled: boolean;
}

export type WorkflowEntityCreate = CreateEntity<WorkflowEntityBase>;
export type WorkflowEntityUpdate = UpdateEntity<WorkflowEntityBase>;
export type WorkflowEntity = ResponseEntity<WorkflowEntityBase>;

export type WorkflowEntityStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface WorkflowEntityTrigger {
  type: string;
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  actionId: string;
  name: string;
  config: Record<string, unknown>;
  next?: string[];
  errorHandler?: string;
}

// ─── Entity Validation ─────────────────────────────────────────────

export interface WorkflowEntityValidationResult {
  valid: boolean;
  errors: WorkflowEntityValidationError[];
  warnings: WorkflowEntityValidationWarning[];
}

export interface WorkflowEntityValidationError {
  code: string;
  message: string;
  stepId?: string;
}

export interface WorkflowEntityValidationWarning {
  code: string;
  message: string;
  stepId?: string;
}

// ─── Entity Execution ──────────────────────────────────────────────

export interface WorkflowEntityExecutionBase {
  workflowId: string;
  status: WorkflowEntityExecutionStatus;
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  currentStepId?: string;
}

export type WorkflowEntityExecution = ResponseEntity<WorkflowEntityExecutionBase>;

export type WorkflowEntityExecutionStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowEntityExecutionStartRequest {
  input?: Record<string, unknown>;
}

export interface WorkflowEntityExecutionLog {
  stepId: string;
  stepName: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface WorkflowEntityExecutionConcurrency {
  workflowId: string;
  running: number;
  limit: number;
}

// ─── Entity Metrics ────────────────────────────────────────────────

export interface WorkflowEntityMetrics {
  workflowId: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  p95Duration: number;
  lastExecutedAt?: string;
}

export interface WorkflowEntityAggregateMetrics {
  totalWorkflows: number;
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  period: string;
}

export interface WorkflowEntityErrorSummary {
  workflowId: string;
  errorCode: string;
  message: string;
  count: number;
  lastOccurredAt: string;
}

// ─── Entity Version ────────────────────────────────────────────────

export interface WorkflowEntityVersionBase {
  workflowId: string;
  version: number;
  createdBy: string;
  createdAt: string;
  changelog?: string;
  definition: WorkflowEntity;
}

export type WorkflowEntityVersion = ResponseEntity<WorkflowEntityVersionBase>;

export interface WorkflowEntityVersionComparison {
  fromVersion: number;
  toVersion: number;
  changes: WorkflowEntityVersionChange[];
}

export interface WorkflowEntityVersionChange {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: unknown;
  newValue?: unknown;
}

// ─── Entity Variable ───────────────────────────────────────────────

export interface WorkflowEntityVariableBase {
  key: string;
  value: string;
  description?: string;
  isSecret: boolean;
  workflowId?: string;
}

export type WorkflowEntityVariableCreate = CreateEntity<WorkflowEntityVariableBase>;
export type WorkflowEntityVariable = ResponseEntity<WorkflowEntityVariableBase>;

// ─── Entity Editor ─────────────────────────────────────────────────

export interface WorkflowEditorManifest {
  version: string;
  actions: WorkflowEditorAction[];
  triggers: WorkflowTriggerDefinition[];
}

export interface WorkflowEditorAction {
  id: string;
  name: string;
  description: string;
  category: string;
  inputs: WorkflowEditorActionParameter[];
  outputs: WorkflowEditorActionParameter[];
}

export interface WorkflowEditorActionParameter {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: unknown;
}

export interface WorkflowTriggerDefinition {
  type: string;
  name: string;
  description: string;
  configSchema: Record<string, unknown>;
}

// ─── Entity API Options ────────────────────────────────────────────

export type WorkflowFieldsFilter =
  | 'all'
  | 'default'
  | 'steps'
  | 'trigger'
  | 'tags';
export type WorkflowApiOptions = ApiOptions<WorkflowFieldsFilter>;

export type WorkflowExecutionFieldsFilter =
  | 'all'
  | 'default'
  | 'input'
  | 'output'
  | 'logs';
export type WorkflowExecutionApiOptions =
  ApiOptions<WorkflowExecutionFieldsFilter>;
