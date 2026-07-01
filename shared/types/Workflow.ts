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

/** Default error-handling strategy (workflow-level and per-node override). */
export type ErrorHandlingStrategy = 'failFast' | 'continueOnError' | 'skipNode';

/** Execution-log verbosity captured per node. */
export type LogVerbosity = 'minimal' | 'normal' | 'detailed';

/**
 * What happens when the workflow-level timeout fires.
 *
 * NOTE: the persisted contract (swagger `settingsModel`) uses
 * `fail | cancelAndReport`; the editor manifest's `TimeoutBehavior` enum lists
 * `fail | continueWithPartialResults`. We follow the persisted contract here —
 * see the plan's "Open items" (flagged to backend).
 */
export type TimeoutBehavior = 'fail' | 'cancelAndReport';

/** Input variable types accepted by `WorkflowInput.type`. */
export type InputVariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array';

export type PaginationStrategy =
  | 'offset'
  | 'pageNumber'
  | 'cursor'
  | 'linkHeader'
  | 'watermark';

/**
 * Editor-only canvas renderer kind. Derived from a node's `functionName`
 * (e.g. `core.flow.condition` → `condition`); every node that is not one of
 * the special flow kinds renders as a generic `action`. `trigger` is the
 * synthetic entry node injected by the canvas (never persisted as a node).
 */
export type WorkflowNodeKind =
  | 'action'
  | 'condition'
  | 'iterator'
  | 'delay'
  | 'trigger'
  | 'workflow'
  | 'paginator';

// -- Workflow Definition ----------------------------------------------------

/**
 * Trigger configuration for scheduled or event-driven workflows
 * (swagger `triggerModel`). Stored on the workflow itself, not in `nodes[]`.
 *
 * Required on create/update:
 * - `scheduled` → `cronExpression`
 * - `event` → `entity` + `action`
 */
export interface WorkflowTrigger {
  enabled: boolean;
  /** Cron expression for scheduled workflows (6-field, with seconds). */
  cronExpression?: string | null;
  /** Triggering entity (e.g. `product`, `order`). `*` = wildcard. */
  entity?: string | null;
  /** Triggering action (e.g. `create`, `update`). `*` = wildcard. */
  action?: string | null;
  /** Optional sub-entity qualifier. `*` = any; `!` = only when absent. */
  subEntity?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  description?: string | null;
  eventFilters?: Record<string, unknown> | null;
  inputParameters?: Record<string, unknown> | null;
}

export interface WorkflowNodeConnection {
  /** Source node id. `TRIGGER` (graphConventions.triggerSentinel) marks an entry connection. */
  from: string;
  /** Target node id. */
  to: string;
  type: ConnectionType;
  /** Connection label — drives conditional/handle routing. Empty string when unset. */
  label?: string | null;
  /** Free-form editor metadata (positions, sourceHandle, etc.). `null` when unset. */
  ui?: Record<string, unknown> | null;
}

export interface WorkflowNodeConfig {
  [key: string]: unknown;
}

/** Retry policy for a node (swagger `retryPolicyModel`). */
export interface RetryPolicy {
  maxAttempts: number;
  /** Initial interval between retries (TimeSpan, e.g. `00:00:05`). */
  initialInterval: string;
  /** Multiplier applied to the interval after each retry. */
  backoffMultiplier: number;
}

/**
 * A persisted workflow node (swagger `nodeModel`). Identity is `functionName`
 * (`provider.type.name[@version]`, e.g. `core.network.httpRequest`). All node
 * parameters live in `config`; the canvas position lives in `ui.position`.
 */
export interface WorkflowNode {
  id: string;
  name?: string;
  /** Canonical function identifier, e.g. `core.flow.condition`. */
  functionName: string;
  config?: WorkflowNodeConfig;
  /** UI-specific metadata for visual editors (position, sourceHandle, …). */
  ui?: Record<string, unknown> | null;
  retry?: RetryPolicy | null;
  /** Optional per-node timeout (ISO-8601, e.g. `PT30S`). */
  timeout?: string | null;
  /** Per-node error-handling override. `null`/undefined uses the workflow default. */
  errorHandlingStrategy?: ErrorHandlingStrategy | null;
}

