// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { EditorManifest, ManifestNode } from '#shared/types';
import {
  manifestNodes,
  manifestOverview,
  manifestSections,
  shortDescription,
} from '../workflow-tools';

const httpNode: ManifestNode = {
  name: 'httpRequest',
  displayName: 'HTTP request',
  description: 'Calls a URL',
  type: 'network',
  provider: 'core',
  functionName: 'core.network.httpRequest',
  connections: {},
  config: [{ name: 'url', type: 'string', required: true }],
};

const manifest = {
  schemaVersion: '3.0',
  nodeTypes: [],
  nodes: [httpNode],
  providers: [],
  expressionFunctions: [
    {
      name: 'Now',
      returnType: 'datetime',
      example: '{{Now()}}',
      parameters: [],
    },
  ],
  expressionVariables: [{ pattern: 'input.<path>' }],
  triggerTypes: [{ type: 'OnDemand', displayName: 'On demand', config: [] }],
  eventEntities: [],
  graphConventions: { triggerSentinel: 'TRIGGER' },
  workflowSettings: [],
  nodeProperties: [{ name: 'retry', type: 'object' }],
  authoring: {},
  enums: {},
} satisfies EditorManifest;

describe('manifestOverview', () => {
  it('lists the catalog without config schemas', () => {
    const overview = manifestOverview(manifest);
    expect(overview.nodes).toEqual([
      {
        functionName: 'core.network.httpRequest',
        category: 'network',
        description: 'Calls a URL',
      },
    ]);
    expect(overview.expressionFunctions).toEqual({ other: ['Now'] });
    expect(overview.expressionVariables).toEqual(['input.<path>']);
    expect(overview.triggerTypes).toEqual(['OnDemand']);
    expect(overview.graphConventions.triggerSentinel).toBe('TRIGGER');
  });
});

describe('shortDescription', () => {
  it('keeps the first sentence only', () => {
    expect(shortDescription('Calls a URL. Supports retries.')).toBe(
      'Calls a URL.',
    );
  });

  it('caps long sentences', () => {
    const text = shortDescription('x'.repeat(300));
    expect(text).toHaveLength(120);
    expect(text?.endsWith('…')).toBe(true);
  });
});

describe('manifestSections', () => {
  it('returns the requested parts in full', () => {
    expect(manifestSections(manifest, ['expressionFunctions'])).toEqual({
      expressionFunctions: manifest.expressionFunctions,
    });
  });
});

describe('manifestNodes', () => {
  it('returns full specs and reports unknown names', () => {
    const result = manifestNodes(manifest, [
      'core.network.httpRequest',
      'core.nope',
    ]);
    expect(result.nodes).toEqual([httpNode]);
    expect(result.unknown).toEqual(['core.nope']);
    expect(result.nodeProperties).toEqual(manifest.nodeProperties);
  });
});
