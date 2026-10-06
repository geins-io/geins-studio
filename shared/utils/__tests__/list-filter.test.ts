// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { ListDateRange, ListFilterDefinition } from '#shared/types';
import {
  isListFilterSearchable,
  listFilterActiveCount,
  listFilterIcon,
  listFilterRouteParams,
  matchesListFilters,
} from '../list-filter';
import {
  DEFAULT_LIST_QUERY_ROUTE_KEYS,
  readListQueryRoute,
  writeListQueryRoute,
} from '../list-query';

interface Filters {
  types?: string[];
  channels?: string[];
  modified?: ListDateRange;
}

interface Row {
  type: string;
  channelIds: string[];
  updatedAt?: string;
}

const types: ListFilterDefinition<Filters> = {
  name: 'types',
  label: 'type',
  kind: 'multiselect',
  options: [
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
  ],
};
const channels: ListFilterDefinition<Filters> = {
  name: 'channels',
  label: 'channel',
  kind: 'multiselect',
  urlKey: 'ch',
  options: async () => [],
};
const modified: ListFilterDefinition<Filters> = {
  name: 'modified',
  label: 'modified',
  kind: 'dateRange',
};
const definitions = [types, channels, modified];

const row: Row = {
  type: 'image',
  channelIds: ['se', 'no'],
  updatedAt: new Date(2026, 8, 15, 12).toISOString(),
};
const match = (filters: Filters, r: Row = row) =>
  matchesListFilters(r, definitions, filters, {
    channels: (x) => x.channelIds,
    modified: (x) => x.updatedAt,
    types: (x) => x.type,
  });

describe('matchesListFilters', () => {
  it('matches everything with no active filter', () => {
    expect(match({})).toBe(true);
    expect(match({ types: [], modified: {} })).toBe(true);
  });

  it('ORs values within one filter', () => {
    expect(match({ types: ['video', 'image'] })).toBe(true);
    expect(match({ types: ['video'] })).toBe(false);
    expect(match({ channels: ['dk', 'no'] })).toBe(true);
  });

  it('ANDs filters', () => {
    expect(match({ types: ['image'], channels: ['se'] })).toBe(true);
    expect(match({ types: ['image'], channels: ['dk'] })).toBe(false);
  });

  it('includes both ends of a date range', () => {
    const at = row.updatedAt!;
    expect(match({ modified: { from: at, to: at } })).toBe(true);
    expect(match({ modified: { from: at } })).toBe(true);
    expect(match({ modified: { to: at } })).toBe(true);
    const after = new Date(new Date(at).getTime() + 1).toISOString();
    expect(match({ modified: { from: after } })).toBe(false);
  });

  it('resolves a preset against now', () => {
    const now = new Date(2026, 8, 30);
    const filters = { modified: { preset: 'month' as const } };
    expect(
      matchesListFilters(
        row,
        definitions,
        filters,
        { modified: (x) => x.updatedAt },
        now,
      ),
    ).toBe(true);
    const nextMonth = new Date(2026, 9, 2);
    expect(
      matchesListFilters(
        row,
        definitions,
        filters,
        { modified: (x) => x.updatedAt },
        nextMonth,
      ),
    ).toBe(false);
  });

  it('drops a row without a value when the filter is active', () => {
    expect(
      match(
        { modified: { preset: 'today' } },
        { ...row, updatedAt: undefined },
      ),
    ).toBe(false);
  });

  it('reads the row property of the same name without an accessor', () => {
    const plain = { types: 'video' };
    expect(matchesListFilters(plain, [types], { types: ['video'] })).toBe(true);
  });
});

describe('listFilterActiveCount', () => {
  it('counts selected values and a set range', () => {
    expect(listFilterActiveCount(types, ['image', 'video'])).toBe(2);
    expect(listFilterActiveCount(types, undefined)).toBe(0);
    expect(listFilterActiveCount(modified, { preset: 'today' })).toBe(1);
    expect(listFilterActiveCount(modified, {})).toBe(0);
    expect(listFilterActiveCount(modified, 'today')).toBe(0);
  });
});

describe('definition defaults', () => {
  it('picks an icon per kind unless given', () => {
    expect(listFilterIcon(types)).toBe('ListFilter');
    expect(listFilterIcon(modified)).toBe('CalendarRange');
    expect(listFilterIcon({ ...modified, icon: 'Clock' })).toBe('Clock');
  });

  it('is searchable past 10 options unless set', () => {
    if (types.kind !== 'multiselect') throw new Error('kind');
    expect(isListFilterSearchable(types, 10)).toBe(false);
    expect(isListFilterSearchable(types, 11)).toBe(true);
    expect(isListFilterSearchable({ ...types, searchable: true }, 2)).toBe(
      true,
    );
    expect(isListFilterSearchable({ ...types, searchable: false }, 20)).toBe(
      false,
    );
  });
});

describe('listFilterRouteParams', () => {
  const params = listFilterRouteParams(definitions);
  const config = {
    keys: DEFAULT_LIST_QUERY_ROUTE_KEYS,
    defaults: { pageSize: 24, sort: null, filters: {} },
    filters: params,
  };

  it('maps a static multiselect to its allowed values', () => {
    expect(params.types?.key).toBeUndefined();
    expect(params.types?.parse('image,gif,video')).toEqual(['image', 'video']);
  });

  it('takes any value for async options, under the url key', () => {
    expect(params.channels?.key).toBe('ch');
    expect(params.channels?.parse('se,xx')).toEqual(['se', 'xx']);
  });

  it('maps a date range to dateRangeParam', () => {
    expect(params.modified?.parse('week')).toEqual({ preset: 'week' });
    expect(params.modified?.parse('nope')).toBeUndefined();
  });

  it('restores and writes every filter', () => {
    const query = { types: 'video', ch: 'se', modified: 'today' };
    const state = readListQueryRoute<Filters>(query, config);
    expect(state.filters).toEqual({
      types: ['video'],
      channels: ['se'],
      modified: { preset: 'today' },
    });
    expect(writeListQueryRoute(state, config)).toEqual(query);
  });
});
