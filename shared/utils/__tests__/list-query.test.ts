import { describe, it, expect } from 'vitest';
import type { ListDateRange, ListQueryState } from '#shared/types';
import {
  DEFAULT_LIST_QUERY_ROUTE_KEYS,
  dateRangeParam,
  listParam,
  listQueryRouteKeys,
  readListQueryRoute,
  resolveListDateRange,
  stringParam,
  writeListQueryRoute,
  type ListQueryRouteConfig,
} from '../list-query';

interface Filters {
  types?: ('image' | 'video')[];
  owner?: string;
}

const config: ListQueryRouteConfig<Filters> = {
  keys: DEFAULT_LIST_QUERY_ROUTE_KEYS,
  defaults: { pageSize: 24, sort: null, filters: {} },
  pageSizes: [24, 48],
  sortFields: ['name', 'updatedAt'],
  filters: {
    types: listParam(['image', 'video'] as const),
    owner: { ...stringParam(), key: 'by' },
  },
};

const defaults = {
  page: 1,
  pageSize: 24,
  sort: null,
  search: '',
  filters: {},
};

describe('readListQueryRoute', () => {
  it('takes the defaults for an empty query', () => {
    expect(readListQueryRoute({}, config)).toEqual(defaults);
  });

  it('reads every key', () => {
    expect(
      readListQueryRoute(
        {
          page: '3',
          perPage: '48',
          sort: '-name',
          q: ' logo ',
          types: 'image,video',
          by: 'olivia',
        },
        config,
      ),
    ).toEqual({
      page: 3,
      pageSize: 48,
      sort: { field: 'name', direction: 'desc' },
      search: 'logo',
      filters: { types: ['image', 'video'], owner: 'olivia' },
    });
  });

  it('falls back to defaults for invalid values', () => {
    expect(
      readListQueryRoute(
        {
          page: 'abc',
          perPage: '15',
          sort: '-bogus',
          types: 'pdf,image,image',
        },
        config,
      ),
    ).toEqual({ ...defaults, filters: { types: ['image'] } });
    expect(readListQueryRoute({ page: '0' }, config).page).toBe(1);
    expect(readListQueryRoute({ page: '2.5' }, config).page).toBe(1);
    expect(readListQueryRoute({ types: 'pdf' }, config).filters).toEqual({});
  });

  it('reads the first value of a repeated key', () => {
    expect(readListQueryRoute({ page: ['2', '5'] }, config).page).toBe(2);
  });

  it('lets an empty key clear a non-empty default', () => {
    const withDefaults: ListQueryRouteConfig<Filters> = {
      ...config,
      defaults: {
        ...config.defaults,
        sort: { field: 'updatedAt', direction: 'desc' },
        filters: { types: ['image'] },
      },
    };
    expect(readListQueryRoute({}, withDefaults)).toMatchObject({
      sort: { field: 'updatedAt', direction: 'desc' },
      filters: { types: ['image'] },
    });
    expect(
      readListQueryRoute({ sort: '', types: '' }, withDefaults),
    ).toMatchObject({ sort: null, filters: {} });
  });

  it('accepts any sort field without an allow-list', () => {
    const open = { ...config, sortFields: undefined };
    expect(readListQueryRoute({ sort: 'anything' }, open).sort).toEqual({
      field: 'anything',
      direction: 'asc',
    });
  });
});

describe('writeListQueryRoute', () => {
  it('omits every default', () => {
    expect(writeListQueryRoute(defaults, config)).toEqual({});
  });

  it('writes non-default values', () => {
    expect(
      writeListQueryRoute(
        {
          page: 2,
          pageSize: 48,
          sort: { field: 'name', direction: 'desc' },
          search: 'logo',
          filters: { types: ['image', 'video'], owner: 'olivia' },
        },
        config,
      ),
    ).toEqual({
      page: '2',
      perPage: '48',
      sort: '-name',
      q: 'logo',
      types: 'image,video',
      by: 'olivia',
    });
  });

  it('omits empty filters and writes a cleared default as an empty key', () => {
    expect(
      writeListQueryRoute({ ...defaults, filters: { types: [] } }, config),
    ).toEqual({});
    const withDefault: ListQueryRouteConfig<Filters> = {
      ...config,
      defaults: {
        ...config.defaults,
        sort: { field: 'updatedAt', direction: 'desc' },
      },
    };
    expect(writeListQueryRoute(defaults, withDefault)).toEqual({ sort: '' });
  });

  it('round-trips through read', () => {
    const state: ListQueryState<Filters> = {
      page: 4,
      pageSize: 48,
      sort: { field: 'updatedAt', direction: 'asc' },
      search: 'hero',
      filters: { types: ['video'] },
    };
    expect(
      readListQueryRoute(writeListQueryRoute(state, config), config),
    ).toEqual(state);
  });

  it('honours overridden keys', () => {
    const keyed = {
      ...config,
      keys: { ...DEFAULT_LIST_QUERY_ROUTE_KEYS, page: 'p', search: 's' },
    };
    expect(
      writeListQueryRoute({ ...defaults, page: 2, search: 'x' }, keyed),
    ).toEqual({ p: '2', s: 'x' });
    expect(readListQueryRoute({ p: '3', page: '9' }, keyed).page).toBe(3);
  });
});

