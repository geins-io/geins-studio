// @vitest-environment node
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { ENTITIES } from '#shared/utils/entities';
import {
  AGENT_ENTITY_KEYS,
  ENTITIES_WITHOUT_RECORD_PAGE,
  entityEndpoint,
  LISTABLE_ENTITY_KEYS,
  listRequest,
  normalizeList,
  withStudioUrl,
} from '../tools';

describe('AGENT_ENTITY_KEYS', () => {
  it('includes registry entities with an endpoint', () => {
    expect(AGENT_ENTITY_KEYS).toContain('quotation');
    expect(AGENT_ENTITY_KEYS).toContain('price_list');
  });

  it('leaves out entities without an endpoint', () => {
    expect(AGENT_ENTITY_KEYS).not.toContain('profile');
  });
});

describe('entityEndpoint', () => {
  it('returns the registry endpoint', () => {
    expect(entityEndpoint('price_list')).toBe('/product/pricelist');
  });

  it('throws for an entity without an endpoint', () => {
    expect(() => entityEndpoint('profile')).toThrow(/no API endpoint/);
  });
});

describe('withStudioUrl', () => {
  const origin = 'https://studio.example.com';

  it('adds a deep link for entities with a page', () => {
    expect(withStudioUrl('quotation', { _id: 'q1' }, origin)).toEqual({
      _id: 'q1',
      url: 'https://studio.example.com/orders/quotations/q1',
    });
  });

  it('leaves rows of page-less entities untouched', () => {
    const row = { _id: 'p1' };
    expect(withStudioUrl('product', row, origin)).toBe(row);
  });

  it('falls back to `id` for orchestrator records', () => {
    expect(withStudioUrl('workflow', { id: 'w1' }, origin)).toEqual({
      id: 'w1',
      url: 'https://studio.example.com/orchestrator/workflows/w1',
    });
  });

  it('leaves rows without a string id untouched', () => {
    const row = { name: 'x' };
    expect(withStudioUrl('quotation', row, origin)).toBe(row);
  });

  it('links only to record pages that exist', () => {
    for (const entity of Object.values(ENTITIES)) {
      if (!('route' in entity)) continue;
      const hasPage = existsSync(
        resolve('app/pages', entity.route, '[id].vue'),
      );
      expect(
        ENTITIES_WITHOUT_RECORD_PAGE.has(entity.key),
        `${entity.key} (${entity.route})`,
      ).toBe(!hasPage);
    }
  });
});

describe('listRequest', () => {
  it('uses GET {endpoint}/list for factory-backed entities', () => {
    expect(listRequest('company', 10)).toEqual({
      path: '/wholesale/account/list',
      method: 'GET',
    });
  });

  it('uses a batch query for quotations, products and assets', () => {
    expect(listRequest('quotation', 5)).toEqual({
      path: '/quotation/query',
      method: 'POST',
      body: { all: true, page: 1, pageSize: 5 },
    });
    expect(listRequest('product', 5).path).toBe('/product/query');
  });

  it('lists orchestrator workflows at the collection root', () => {
    expect(listRequest('workflow', 5)).toEqual({
      path: '/orchestrator/workflows',
      method: 'GET',
    });
  });

  it('lists executions from the logs path, limited by the API', () => {
    expect(listRequest('execution', 5)).toEqual({
      path: '/orchestrator/executions/logs',
      method: 'GET',
      query: { limit: 5 },
    });
  });

  it('does not offer messages as a listable entity', () => {
    expect(LISTABLE_ENTITY_KEYS).not.toContain('message');
  });
});

describe('normalizeList', () => {
  it('accepts a bare array', () => {
    expect(normalizeList([1, 2])).toEqual({ rows: [1, 2] });
  });

  it('unwraps a batch-query result with its total', () => {
    expect(normalizeList({ items: [1], totalItemCount: 40 })).toEqual({
      rows: [1],
      total: 40,
    });
  });

  it('unwraps an orchestrator envelope with a varying key', () => {
    expect(normalizeList({ logs: [1, 2], count: 2 })).toEqual({
      rows: [1, 2],
    });
  });

  it('returns undefined when there is no array', () => {
    expect(normalizeList({ data: 'x' })).toBeUndefined();
    expect(normalizeList(null)).toBeUndefined();
  });
});
