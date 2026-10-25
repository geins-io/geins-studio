import * as z from 'zod';
import { buildQueryObject } from '#shared/utils/api-query';
import {
  ENTITIES,
  entityEditUrl,
  type EntityKey,
  type EntityKeyWithRoute,
} from '#shared/utils/entities';
import type { GeinsFetch } from './geins-fetch';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

const LIST_LIMIT_DEFAULT = 25;
const LIST_LIMIT_MAX = 100;

/** Registry entities the tools can read: every entry with an API endpoint. */
export const AGENT_ENTITY_KEYS = (Object.keys(ENTITIES) as EntityKey[]).filter(
  (key) => 'endpoint' in ENTITIES[key],
);

const hasRoute = (key: EntityKey): key is EntityKeyWithRoute =>
  'route' in ENTITIES[key];

// Routed, but only a list page (no `[id].vue`): a record link would 404.
// The test checks this against the page folders.
export const ENTITIES_WITHOUT_RECORD_PAGE = new Set<EntityKey>([
  'user',
  'profile',
  'asset',
]);

export function entityEndpoint(key: EntityKey): string {
  const entity = ENTITIES[key];
  if (!('endpoint' in entity)) {
    throw new Error(`Entity "${key}" has no API endpoint`);
  }
  return entity.endpoint;
}

/**
 * How each entity's collection is listed — the APIs behind Studio don't share
 * one shape. Mirrors the SPA repos: `entityRepo` (`GET {endpoint}/list`),
 * the batch-query repos in `order.ts`/`product.ts`/`asset.ts`
 * (`POST {endpoint}/query`), and the orchestrator/media repos that list at the
 * collection root or a dedicated path.
 */
type ListStrategy =
  | { kind: 'list' }
  | { kind: 'query' }
  | { kind: 'root' }
  | { kind: 'path'; path: string; limitParam?: string };

const LIST_STRATEGIES: Partial<Record<EntityKey, ListStrategy>> = {
  product: { kind: 'query' },
  quotation: { kind: 'query' },
  asset: { kind: 'query' },
  workflow: { kind: 'root' },
  variable: { kind: 'root' },
  folder: { kind: 'root' },
  execution: {
    kind: 'path',
    path: `${ENTITIES.execution.endpoint}/logs`,
    limitParam: 'limit',
  },
};

/** Entities without a collection endpoint (messages hang off a quotation). */
const NOT_LISTABLE = new Set<EntityKey>(['message']);

export const LISTABLE_ENTITY_KEYS = AGENT_ENTITY_KEYS.filter(
  (key) => !NOT_LISTABLE.has(key),
);

export function listRequest(
  key: EntityKey,
  limit: number,
): {
  path: string;
  method: 'GET' | 'POST';
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
} {
  const strategy = LIST_STRATEGIES[key] ?? { kind: 'list' };
  const endpoint = entityEndpoint(key);
  switch (strategy.kind) {
    case 'query':
      return {
        path: `${endpoint}/query`,
        method: 'POST',
        body: { all: true, page: 1, pageSize: limit },
      };
    case 'root':
      return { path: endpoint, method: 'GET' };
    case 'path':
      return {
        path: strategy.path,
        method: 'GET',
        ...(strategy.limitParam && { query: { [strategy.limitParam]: limit } }),
      };
    case 'list':
      return { path: `${endpoint}/list`, method: 'GET' };
  }
}

/** Adds a Studio deep link so the agent can point the user at the record. */
export function withStudioUrl(
  key: EntityKey,
  row: unknown,
  studioOrigin: string,
): unknown {
  if (
    !hasRoute(key) ||
    ENTITIES_WITHOUT_RECORD_PAGE.has(key) ||
    !row ||
    typeof row !== 'object'
  ) {
    return row;
  }
  // Management API records carry `_id`; orchestrator records carry `id`.
  const { _id, id } = row as { _id?: unknown; id?: unknown };
  const recordId = typeof _id === 'string' ? _id : id;
  if (typeof recordId !== 'string') return row;
  return { ...row, url: `${studioOrigin}${entityEditUrl(key, recordId)}` };
}

/**
 * Lists arrive bare, as a batch-query result (`items` + `totalItemCount`), or
 * in an orchestrator envelope whose key varies (`workflows`, `logs`, …) — the
 * same fallback as the orchestrator repo's `unwrapArray`.
 */
