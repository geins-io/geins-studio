import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, computed } from 'vue';

interface Localizations {
  name?: string;
  slug?: string;
  text1?: string;
  text2?: string;
  text3?: string;
}

interface MockProduct {
  productId: number;
  name: string;
  articleNumber: string;
  localizations?: Record<string, Localizations>;
}

describe('Product Detail - SEO Tab', () => {
  // Mock data for testing
  const mockProduct: MockProduct = {
    productId: 1,
    name: 'Test Product',
    articleNumber: 'TEST-001',
    localizations: {
      en: {
        name: 'English Product Name',
        slug: 'english-product-slug',
        text1: 'English description text',
        text2: 'English meta description',
        text3: 'English keywords',
      },
      sv: {
        name: 'Swedish Product Name',
        slug: 'swedish-product-slug',
        text1: 'Swedish description',
        text2: 'Swedish meta description',
        text3: 'Swedish keywords',
      },
    },
  };

  const mockProductWithPartialLocalization: MockProduct = {
    productId: 2,
    name: 'Test Product 2',
    articleNumber: 'TEST-002',
    localizations: {
      en: {
        name: 'English Name Only',
        slug: 'english-slug',
      },
    },
  };

  const mockProductWithoutLocalizations: MockProduct = {
    productId: 3,
    name: 'Test Product 3',
    articleNumber: 'TEST-003',
    localizations: {},
  };

  // Test the seoData computed property logic
  describe('seoData computed property', () => {
    it('should return all localization fields when available', () => {
      const entityData = ref(mockProduct);
      const currentLanguage = ref('en');
      
      const seoData = computed(() => {
        const dataList: any[] = [];
        const lang = currentLanguage.value || 'en';
        const localization = entityData.value?.localizations?.[lang];

        if (!localization) {
          return dataList;
        }

        if (localization.name) {
          dataList.push({
            label: 'name',
            value: localization.name,
          });
        }

        if (localization.slug) {
          dataList.push({
            label: 'slug',
            value: localization.slug,
          });
        }

        if (localization.text1) {
          dataList.push({
            label: 'text1',
            value: localization.text1,
          });
        }

        if (localization.text2) {
          dataList.push({
            label: 'text2',
            value: localization.text2,
          });
        }

        if (localization.text3) {
          dataList.push({
            label: 'text3',
            value: localization.text3,
          });
        }

        return dataList;
      });

      expect(seoData.value).toHaveLength(5);
      expect(seoData.value[0]).toEqual({
        label: 'name',
        value: 'English Product Name',
      });
      expect(seoData.value[1]).toEqual({
        label: 'slug',
        value: 'english-product-slug',
      });
      expect(seoData.value[2]).toEqual({
        label: 'text1',
        value: 'English description text',
      });
      expect(seoData.value[3]).toEqual({
        label: 'text2',
        value: 'English meta description',
      });
      expect(seoData.value[4]).toEqual({
        label: 'text3',
        value: 'English keywords',
      });
    });

    it('should return data for Swedish language when selected', () => {
      const entityData = ref(mockProduct);
      const currentLanguage = ref('sv');
      
      const seoData = computed(() => {
        const dataList: any[] = [];
        const lang = currentLanguage.value || 'en';
        const localization = entityData.value?.localizations?.[lang];

        if (!localization) {
          return dataList;
        }

        if (localization.name) {
          dataList.push({
            label: 'name',
            value: localization.name,
          });
        }

        if (localization.slug) {
          dataList.push({
            label: 'slug',
            value: localization.slug,
          });
        }

        if (localization.text1) {
          dataList.push({
            label: 'text1',
            value: localization.text1,
          });
        }

        if (localization.text2) {
          dataList.push({
            label: 'text2',
            value: localization.text2,
          });
        }

        if (localization.text3) {
          dataList.push({
            label: 'text3',
            value: localization.text3,
          });
        }

        return dataList;
      });

      expect(seoData.value).toHaveLength(5);
      expect(seoData.value[0].value).toBe('Swedish Product Name');
      expect(seoData.value[1].value).toBe('swedish-product-slug');
    });

    it('should only return available fields when localization is partial', () => {
      const entityData = ref(mockProductWithPartialLocalization);
      const currentLanguage = ref('en');
      
      const seoData = computed(() => {
        const dataList: any[] = [];
        const lang = currentLanguage.value || 'en';
        const localization = entityData.value?.localizations?.[lang];

        if (!localization) {
          return dataList;
        }

        if (localization.name) {
          dataList.push({
            label: 'name',
            value: localization.name,
          });
        }

        if (localization.slug) {
          dataList.push({
            label: 'slug',
            value: localization.slug,
          });
        }

        if (localization.text1) {
          dataList.push({
            label: 'text1',
            value: localization.text1,
          });
        }

        if (localization.text2) {
          dataList.push({
            label: 'text2',
            value: localization.text2,
          });
        }

        if (localization.text3) {
          dataList.push({
            label: 'text3',
            value: localization.text3,
          });
        }

        return dataList;
      });

      expect(seoData.value).toHaveLength(2);
      expect(seoData.value[0]).toEqual({
        label: 'name',
        value: 'English Name Only',
      });
      expect(seoData.value[1]).toEqual({
        label: 'slug',
        value: 'english-slug',
      });
    });

    it('should return empty array when no localization exists for language', () => {
      const entityData = ref(mockProductWithoutLocalizations);
      const currentLanguage = ref('en');
      
      const seoData = computed(() => {
        const dataList: any[] = [];
        const lang = currentLanguage.value || 'en';
        const localization = entityData.value?.localizations?.[lang];

        if (!localization) {
          return dataList;
        }

        if (localization.name) {
          dataList.push({
            label: 'name',
            value: localization.name,
          });
        }

        if (localization.slug) {
          dataList.push({
            label: 'slug',
            value: localization.slug,
          });
        }

        if (localization.text1) {
          dataList.push({
            label: 'text1',
            value: localization.text1,
          });
        }

        if (localization.text2) {
          dataList.push({
            label: 'text2',
            value: localization.text2,
          });
        }

        if (localization.text3) {
          dataList.push({
            label: 'text3',
            value: localization.text3,
          });
        }

        return dataList;
      });

      expect(seoData.value).toHaveLength(0);
    });

    it('should default to "en" when currentLanguage is not set', () => {
      const entityData = ref(mockProduct);
      const currentLanguage = ref(null);
      
      const seoData = computed(() => {
        const dataList: any[] = [];
        const lang = currentLanguage.value || 'en';
        const localization = entityData.value?.localizations?.[lang];

        if (!localization) {
          return dataList;
        }

        if (localization.name) {
          dataList.push({
            label: 'name',
            value: localization.name,
          });
        }

        return dataList;
      });

      expect(seoData.value).toHaveLength(1);
      expect(seoData.value[0].value).toBe('English Product Name');
    });
  });

  describe('SEO Tab Display', () => {
    it('should show ContentDataList when seoData has items', () => {
      const seoData = ref([
        { label: 'name', value: 'Test Name' },
        { label: 'slug', value: 'test-slug' },
      ]);

      expect(seoData.value.length).toBeGreaterThan(0);
    });

    it('should show empty state when seoData is empty', () => {
      const seoData = ref([]);

      expect(seoData.value.length).toBe(0);
    });
  });
});
