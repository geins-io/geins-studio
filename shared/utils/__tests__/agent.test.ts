// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  agentListRow,
  agentPageNames,
  agentToolName,
  describeAgentStep,
  hasFormPath,
} from '../agent';

describe('hasFormPath', () => {
  const values = { details: { name: 'A', buyerId: '' }, vat: { exVat: false } };

  it('finds nested keys, including empty and falsy values', () => {
    expect(hasFormPath(values, 'details.name')).toBe(true);
    expect(hasFormPath(values, 'details.buyerId')).toBe(true);
    expect(hasFormPath(values, 'vat.exVat')).toBe(true);
  });

  it('rejects unknown keys and paths through non-objects', () => {
    expect(hasFormPath(values, 'details.nmae')).toBe(false);
    expect(hasFormPath(values, 'details.name.first')).toBe(false);
    expect(hasFormPath(undefined, 'details')).toBe(false);
  });
});

describe('agentListRow', () => {
  it('picks a name and status when present', () => {
    expect(
      agentListRow({ name: 'Acme', status: 'draft', total: 3 }, 'q1'),
    ).toEqual({ id: 'q1', name: 'Acme', status: 'draft' });
  });

  it('falls back to other name-like fields', () => {
    expect(agentListRow({ workflowName: 'Sync' }, 'e1').name).toBe('Sync');
  });

  it('copes with rows that have neither', () => {
    expect(agentListRow(null, 'x')).toEqual({
      id: 'x',
      name: undefined,
      status: undefined,
    });
  });
});

describe('describeAgentStep', () => {
  const channelList =
    '{ "entity": "channel", "total": 2, "returned": 2, "items": [ { "_id": "1", "name": "sales-portal-a", "url": "http://localhost:3000/settings/channels/1", "channelType": "Webshop" }, { "_id": "2", "name": "b2b", "url": "http://localhost:3000/settings/cha';
  const channel =
    '{ "_id": "1", "_type": "geins.channel", "identifier": "sales-portal.monitor", "name": "sales-portal-a", "url": "http://localhost:3000/settings/channels/1", "channelType": "Webshop", "act';

  it('hides the agent groundwork', () => {
    for (const name of [
      'ToolSearch',
      'mcp__studio__get_context',
      'mcp__ui__get_page_context',
    ]) {
      expect(describeAgentStep(name, {})).toBeUndefined();
    }
  });

  it('counts a list from a truncated result', () => {
    expect(
      describeAgentStep(
        'mcp__studio__list_entities',
        { entity: 'channel' },
        channelList,
      ),
    ).toEqual({
      key: 'list',
      params: { entityKey: 'channel' },
      plural: 2,
      count: 2,
    });
  });

  it('names and links the record it read', () => {
    expect(
      describeAgentStep(
        'mcp__studio__get_entity',
        { entity: 'channel', id: '1' },
        channel,
      ),
    ).toEqual({
      key: 'read',
      params: { entityKey: 'channel' },
      target: { label: 'sales-portal-a', path: '/settings/channels/1' },
    });
  });

  it('names an opened page from earlier results', () => {
    const pageNames = agentPageNames([channelList]);
    expect(
      describeAgentStep(
        'mcp__ui__navigate',
        { path: '/settings/channels/1' },
        undefined,
        pageNames,
      )?.target,
    ).toEqual({ label: 'sales-portal-a', path: '/settings/channels/1' });
    // The second row's URL was cut off, so it isn't trusted as a page name.
    expect(pageNames.has('/settings/channels/2')).toBe(false);
    expect(
      agentPageNames(['{"path":"/orders/1","title":"Q-100","entity":{}}']).get(
        '/orders/1',
      ),
    ).toBe('Q-100');
  });

  it('counts fields, rows and workflow nodes', () => {
    expect(
      describeAgentStep('mcp__ui__fill_form', { fields: { a: 1, b: 2 } }),
    ).toMatchObject({ key: 'fill', plural: 2 });
    expect(
      describeAgentStep('mcp__ui__highlight', { ids: ['1', '2', '3'] }),
    ).toMatchObject({ key: 'highlight', plural: 3 });
    expect(
      describeAgentStep('mcp__ui__set_workflow_graph', { nodes: [{}] }),
    ).toMatchObject({ key: 'draw_workflow', plural: 1 });
  });

  it('describes files, web and other servers', () => {
    expect(
      describeAgentStep('Write', { file_path: 'C:\\ws\\summary.md' }),
    ).toEqual({ key: 'save_file', params: { file: 'summary.md' } });
    expect(describeAgentStep('Edit', { files: ['/ws/a.md'] })).toEqual({
      key: 'edit_file',
      params: { file: 'a.md' },
    });
    expect(
      describeAgentStep('WebFetch', { url: 'https://docs.geins.io/x' }),
    ).toEqual({ key: 'web_fetch', params: { site: 'docs.geins.io' } });
    expect(describeAgentStep('mcp__sonora__get_orders', {})).toEqual({
      key: 'server_tool',
      params: { server: 'sonora', tool: 'get orders' },
    });
  });
});

describe('agentToolName', () => {
  it('splits server and tool, keeping underscores in server names', () => {
    expect(agentToolName('mcp__claude_ai_Linear__list_issues')).toEqual({
      server: 'claude ai Linear',
      tool: 'list issues',
    });
    expect(agentToolName('Bash')).toEqual({ tool: 'Bash' });
  });
});
