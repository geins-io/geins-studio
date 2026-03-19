import type { ApiOptions } from './Api';
import type { CreateEntity, UpdateEntity, ResponseEntity } from './Global';

// ─── Workflow Entity ───────────────────────────────────────────────

export interface WorkflowBase {
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  tags: string[];
  version: number;
  enabled: boolean;
}

export type WorkflowCreate = CreateEntity<WorkflowBase>;
export type WorkflowUpdate = UpdateEntity<WorkflowBase>;
export type Workflow = ResponseEntity<WorkflowBase>;

export type WorkflowStatus = 'draft' | 'active' | 'inactive' | 'archived';

export interface WorkflowTrigger {
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

// ─── Validation ────────────────────────────────────────────────────

export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationWarning[];
}

export interface WorkflowValidationError {
  code: string;
  message: string;
  stepId?: string;
}

export interface WorkflowValidationWarning {
  code: string;
  message: string;
  stepId?: string;
}

// ─── Execution ─────────────────────────────────────────────────────

export interface WorkflowExecutionBase {
  workflowId: string;
  status: WorkflowExecutionStatus;
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  currentStepId?: string;
}

export type WorkflowExecution = ResponseEntity<WorkflowExecutionBase>;

export type WorkflowExecutionStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowExecutionStartRequest {
  input?: Record<string, unknown>;
}

export interface WorkflowExecutionLog {
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

export interface WorkflowExecutionConcurrency {
  workflowId: string;
  running: number;
  limit: number;
}

// ─── Metrics ───────────────────────────────────────────────────────

export interface WorkflowMetrics {
  workflowId: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  averageDuration: number;
  p95Duration: number;
  lastExecutedAt?: string;
}

export interface WorkflowAggregateMetrics {
  totalWorkflows: number;
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  period: string;
}

export interface WorkflowErrorSummary {
  workflowId: string;
  errorCode: string;
  message: string;
  count: number;
  lastOccurredAt: string;
}

// ─── Version ───────────────────────────────────────────────────────

export interface WorkflowVersionBase {
  workflowId: string;
  version: number;
  createdBy: string;
  createdAt: string;
  changelog?: string;
  definition: WorkflowBase;
}

export type WorkflowVersion = ResponseEntity<WorkflowVersionBase>;

export interface WorkflowVersionComparison {
  fromVersion: number;
  toVersion: number;
  changes: WorkflowVersionChange[];
}

export interface WorkflowVersionChange {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: unknown;
  newValue?: unknown;
}

// ─── Variable ──────────────────────────────────────────────────────

export interface WorkflowVariableBase {
  key: string;
  value: string;
  description?: string;
  isSecret: boolean;
  workflowId?: string;
}

export type WorkflowVariableCreate = CreateEntity<WorkflowVariableBase>;
export type WorkflowVariable = ResponseEntity<WorkflowVariableBase>;

// ─── Editor ────────────────────────────────────────────────────────

export interface WorkflowEditorManifest {
  version: string;
  actions: WorkflowAction[];
  triggers: WorkflowTriggerDefinition[];
}

export interface WorkflowAction {
  id: string;
  name: string;
  description: string;
  category: string;
  inputs: WorkflowActionParameter[];
  outputs: WorkflowActionParameter[];
}

export interface WorkflowActionParameter {
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

// ─── API Options ───────────────────────────────────────────────────

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
