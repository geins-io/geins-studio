/**
 * WebSocket protocol between a Studio tab and the local agent helper
 * (`geins serve` → `/agent`). The helper runs the Claude Agent SDK and
 * flattens its message stream into these events, so the tab never depends on
 * SDK types. Mirrored in geins-cli `src/agent/protocol.ts` — keep both in sync.
 */
import type { WorkflowNode, WorkflowNodeConnection } from './Workflow';

/** In-tab actions the agent can request through the helper's `ui` MCP server. */
export type AgentUiTool =
  | 'navigate'
  | 'refresh'
  | 'get_page_context'
  | 'fill_form'
  | 'switch_tab'
  | 'highlight'
  | 'notify'
  | 'set_workflow_graph';

/** Sent with every prompt so "this company" resolves without a tool call. */
export interface AgentPageRef {
  path: string;
  title?: string;
  entityKey?: string;
  entityId?: string;
  createMode?: boolean;
}

/** `auto`: a classifier approves or blocks actions; `default`: ask for anything not pre-approved. */
export type AgentPermissionMode = 'default' | 'auto';

/** A model the user's Claude login can use (from the SDK's `supportedModels()`). */
export interface AgentModel {
  value: string;
  displayName: string;
  description?: string;
  supportsAutoMode?: boolean;
}

/** The agent harness running a session. */
export type AgentProvider = 'claude' | 'codex';

export interface AgentProviderInfo {
  id: AgentProvider;
  name: string;
  /** Installed (and runnable) on the helper's machine. */
  available: boolean;
  /** The user is signed in to it (their own account runs the agent). */
  signedIn: boolean;
  /** Supports the Auto/default permission switch. */
  supportsPermissionModes: boolean;
  /** Where to get it when it isn't installed. */
  installUrl: string;
}

export type AgentClientMessage =
  | { type: 'permission_mode'; mode: AgentPermissionMode }
  /** Switching provider starts a new conversation. */
  | { type: 'set_provider'; provider: AgentProvider }
  /** Start the provider's browser sign-in on the helper's machine; `providers` follows. */
  | { type: 'sign_in'; provider: AgentProvider }
  | { type: 'set_model'; model: string }
  /** Drop the conversation and start a fresh agent session. */
  | { type: 'reset' }
  | {
      type: 'auth';
      accessToken: string;
      accountKey: string;
      /** Lets the helper match the account to local tools (e.g. a Sonora profile). */
      accountName?: string;
    }
  | { type: 'user_message'; text: string; page?: AgentPageRef }
  | { type: 'interrupt' }
  | { type: 'ui_result'; id: string; result?: unknown; error?: string }
  | { type: 'approval'; id: string; allow: boolean }
  /** `answers` keyed by question text; omitted when the user dismissed the card. */
  | { type: 'question_answer'; id: string; answers?: Record<string, string> };

/** A clarifying question from the agent (`AskUserQuestion`). */
export interface AgentQuestion {
  question: string;
  header?: string;
  multiSelect?: boolean;
  options: { label: string; description?: string }[];
}

export interface AgentQuestionRequest {
  id: string;
  questions: AgentQuestion[];
}

export type AgentServerMessage =
  | { type: 'status'; state: 'ready' | 'busy'; sessionId?: string }
  | { type: 'permission_mode'; mode: AgentPermissionMode }
  | { type: 'models'; models: AgentModel[]; current: string }
  | {
      type: 'providers';
      providers: AgentProviderInfo[];
      current: AgentProvider;
    }
  | { type: 'model'; model: string }
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; id: string; isError: boolean; summary: string }
  | { type: 'turn_end'; error?: string; costUsd?: number }
  | {
      type: 'ui_call';
      id: string;
      tool: AgentUiTool;
      input: Record<string, unknown>;
    }
  | { type: 'approval_request'; id: string; tool: string; input: unknown }
  | { type: 'question_request'; id: string; questions: AgentQuestion[] }
  | { type: 'error'; message: string };

/** This browser's pairing with a local agent helper (`geins studio connect`). */
export interface AgentPairing {
  token: string;
  port: number;
}

export type AgentConnectionStatus =
  | 'unpaired'
  | 'disconnected'
  | 'connecting'
  | 'ready'
  | 'busy';

export type AgentChatItem =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'assistant'; id: string; text: string }
  | {
      kind: 'tool';
      id: string;
      name: string;
      input: unknown;
      status: 'running' | 'done' | 'error';
      summary?: string;
    }
  | { kind: 'error'; id: string; text: string };

export interface AgentApprovalRequest {
  id: string;
  tool: string;
  input: unknown;
}

/** The entity edit page currently open, as `useEntityEdit` reports it. */
export interface AgentEntityState {
  entityKey: string;
  entityId?: string;
  createMode: boolean;
  currentTab: number;
  hasUnsavedChanges: boolean;
  values: Record<string, unknown>;
  /** Workflow pages: the nodes and connections on the canvas. */
  graph?: AgentWorkflowGraph;
}

export interface AgentWorkflowGraph {
  nodes: WorkflowNode[];
  connections: WorkflowNodeConnection[];
}

export interface AgentEntityHandle {
  getState: () => AgentEntityState;
  setTab: (tab: number) => void;
  setFieldValue: (path: string, value: unknown) => void;
  validate: () => Promise<{
    valid: boolean;
    errors: Partial<Record<string, string>>;
  }>;
  /**
   * Workflow pages: replace the canvas graph. On `/new` there is no canvas
   * yet, so the graph is held and sent along when the user clicks Create.
   */
  setGraph?: (graph: AgentWorkflowGraph) => Promise<{ pending: boolean }>;
}

export interface AgentListRow {
  id: string;
  name?: string;
  status?: string;
}

/** A list table on the current page, as `TableView` reports it. */
export interface AgentListState {
  entityKey: string;
  /** `?q` / `?sort` on the page URL drive this table's search and sort. */
  urlSync: boolean;
  search: string;
  sort?: string;
  sortableColumns: string[];
  rowCount: number;
  page: number;
  pageCount: number;
  rows: AgentListRow[];
}

export interface AgentListHandle {
  getState: () => AgentListState;
  /** Pages to the first given row; resolves with the ids the table holds. */
  reveal: (ids: string[]) => Promise<string[]>;
}

/**
 * A tool call as the panel shows it: an i18n key under `agent.step` (the
 * running form adds `_running`) with its interpolation params.
 */
export interface AgentStepDescription {
  key: string;
  params: Record<string, string | number>;
  /** Count for the plural form, e.g. the linked entity name or "3 fields". */
  plural?: number;
  /** Shown after the text, e.g. how many records a list returned. */
  count?: number;
  /** The Studio record or page the step touched; `path` makes it a link. */
  target?: { label: string; path?: string };
}