export function normalizeList(
  data: unknown,
): { rows: unknown[]; total?: number } | undefined {
  if (Array.isArray(data)) return { rows: data };
  if (!data || typeof data !== 'object') return undefined;
  const { items, totalItemCount } = data as {
    items?: unknown;
    totalItemCount?: unknown;
  };
  if (Array.isArray(items)) {
    return {
      rows: items,
      total: typeof totalItemCount === 'number' ? totalItemCount : undefined,
    };
  }
  const firstArray = Object.values(data).find((value) => Array.isArray(value));
  return Array.isArray(firstArray) ? { rows: firstArray } : undefined;
}

export const jsonResult = (data: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
});

export function errorResult(error: unknown): CallToolResult {
  const fe = error as {
    statusCode?: number;
    message?: string;
    data?: { title?: string; detail?: string };
  };
  const detail = [
    ...new Set(
      [fe.data?.title, fe.data?.detail]
        .map((part) => part?.trim().replace(/\.$/, ''))
        .filter(Boolean),
    ),
  ].join('. ');
  const text = fe.statusCode
    ? `Geins API returned ${fe.statusCode}${detail ? `: ${detail}` : ''}`
    : `Request failed: ${fe.message ?? String(error)}`;
  return { content: [{ type: 'text', text }], isError: true };
}

const entitySchema = z
  .enum(AGENT_ENTITY_KEYS)
  .describe('Studio entity type, e.g. quotation, company, price_list');

export function registerStudioTools(
  server: McpServer,
  geinsFetch: GeinsFetch,
  context: { accountKey: string; studioOrigin: string },
): void {
  server.registerTool(
    'get_context',
    {
      title: 'Get Studio context',
      description:
        'Who the agent acts as: the signed-in Studio user, their accounts and the active account key. Call this first when the task depends on the user or account.',
      annotations: { readOnlyHint: true },
    },
    async () => {
      try {
        const user = await geinsFetch('user/me', {
          query: buildQueryObject({ fields: ['accounts'] }),
        });
        return jsonResult({
          user,
          accountKey: context.accountKey,
          studioUrl: context.studioOrigin,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'list_entities',
    {
      title: 'List Studio entities',
      description:
        'List records of one Studio entity type (quotations, companies, price lists, workflows, ...). Rows include a Studio `url` when the entity has a page.',
      inputSchema: {
        entity: z
          .enum(LISTABLE_ENTITY_KEYS)
          .describe('Studio entity type, e.g. quotation, company, execution'),
        fields: z
          .array(z.string())
          .optional()
          .describe('Extra fields the API should include, when supported'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(LIST_LIMIT_MAX)
          .optional()
          .describe(`Max rows to return (default ${LIST_LIMIT_DEFAULT})`),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ entity, fields, limit }) => {
      try {
        const max = limit ?? LIST_LIMIT_DEFAULT;
        // `list`/`root` endpoints have no paging (the SPA loads them whole
        // too), so those are cut to `max` here.
        const { path, method, body, query } = listRequest(entity, max);
        const data = await geinsFetch(path, {
          method,
          body,
          query: { ...buildQueryObject({ fields }), ...query },
        });
        const list = normalizeList(data);
        if (!list) return jsonResult(data);
        return jsonResult({
          entity,
          // A full page from a limited request doesn't tell the real total.
          total:
            list.total ??
            (query && list.rows.length >= max ? undefined : list.rows.length),
          returned: Math.min(list.rows.length, max),
          items: list.rows
            .slice(0, max)
            .map((row) => withStudioUrl(entity, row, context.studioOrigin)),
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'get_entity',
    {
      title: 'Get a Studio entity',
      description:
        'Read one Studio record by id, including a Studio `url` when the entity has a page.',
      inputSchema: {
        entity: entitySchema,
        id: z.string().min(1).describe('The record id (`_id`)'),
        fields: z.array(z.string()).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ entity, id, fields }) => {
      try {
        const data = await geinsFetch(
          `${entityEndpoint(entity)}/${encodeURIComponent(id)}`,
          { query: buildQueryObject({ fields }) },
        );
        return jsonResult(withStudioUrl(entity, data, context.studioOrigin));
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