/** Workflow input definition (swagger `inputDefinitionModel`). */
export interface WorkflowInput {
  name: string;
  type: InputVariableType;
  required?: boolean;
  defaultValue?: unknown;
  description?: string | null;
  /** Used to group inputs in the editor — empty/undefined falls back to `general`. */
  category?: string | null;
}

/** Workflow-level settings (swagger `settingsModel`). */
export interface WorkflowSettings {
  /** TimeSpan (`01:00:00`), ISO-8601 (`PT1H`), or numeric seconds. */
  timeout?: string | null;
  maxConcurrency?: number;
  retryPolicy?: RetryPolicy | null;
  /** Retention in days. `null` = global default; `0` = keep forever. */
  executionLogRetentionDays?: number | null;
  logVerbosity?: LogVerbosity;
  timeoutBehavior?: TimeoutBehavior;
  errorHandlingStrategy?: ErrorHandlingStrategy;
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
  createdBy?: string;
  updatedBy?: string;
}

export interface WorkflowDefinition extends WorkflowSummary {
  trigger?: WorkflowTrigger | null;
  input?: WorkflowInput[];
  nodes: WorkflowNode[];
  connections: WorkflowNodeConnection[];
  settings?: WorkflowSettings | null;
  ui?: WorkflowUiMetadata;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string | null;
  tags?: string[] | null;
  group?: string | null;
  type?: WorkflowType;
  /** Required for `scheduled` and `event` workflow types. */
  trigger?: WorkflowTrigger | null;
  input?: WorkflowInput[] | null;
  nodes?: WorkflowNode[];
  connections?: WorkflowNodeConnection[];
  settings?: WorkflowSettings | null;
  ui?: WorkflowUiMetadata;
}

export interface UpdateWorkflowRequest extends CreateWorkflowRequest {
  name: string;
}

export interface ValidateWorkflowResult {
  valid?: boolean;
  isValid?: boolean;
  message?: string;
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
  parentExecutionLogId?: string | null;
  parentWorkflowId?: string | null;
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
  canResume?: boolean;
  canReplay: boolean;
}

