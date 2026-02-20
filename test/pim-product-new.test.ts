// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

describe('PIM Product New Page', () => {
  const filePath = path.join(
    process.cwd(),
    'app',
    'pages',
    'pim',
    'product',
    'new.vue',
  );

  describe('File existence and structure', () => {
    it('should exist at app/pages/pim/product/new.vue', () => {
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have script setup with TypeScript', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<script setup lang="ts">');
    });

    it('should have a template section', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<template>');
      expect(content).toContain('</template>');
    });
  });

  describe('Imports and types', () => {
    it('should import zod and vee-validate schema', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("import { toTypedSchema } from '@vee-validate/zod'");
      expect(content).toContain("import * as z from 'zod'");
    });

    it('should import Product types from shared types', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("import type { Product, ProductCreate, ProductUpdate, ProductApiOptions } from '#shared/types'");
    });

    it('should import useToast composable', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("import { useToast } from '@/components/ui/toast/use-toast'");
    });
  });

  describe('Composables and stores', () => {
    it('should use useI18n composable', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("const { t } = useI18n()");
    });

    it('should use useToast composable', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("const { toast } = useToast()");
    });

    it('should use useGeinsLog composable', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("const { geinsLogError } = useGeinsLog(scope)");
      expect(content).toContain("const scope = 'pages/pim/product/new.vue'");
    });

    it('should use useProductsStore', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('const productsStore = useProductsStore()');
    });

    it('should extract brands and categories from productsStore', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('const { brands, categories } = storeToRefs(productsStore)');
    });

    it('should use useGeinsRepository for productApi', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('const { productApi } = useGeinsRepository()');
    });
  });

  describe('Form validation schema', () => {
    it('should define formSchema with toTypedSchema', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('const formSchema = toTypedSchema(');
    });

    it('should have name field as required string', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('name: z.string().min(1');
    });

    it('should have articleNumber field as required string', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('articleNumber: z.string().min(1');
    });

    it('should have brandId as optional number', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('brandId: z.number().optional()');
    });

    it('should have mainCategoryId as optional number', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('mainCategoryId: z.number().optional()');
    });
  });

  describe('Entity data setup', () => {
    it('should define entityBase with ProductCreate type', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('const entityBase: ProductCreate = {');
    });

    it('should include all required ProductCreate fields', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('productId: 0');
      expect(content).toContain("name: ''");
      expect(content).toContain("articleNumber: ''");
      expect(content).toContain('active: false');
      expect(content).toContain('brandId: 0');
      expect(content).toContain('mainCategoryId: 0');
      expect(content).toContain('defaultPrice: {');
    });
  });

  describe('useEntityEdit composable', () => {
    it('should use useEntityEdit with correct generic types', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('useEntityEdit<');
      expect(content).toContain('ProductCreate,');
      expect(content).toContain('Product,');
      expect(content).toContain('ProductUpdate,');
      expect(content).toContain('ProductApiOptions');
    });

    it('should configure repository with productApi', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('repository: productApi');
    });

    it('should configure validationSchema', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('validationSchema: formSchema');
    });

    it('should configure initialEntityData', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('initialEntityData: entityBase');
    });

    it('should define getInitialFormValues callback', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('getInitialFormValues: (entityData) => ({');
    });

    it('should define reshapeEntityData callback', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('reshapeEntityData: (entityData) => entityData');
    });

    it('should define parseEntityData callback', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('parseEntityData: (entity) => {');
    });

    it('should define prepareCreateData callback', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('prepareCreateData: (formData) => ({');
    });

    it('should define prepareUpdateData callback', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('prepareUpdateData: (formData, entity) => {');
    });

    it('should define onFormValuesChange callback', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('onFormValuesChange: (values) => {');
    });

    it('should extract required refs from useEntityEdit', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('entityName,');
      expect(content).toContain('createMode,');
      expect(content).toContain('loading,');
      expect(content).toContain('entityListUrl,');
      expect(content).toContain('entityDataCreate,');
      expect(content).toContain('entityData,');
      expect(content).toContain('entityPageTitle,');
      expect(content).toContain('form,');
      expect(content).toContain('formValid,');
      expect(content).toContain('createEntity,');
    });
  });

  describe('Form data preparation', () => {
    it('should map form fields correctly in getInitialFormValues', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('default: {');
      expect(content).toContain("name: entityData.name || ''");
      expect(content).toContain("articleNumber: entityData.articleNumber || ''");
      expect(content).toContain('brandId: entityData.brandId || 0');
      expect(content).toContain('mainCategoryId: entityData.mainCategoryId || 0');
    });

    it('should set form values in parseEntityData', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('form.setValues({');
    });

    it('should spread formData in prepareCreateData', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('...entityBase,');
      expect(content).toContain('...formData.default,');
    });

    it('should handle brandId and mainCategoryId in prepareCreateData', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('brandId: formData.default.brandId || 0');
      expect(content).toContain('mainCategoryId: formData.default.mainCategoryId || 0');
    });
  });

  describe('Entity actions', () => {
    it('should define handleCreate function', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('const handleCreate = async () => {');
    });

    it('should call createEntity in handleCreate', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('await createEntity()');
    });

    it('should handle errors in handleCreate', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('catch (error)');
      expect(content).toContain("geinsLogError('error creating product:', error)");
    });
  });

  describe('Store initialization', () => {
    it('should initialize productsStore onMounted', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('onMounted(() => {');
      expect(content).toContain('productsStore.init()');
    });
  });

  describe('Template structure', () => {
    it('should use ContentEditWrap component', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<ContentEditWrap>');
      expect(content).toContain('</ContentEditWrap>');
    });

    it('should have ContentHeader with title and entity name', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<ContentHeader :title="entityPageTitle" :entity-name="entityName"');
    });

    it('should have form with @submit.prevent', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<form @submit.prevent="handleCreate">');
    });

    it('should use ContentEditMain with showSidebar false', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<ContentEditMain :show-sidebar="false">');
    });

    it('should use ContentEditMainContent', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<ContentEditMainContent>');
      expect(content).toContain('</ContentEditMainContent>');
    });

    it('should use ContentEditCard with title and description', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<ContentEditCard');
      expect(content).toContain(':title="$t(\'create_entity\', { entityName })"');
      expect(content).toContain(':description="$t(\'product_create_description\')"');
    });
  });

  describe('Form fields', () => {
    it('should have name field with FormField', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<FormField v-slot="{ componentField }" name="default.name">');
    });

    it('should have articleNumber field with FormField', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<FormField v-slot="{ componentField }" name="default.articleNumber">');
    });

    it('should have brandId field with FormField', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<FormField v-slot="{ componentField }" name="default.brandId">');
    });

    it('should have mainCategoryId field with FormField', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<FormField v-slot="{ componentField }" name="default.mainCategoryId">');
    });

    it('should use Input component for name field', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<Input v-bind="componentField" type="text" />');
    });

    it('should use BrandSelector component for brandId field', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<BrandSelector');
      expect(content).toContain('v-bind="componentField"');
      expect(content).toContain(':brands="brands"');
    });

    it('should use Select component for mainCategoryId field', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<Select v-bind="componentField">');
      expect(content).toContain('<SelectTrigger>');
      expect(content).toContain('<SelectValue :placeholder="$t(\'select_category\')"');
    });

    it('should iterate over categories in Select', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('v-for="category in categories"');
      expect(content).toContain(':key="category._id"');
      expect(content).toContain(':value="Number(category._id)"');
    });

    it('should use FormItem, FormLabel, FormControl, FormMessage', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<FormItem>');
      expect(content).toContain('<FormLabel>');
      expect(content).toContain('<FormControl>');
      expect(content).toContain('<FormMessage />');
    });

    it('should use FormGrid with design "1+1"', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<FormGrid design="1+1">');
    });

    it('should wrap FormGrid in FormGridWrap', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<FormGridWrap>');
      expect(content).toContain('</FormGridWrap>');
    });
  });

  describe('Action buttons', () => {
    it('should have cancel button as secondary variant', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<Button variant="secondary" as-child>');
    });

    it('should have cancel button link to entityListUrl', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<NuxtLink :to="entityListUrl">');
      expect(content).toContain("{{ $t('cancel') }}");
    });

    it('should have create button with type="submit"', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('<Button');
      expect(content).toContain('type="submit"');
    });

    it('should have create button with loading state', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain(':loading="loading"');
    });

    it('should have create button disabled when form invalid or loading', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain(':disabled="!formValid || loading"');
    });

    it('should have buttons in flex row with gap', () => {
      const content = readFileSync(filePath, 'utf-8');
      // Allow for different class ordering
      expect(content).toMatch(/class="[^"]*flex[^"]*flex-row[^"]*justify-end[^"]*gap-4[^"]*"/);
    });
  });

  describe('i18n keys', () => {
    it('should use name translation key', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("{{ $t('name') }}");
    });

    it('should use article_number translation key', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("{{ $t('article_number') }}");
    });

    it('should use brand translation key', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("{{ $t('brand') }}");
    });

    it('should use main_category translation key', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("{{ $t('main_category') }}");
    });

    it('should use select_category translation key', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("$t('select_category')");
    });

    it('should use cancel translation key', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("{{ $t('cancel') }}");
    });

    it('should use create_entity translation key', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("$t('create_entity', { entityName })");
    });

    it('should use product_create_description translation key', () => {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain("$t('product_create_description')");
    });
  });
});

describe('PIM Product New Page - i18n keys', () => {
  const enPath = path.join(process.cwd(), 'i18n', 'locales', 'en.json');
  const svPath = path.join(process.cwd(), 'i18n', 'locales', 'sv.json');

  describe('English translations', () => {
    it('should have product_create_description key in en.json', () => {
      const content = readFileSync(enPath, 'utf-8');
      expect(content).toContain('"product_create_description"');
    });

    it('should have main_category key in en.json', () => {
      const content = readFileSync(enPath, 'utf-8');
      expect(content).toContain('"main_category"');
    });

    it('should have select_category key in en.json', () => {
      const content = readFileSync(enPath, 'utf-8');
      expect(content).toContain('"select_category"');
    });
  });

  describe('Swedish translations', () => {
    it('should have product_create_description key in sv.json', () => {
      const content = readFileSync(svPath, 'utf-8');
      expect(content).toContain('"product_create_description"');
    });

    it('should have main_category key in sv.json', () => {
      const content = readFileSync(svPath, 'utf-8');
      expect(content).toContain('"main_category"');
    });

    it('should have select_category key in sv.json', () => {
      const content = readFileSync(svPath, 'utf-8');
      expect(content).toContain('"select_category"');
    });
  });
});
