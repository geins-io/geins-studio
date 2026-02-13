// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

const { mockRoute } = vi.hoisted(() => ({
  mockRoute: { path: '/cms/products/123' },
}));

vi.mock('#app/composables/router', () => ({
  useRoute: () => mockRoute,
}));

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import { useEntityUrl } from '../useEntityUrl';

describe('useEntityUrl', () => {
  describe('with route /cms/products/123', () => {
    const setup = () => {
      mockRoute.path = '/cms/products/123';
      return useEntityUrl();
    };

    it('extracts entity name from route path', () => {
      expect(setup().getEntityName()).toBe('products');
    });

    it('returns entity base path', () => {
      expect(setup().getEntityBasePath()).toBe('/cms/products');
    });

    it('constructs new entity URL with alias', () => {
      expect(setup().getEntityNewUrl()).toBe(
        '/cms/products/new_entity_url_alias',
      );
    });

    it('constructs entity URL with given id', () => {
      expect(setup().getEntityUrl('456')).toBe('/cms/products/456');
    });

    it('constructs entity list URL with alias', () => {
      expect(setup().getEntityListUrl()).toBe(
        '/cms/products/list_entity_url_alias',
      );
    });
  });

  describe('with dashed entity name /cms/product-variants/42', () => {
    it('converts dashes to underscores in entity name', () => {
      mockRoute.path = '/cms/product-variants/42';
      const { getEntityName } = useEntityUrl();
      expect(getEntityName()).toBe('product_variants');
    });
  });

  describe('with short path /cms', () => {
    it('returns empty string for entity name', () => {
      mockRoute.path = '/cms';
      const { getEntityName } = useEntityUrl();
      expect(getEntityName()).toBe('');
    });

    it('returns "/" for entity base path', () => {
      mockRoute.path = '/cms';
      const { getEntityBasePath } = useEntityUrl();
      expect(getEntityBasePath()).toBe('/');
    });
  });

  describe('with deeper path /cms/content/pages/abc', () => {
    it('extracts second-to-last segment as entity name', () => {
      mockRoute.path = '/cms/content/pages/abc';
      const { getEntityName } = useEntityUrl();
      expect(getEntityName()).toBe('pages');
    });

    it('returns base path without last segment', () => {
      mockRoute.path = '/cms/content/pages/abc';
      const { getEntityBasePath } = useEntityUrl();
      expect(getEntityBasePath()).toBe('/cms/content/pages');
    });
  });

  describe('getEntityNewUrlFor', () => {
    it('constructs new URL for a given entity and parent', () => {
      mockRoute.path = '/cms/products/123';
      const { getEntityNewUrlFor } = useEntityUrl();
      expect(getEntityNewUrlFor('categories', 'cms')).toBe(
        '/cms/categories/new_entity_url_alias',
      );
    });
  });

  describe('getEntityListUrlFor', () => {
    it('constructs list URL for a given entity and parent', () => {
      mockRoute.path = '/cms/products/123';
      const { getEntityListUrlFor } = useEntityUrl();
      expect(getEntityListUrlFor('categories', 'cms')).toBe(
        '/cms/categories/list_entity_url_alias',
      );
    });
  });

  describe('computed aliases', () => {
    it('newEntityUrlAlias returns translated key', () => {
      mockRoute.path = '/cms/products/123';
      const { newEntityUrlAlias } = useEntityUrl();
      expect(newEntityUrlAlias.value).toBe('new_entity_url_alias');
    });

    it('listEntityUrlAlias returns translated key', () => {
      mockRoute.path = '/cms/products/123';
      const { listEntityUrlAlias } = useEntityUrl();
      expect(listEntityUrlAlias.value).toBe('list_entity_url_alias');
    });
  });
});
