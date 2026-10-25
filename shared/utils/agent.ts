import type {
  AgentListRow,
  AgentPairing,
  AgentStepDescription,
} from '../types';

const PAIRING_PARAM = 'geins-agent';

/**
 * Reads a pairing from a URL fragment like `#geins-agent=<token>:<port>`, as
 * `geins studio connect` (or `/studio connect` in Synapse) opens it.
 */
export function parseAgentPairing(hash: string): AgentPairing | undefined {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get(PAIRING_PARAM);
  const match = value?.match(/^([\w-]{16,}):(\d{1,5})$/);
  if (!match) return undefined;
  const port = Number(match[2]);
  return port > 0 && port < 65536 ? { token: match[1]!, port } : undefined;
}

/** The fragment without the pairing parameter, to tidy the address bar. */
export function stripAgentPairing(hash: string): string {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  params.delete(PAIRING_PARAM);
  const rest = params.toString();
  return rest ? `#${rest}` : '';
}

/** The local helper's agent endpoint for a pairing. */
export function agentCompanionUrl(pairing: AgentPairing): string {
  return `ws://127.0.0.1:${pairing.port}/agent?token=${encodeURIComponent(pairing.token)}`;
}

/**
 * Whether `path` (dot-separated, e.g. `details.name`) names an existing key
 * in a form's values. `setFieldValue` would silently create unknown paths, so
 * the agent's `fill_form` checks first and reports typos back.
 */
export function hasFormPath(values: unknown, path: string): boolean {
  const keys = path.split('.');
  let current: unknown = values;
  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return false;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return true;
}

/** Compact row summary for the agent: id plus a name/status when present. */
export function agentListRow(original: unknown, id: string): AgentListRow {
  const row = (original ?? {}) as Record<string, unknown>;
  const pick = (...keys: string[]) =>
    keys.map((key) => row[key]).find((value) => typeof value === 'string') as
      | string
      | undefined;
  return {
    id,
    name: pick('name', 'displayName', 'workflowName', 'key', 'email'),
    status: pick('status', 'state'),
  };
}

// The agent's groundwork (loading tools, reading context, the question card's
// own tool), which means nothing to the user.
const HIDDEN_AGENT_TOOLS = new Set([
  'ToolSearch',
  'TodoWrite',
  'AskUserQuestion',
  'mcp__studio__get_context',
  'mcp__studio__get_workflow_manifest',
  'mcp__ui__get_page_context',
  'mcp__ui__notify',
]);

/** `mcp__sonora__get_orders` → `{ server: 'sonora', tool: 'get orders' }`. */
export function agentToolName(name: string): { server?: string; tool: string } {
  const match = name.match(/^mcp__([^_]+(?:_[^_]+)*?)__(.+)$/);
  const tool = (match ? match[2]! : name).replace(/_/g, ' ');
  return match ? { server: match[1]!.replace(/_/g, ' '), tool } : { tool };
}

const fileName = (path: unknown) =>
  typeof path === 'string' ? (path.split(/[\\/]/).pop() ?? path) : '';

/** First `"key": "value"` (or number) in a tool result, which may be cut off mid-JSON. */
function summaryField(summary: string | undefined, key: string) {
  const match = summary?.match(
    new RegExp(`"${key}"\\s*:\\s*(?:"((?:[^"\\\\]|\\\\.)*)"|(-?\\d+))`),
  );
  if (!match) return undefined;
  if (match[2] !== undefined) return match[2];
  try {
    return JSON.parse(`"${match[1]}"`) as string;
  } catch {
    return match[1];
  }
}

/** A Studio URL from a tool result as an in-app path. */
function studioPath(url: string | undefined) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, 'http://studio.local');
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return undefined;
  }
}

/**
 * Record names the conversation has seen, by Studio path, so a step like
 * "Opened …" can name the page instead of showing its path.
 */
