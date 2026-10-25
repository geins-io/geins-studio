import * as z from 'zod';
import type { EditorManifest } from '#shared/types';
import { ENTITIES } from '#shared/utils/entities';
import { errorResult, jsonResult } from './tools';
import type { GeinsFetch } from './geins-fetch';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const MANIFEST_ENDPOINT = '/orchestrator/manifest';

const DESCRIPTION_MAX = 120;

/** First sentence, capped — enough to pick a node, not to configure it. */
export function shortDescription(text?: string): string | undefined {
  if (!text) return undefined;
  const sentence = text.split(/(?<=\.)\s/)[0] ?? text;
  return sentence.length > DESCRIPTION_MAX
    ? `${sentence.slice(0, DESCRIPTION_MAX - 1)}…`
    : sentence;
}

/**
 * The full manifest is ~60 KB (every node's config schema plus the authoring
 * guide), too much to read on every turn. The overview is the catalog in a
 * few KB; the agent fetches node specs and the heavier sections on demand.
 */
export function manifestOverview(manifest: EditorManifest) {
  const functionsByCategory: Record<string, string[]> = {};
  for (const fn of manifest.expressionFunctions) {
    (functionsByCategory[fn.category ?? 'other'] ??= []).push(fn.name);
  }
  return {
    graphConventions: {
      triggerSentinel: manifest.graphConventions.triggerSentinel,
    },
    triggerTypes: manifest.triggerTypes.map(({ type }) => type),
    nodes: manifest.nodes.map((node) => ({
      functionName: node.functionName,
      category: node.type,
      description: shortDescription(node.description),
    })),
    expressionFunctions: functionsByCategory,
    expressionVariables: manifest.expressionVariables.map(
      ({ pattern }) => pattern,
    ),
  };
}

export const MANIFEST_SECTIONS = [
  'expressionFunctions',
  'expressionVariables',
  'authoring',
  'triggerTypes',
  'eventEntities',
  'eventPayloads',
  'workflowSettings',
] as const;

export function manifestSections(
  manifest: EditorManifest,
  sections: (typeof MANIFEST_SECTIONS)[number][],
) {
  return Object.fromEntries(
    sections.map((section) => [section, manifest[section]]),
  );
}

export function manifestNodes(
  manifest: EditorManifest,
  functionNames: string[],
) {
  const wanted = new Set(functionNames);
  return {
    nodes: manifest.nodes.filter((node) => wanted.has(node.functionName)),
    unknown: functionNames.filter(
      (name) => !manifest.nodes.some((node) => node.functionName === name),
    ),
    nodeProperties: manifest.nodeProperties,
  };
}

const workflowNodeSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    functionName: z.string(),
    config: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const workflowConnectionSchema = z
  .object({
    from: z.string(),
    to: z.string(),
    type: z.enum(['sequential', 'conditional', 'parallel']),
    label: z.string().optional(),
  })
  .passthrough();

const workflowGraphShape = {
  nodes: z.array(workflowNodeSchema),
  connections: z.array(workflowConnectionSchema),
};

export function registerWorkflowTools(
  server: McpServer,
  geinsFetch: GeinsFetch,
): void {
  server.registerTool(
    'get_workflow_manifest',
    {
      title: 'Get the workflow node catalog',
      description:
        'The orchestrator node catalog. Without arguments, a compact overview: every node (functionName, category, one-line description), expression function names by category (NCalc, e.g. Now(), Format()), expression variable patterns, trigger types. With `functionNames`, the full spec of those nodes (config fields, outputs, connection labels, examples); read it for every node you put in a workflow. With `sections`, those parts of the manifest in full (e.g. expressionFunctions for signatures, authoring for the expression guide, eventPayloads for event triggers).',
      inputSchema: {
        functionNames: z
          .array(z.string())
          .optional()
          .describe('e.g. ["core.network.httpRequest"]'),
        sections: z.array(z.enum(MANIFEST_SECTIONS)).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ functionNames, sections }) => {
      try {
        const manifest = await geinsFetch<EditorManifest>(MANIFEST_ENDPOINT);
        if (!functionNames?.length && !sections?.length) {
          return jsonResult(manifestOverview(manifest));
        }
        return jsonResult({
          ...(functionNames?.length && manifestNodes(manifest, functionNames)),
          ...(sections?.length && manifestSections(manifest, sections)),
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'validate_workflow',
    {
      title: 'Validate a workflow',
      description:
        'Check a workflow definition with the orchestrator without saving it. Returns `valid` plus errors per node/field. Validate before handing a graph to the user.',
      inputSchema: {
        name: z.string(),
        type: z.enum(['onDemand', 'scheduled', 'event']).optional(),
        ...workflowGraphShape,
      },
      annotations: { readOnlyHint: true },
    },
    async (workflow) => {
      try {
        return jsonResult(
          await geinsFetch(`${ENTITIES.workflow.endpoint}/validate`, {
            method: 'POST',
            body: { ...workflow, type: workflow.type ?? 'onDemand' },
          }),
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
