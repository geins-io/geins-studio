import { describe, it, expect } from 'vitest';
import type { ListQueryState } from '#shared/types';
import {
  DEFAULT_LIST_QUERY_ROUTE_KEYS,
  listParam,
  listQueryRouteKeys,
  readListQueryRoute,
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