describe('listQueryRouteKeys', () => {
  it('lists the state keys plus each filter key', () => {
    expect(listQueryRouteKeys(config)).toEqual([
      'page',
      'perPage',
      'sort',
      'q',
      'types',
      'by',
    ]);
  });
});

describe('dateRangeParam', () => {
  const param = dateRangeParam();
  const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);
  const endOf = (y: number, m: number, d: number) =>
    new Date(y, m - 1, d, 23, 59, 59, 999);

  it('reads and writes a preset', () => {
    expect(param.parse('week')).toEqual({ preset: 'week' });
    expect(param.serialize({ preset: 'month' })).toBe('month');
  });

  it('reads local days as the start and end of those days', () => {
    expect(param.parse('2026-09-01..2026-09-30')).toEqual({
      from: day(2026, 9, 1).toISOString(),
      to: endOf(2026, 9, 30).toISOString(),
    });
  });

  it('round-trips a custom range, including open ends', () => {
    for (const raw of [
      '2026-09-01..2026-09-30',
      '2026-09-01..',
      '..2026-09-30',
      '2026-09-15..2026-09-15',
    ]) {
      const value = param.parse(raw);
      expect(value).toBeDefined();
      expect(param.serialize(value!)).toBe(raw);
    }
  });

  it('rejects garbage', () => {
    for (const raw of [
      '',
      'yesterday',
      '..',
      '2026-09-01',
      '2026-09-01..2026-09-02..2026-09-03',
      '2026-02-31..',
      '2026-9-1..',
      'abc..2026-09-01',
      '2026-09-30..2026-09-01',
    ])
      expect(param.parse(raw)).toBeUndefined();
  });

  it('serializes an empty range as empty', () => {
    expect(param.serialize({})).toBe('');
  });

  it('syncs through the route helpers', () => {
    interface RangeFilters {
      modified?: ListDateRange;
    }
    const rangeConfig: ListQueryRouteConfig<RangeFilters> = {
      keys: DEFAULT_LIST_QUERY_ROUTE_KEYS,
      defaults: { pageSize: 24, sort: null, filters: {} },
      filters: { modified: dateRangeParam() },
    };
    const state = readListQueryRoute({ modified: 'today' }, rangeConfig);
    expect(state.filters).toEqual({ modified: { preset: 'today' } });
    expect(writeListQueryRoute(state, rangeConfig)).toEqual({
      modified: 'today',
    });
  });
});

describe('resolveListDateRange', () => {
  // Wednesday 2026-09-30, mid-afternoon local time.
  const now = new Date(2026, 8, 30, 15, 42);
  const iso = (
    y: number,
    m: number,
    d: number,
    h = 0,
    min = 0,
    sec = 0,
    ms = 0,
  ) => new Date(y, m - 1, d, h, min, sec, ms).toISOString();

  it('resolves today to the whole local day', () => {
    expect(resolveListDateRange({ preset: 'today' }, now)).toEqual({
      from: iso(2026, 9, 30),
      to: iso(2026, 9, 30, 23, 59, 59, 999),
    });
  });

  it('resolves this week from Monday to Sunday', () => {
    expect(resolveListDateRange({ preset: 'week' }, now)).toEqual({
      from: iso(2026, 9, 28),
      to: iso(2026, 10, 4, 23, 59, 59, 999),
    });
    // A Sunday still belongs to the week that started the Monday before.
    expect(
      resolveListDateRange({ preset: 'week' }, new Date(2026, 9, 4, 10)).from,
    ).toBe(iso(2026, 9, 28));
  });

  it('resolves this month from the 1st to the last day', () => {
    expect(resolveListDateRange({ preset: 'month' }, now)).toEqual({
      from: iso(2026, 9, 1),
      to: iso(2026, 9, 30, 23, 59, 59, 999),
    });
  });

  it('resolves against the time it is called, not when it was picked', () => {
    const range = { preset: 'today' as const };
    const later = new Date(2026, 9, 1, 0, 5);
    expect(resolveListDateRange(range, later).from).toBe(iso(2026, 10, 1));
  });

  it('passes a custom range through', () => {
    const range = { from: iso(2026, 9, 1), to: iso(2026, 9, 2) };
    expect(resolveListDateRange(range, now)).toEqual(range);
  });
});