export function agentPageNames(
  summaries: (string | undefined)[],
): Map<string, string> {
  const names = new Map<string, string>();
  for (const summary of summaries) {
    if (!summary) continue;
    const pageTitle = summary.match(/"path":"([^"]+)","title":"([^"]+)"/);
    if (pageTitle) names.set(pageTitle[1]!, pageTitle[2]!);
    for (const record of summary.matchAll(
      /"name":\s*"([^"]+)"[^{}]*?"url":\s*"([^"]+)"/g,
    )) {
      const path = studioPath(record[2]);
      if (path) names.set(path, record[1]!);
    }
  }
  return names;
}

/**
 * How the panel describes a tool call, or `undefined` for groundwork it hides.
 * `summary` is the helper's (possibly truncated) preview of the result.
 */
export function describeAgentStep(
  name: string,
  input: unknown,
  summary?: string,
  pageNames: Map<string, string> = new Map(),
): AgentStepDescription | undefined {
  if (HIDDEN_AGENT_TOOLS.has(name)) return undefined;
  const args = (input ?? {}) as Record<string, unknown>;
  const count = (value: unknown) => (Array.isArray(value) ? value.length : 0);

  switch (name) {
    case 'mcp__studio__list_entities': {
      const total = Number(summaryField(summary, 'total'));
      return {
        key: 'list',
        params: { entityKey: String(args.entity ?? '') },
        plural: 2,
        ...(Number.isFinite(total) && { count: total }),
      };
    }
    case 'mcp__studio__get_entity': {
      const label = summaryField(summary, 'name');
      const path = studioPath(summaryField(summary, 'url'));
      return {
        key: 'read',
        params: { entityKey: String(args.entity ?? '') },
        ...(label && { target: { label, path } }),
      };
    }
    case 'mcp__studio__validate_workflow':
      return { key: 'check_workflow', params: {} };
    case 'mcp__ui__navigate': {
      const path = studioPath(String(args.path ?? ''));
      const label = path && pageNames.get(path.split('?')[0]!);
      return {
        key: 'open',
        params: {},
        target: { label: label || path || '', path },
      };
    }
    case 'mcp__ui__refresh':
      return { key: 'refresh', params: {} };
    case 'mcp__ui__fill_form': {
      const fields = Object.keys((args.fields ?? {}) as object).length;
      return { key: 'fill', params: { count: fields }, plural: fields };
    }
    case 'mcp__ui__switch_tab':
      return { key: 'switch_tab', params: {} };
    case 'mcp__ui__highlight':
      return {
        key: 'highlight',
        params: { count: count(args.ids) },
        plural: count(args.ids),
      };
    case 'mcp__ui__set_workflow_graph':
      return {
        key: 'draw_workflow',
        params: { count: count(args.nodes) },
        plural: count(args.nodes),
      };
    case 'WebSearch':
      return { key: 'web_search', params: { query: String(args.query ?? '') } };
    case 'WebFetch': {
      let site = String(args.url ?? '');
      try {
        site = new URL(site).hostname;
      } catch {
        // Not a URL; show it as given.
      }
      return { key: 'web_fetch', params: { site } };
    }
    case 'Read':
      return { key: 'read_file', params: { file: fileName(args.file_path) } };
    case 'Write':
      return { key: 'save_file', params: { file: fileName(args.file_path) } };
    case 'Edit': {
      // Codex reports a file change as `files`.
      const files = Array.isArray(args.files) ? args.files : [args.file_path];
      return { key: 'edit_file', params: { file: fileName(files[0]) } };
    }
    case 'Glob':
    case 'Grep':
      return { key: 'search_files', params: {} };
    case 'Bash':
      return { key: 'command', params: {} };
    case 'Skill':
      return { key: 'skill', params: { skill: String(args.skill ?? '') } };
    case 'Task':
    case 'Agent':
      return { key: 'subtask', params: {} };
  }

  const { server, tool } = agentToolName(name);
  return server
    ? { key: 'server_tool', params: { server, tool } }
    : { key: 'tool', params: { tool } };
}