export interface ExecutionNodeResult {
  nodeId: string;
  nodeName?: string;
  /** Node kind/category string as returned by the execution API. */
  nodeType: string;
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

export interface BulkEnableDisableRequest {
  workflowIds: string[];
}

export interface BulkWorkflowOperationResponse {
  totalProcessed: number;
  successful: number;
  failed: number;
  successfulWorkflowIds: string[];
  failedWorkflowIds: string[];
  errors?: Record<string, string>;
}

export interface StartWorkflowResponse {
  success?: boolean;
  status?: string;
  executionId?: string;
  newExecutionId?: string;
  message?: string;
  instanceId?: string;
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
  archivedAt?: string;
  archivedBy?: string;
  definitionHash?: string;
  definition?: {
    nodes?: unknown[];
    connections?: unknown[];
    [key: string]: unknown;
  };
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

// -- Editor Manifest (schemaVersion 3.x) ------------------------------------

/**
 * A single config/output field descriptor (swagger `nodeConfigProperty`).
 * Used for node `config`/`output`, trigger-type `config`, and `workflowSettings`.
 */
export interface ManifestConfigProperty {
  name: string;
  /** Field type: string | number | boolean | object | array | datetime | duration | expression | any. */
  type: string;
  description?: string;
  required?: boolean;
  default?: unknown;
  allowedValues?: Array<string | number>;
  /** JSON-schema-ish nested shape for object/array fields. */
  schema?: Record<string, unknown>;
  /** Editor rendering hint, e.g. `duration-picker`, `condition-list`, `key-value-editor`. */
  editorHint?: string;
}

/** A named outgoing-connection handle on a node (swagger `connectionLabelDescriptor`). */
export interface ManifestConnectionLabel {
  label: string;
  description?: string;
  isDefault?: boolean;
}

/** Outgoing-connection rules for a node (swagger `nodeConnectionRules`). */
export interface ManifestNodeConnectionRules {
  maxOutgoing?: number | null;
  allowedOutgoingTypes?: ConnectionType[];
  labels?: ManifestConnectionLabel[];
  allowCustomLabels?: boolean;
  supportsParallelFanOut?: boolean;
}

/** A context variable a node exposes to its children (swagger `contextVariable`). */
export interface ManifestContextVariable {
  name: string;
  type: string;
  description?: string;
  /** Visibility scope, e.g. `children`. */
  scope?: string;
}

/** A usage example for a node (swagger `functionExample`). */
export interface ManifestNodeExample {
  name?: string;
  description?: string;
  /** Example `config` payload for the node (manifest 3.x renamed this from `input`). */
  config?: Record<string, unknown>;
}

/**
 * A node descriptor in the manifest (swagger `nodeDescriptor`). Identity is
 * `functionName`; `type` is the category name (matches a `ManifestNodeCategory`).
 */
export interface ManifestNode {
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  /** Category name (e.g. `flow`, `network`, `state`) — matches `nodeTypes[].name`. */
  type: string;
  provider: string;
  functionName: string;
  connections: ManifestNodeConnectionRules;
  config?: ManifestConfigProperty[];
  output?: ManifestConfigProperty[];
  contextVariables?: ManifestContextVariable[];
  examples?: ManifestNodeExample[];
}

/** A node-category descriptor (swagger `nodeTypeCategoryDescriptor`). */
export interface ManifestNodeCategory {
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
}

/** An integration provider (swagger `providerDescriptor`). */
export interface ManifestProvider {
  name: string;
  displayName: string;
  version?: string;
  description?: string;
  icon?: string;
}

/** A single enum value with display metadata (manifest `enums` entries). */
export interface ManifestEnumValue {
  value: string;
  displayName?: string;
  description?: string;
}

export interface ManifestExpressionFunction {
  name: string;
  category?: string;
  description?: string;
  parameters?: {
    name: string;
    type: string;
    required?: boolean;
    description?: string;
    default?: unknown;
  }[];
  returnType?: string;
  aliases?: string[];
  example?: string;
}

export interface ManifestExpressionVariable {
  pattern: string;
  description?: string;
  examples?: string[];
}

/**
 * A trigger type descriptor (swagger `triggerTypeDescriptor`). `type` is
 * PascalCase here (`OnDemand`/`Scheduled`/`Event`) — map to the camelCase
 * `WorkflowType` when reading/writing a workflow.
 */
export interface ManifestTriggerType {
  type: string;
  displayName: string;
  description?: string;
  config?: ManifestConfigProperty[];
}

export interface ManifestEventEntity {
  name: string;
  displayName: string;
  /** Action names as returned by the manifest (e.g. `['create', 'update', 'activate']`). */
  actions: string[];
  subEntities?: string[];
}

/** Graph-level conventions (swagger `graphConventionsDescriptor`). */
export interface ManifestGraphConventions {
  /** Reserved `from` value marking a connection as a workflow entry (e.g. `TRIGGER`). */
  triggerSentinel: string;
  allowMultipleTriggers?: boolean;
  triggerSentinelDescription?: string;
}

/** Expression/transform authoring guidance (swagger `manifestAuthoringGuide`). Shape is loose; UI renders it as help text. */
export interface ManifestAuthoringGuide {
  expressions?: Record<string, unknown>;
  transform?: Record<string, unknown>;
}

export interface EditorManifest {
  schemaVersion: string;
  /** Node categories (network/flow/state/event/data-transformation). */
  nodeTypes: ManifestNodeCategory[];
  nodes: ManifestNode[];
  providers: ManifestProvider[];
  expressionFunctions: ManifestExpressionFunction[];
  expressionVariables: ManifestExpressionVariable[];
  triggerTypes: ManifestTriggerType[];
  eventEntities: ManifestEventEntity[];
  graphConventions: ManifestGraphConventions;
  workflowSettings: ManifestConfigProperty[];
  authoring: ManifestAuthoringGuide;
  enums: Record<string, ManifestEnumValue[]>;
}

export interface LiveConsoleLine {
  id: number;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

// -- Workflow Node Palette --------------------------------------------------
// Used by WorkflowSidebarAddNode (produces items) and WorkflowBuilder
// (consumes items when placing nodes on the canvas).

export interface PaletteItem {
  // Canvas renderer kind this item creates ('action' | 'condition' | 'iterator' | 'delay' | 'workflow' | 'paginator').
  kind: WorkflowNodeKind;
  // Stable id for template keying.
  id: string;
  label: string;
  description?: string;
  // The canonical `functionName` (e.g. `core.network.httpRequest`) that identifies the node.
  functionName?: string;
  // When set, the item originates from a saved node template and should
  // be created with the full template data instead of a blank node.
  templateId?: string;
}

export interface PaletteSection {
  category: string;
  items: PaletteItem[];
}

// -- Node Templates --------------------------------------------------------
// Locally stored (localStorage) node configurations that users can reuse
// across workflows.

export interface NodeTemplate {
  id: string;
  name: string;
  description?: string;
  kind: WorkflowNodeKind;
  functionName?: string;
  nodeData: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Kits (provider-supplied workflow + variable bundles / integrations)
// ---------------------------------------------------------------------------
// Engine-type family (plain interfaces, like WorkflowSummary). A kit bundles
// one or more workflow definitions plus the variables they depend on, ready to
// install into an account. The catalog (`GET /orchestrator/kits`) returns
// `KitSummary[]`; the detail endpoint adds the full `variables`/`workflows`.

/** A variable a kit needs in order to run. Created on install from `defaultValue`. */
export interface KitVariableSpec {
  key: string;
  description?: string;
  /** Secret variables have no default and must be supplied by the installer. */
  isSecret?: boolean;
  required?: boolean;
  defaultValue?: string;
  /** Workflow refIds (or names) that consume this variable. */
  usedBy?: string[];
}

/** A workflow bundled in a kit. `refId` is the kit-local identifier. */
export interface KitWorkflowSpec {
  refId: string;
  /** Full workflow definition payload (opaque to the UI). */
  definition?: Record<string, unknown>;
  description?: string;
  /** refIds of other kit workflows this one depends on. */
  dependencies?: string[];
}

/** Catalog list item. */
export interface KitSummary {
  id: string;
  name: string;
  author: string;
  description?: string;
  category?: string;
  version: string;
  tags?: string[];
  workflowCount?: number;
  variableCount?: number;
}

/** Full kit detail (`GET /orchestrator/kits/{id}`). */
export interface Kit extends KitSummary {
  variables: KitVariableSpec[];
  workflows: KitWorkflowSpec[];
}

export interface InstallKitRequest {
  /** refIds of the kit workflows to install. Omit/empty installs all. */
  workflows?: string[];
  /**
   * Variable values to create on install, keyed by variable key. Required
   * variables (e.g. secrets without a default) must be supplied here or the
   * API rejects the install with 422.
   */
  variables?: Record<string, string>;
}

/** A workflow created (or referenced) by an installation. */
export interface KitInstallationWorkflow {
  refId: string;
  workflowId: string;
  workflowName: string;
}

/** A variable created by an installation. */
export interface KitInstallationVariable {
  key: string;
  created?: string;
}

export interface InstallKitResponse {
  installationId: string;
  kitId: string;
  kitName: string;
  kitVersion: string;
  workflowsCreated?: number;
  variablesCreated?: number;
  variablesExisted?: number;
  workflows?: KitInstallationWorkflow[];
  variables?: KitInstallationVariable[];
}

/** A record of a kit installed into the account. */
export interface KitInstallation {
  id: string;
  kitId: string;
  kitName: string;
  kitVersion: string;
  installedAt?: string;
  installedBy: string;
  workflows?: KitInstallationWorkflow[];
  variables?: KitInstallationVariable[];
}

export interface UninstallKitRequest {
  /** refIds to remove. Omit/empty uninstalls all installed workflows. */
  workflows?: string[];
  /** Also delete the kit's variables. Defaults to keeping them. */
  deleteVariables?: boolean;
}

export interface UninstallKitResponse {
  workflowsDeleted?: number;
  workflowsSkipped?: number;
  variablesDeleted?: number;
  workflowsRemaining?: string[];
}

export interface UpgradeKitRequest {
  /** Overwrite workflows that were modified locally since install. */
  force?: boolean;
}

export interface UpgradeKitResponse {
  installationId: string;
  kitId: string;
  kitName: string;
  previousVersion: string;
  newVersion: string;
  workflowsUpdated?: number;
  workflowsCreated?: number;
  workflowsRemoved?: number;
  variablesCreated?: number;
  variablesExisted?: number;
  workflows?: KitInstallationWorkflow[];
  variables?: KitInstallationVariable[];
  /** Workflows changed by the upgrade — surfaced as a warning before applying. */
  modifiedWorkflows?: KitInstallationWorkflow[];
}
