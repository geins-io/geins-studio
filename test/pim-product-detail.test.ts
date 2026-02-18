/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const PRODUCT_DETAIL_FILE = resolve(
  process.cwd(),
  'app/pages/pim/product/[id].vue',
);

describe('PIM Product Detail Page', () => {
  it('should have a product detail page file at app/pages/pim/product/[id].vue', () => {
    expect(existsSync(PRODUCT_DETAIL_FILE)).toBe(true);
  });

  it('should use script setup with TypeScript', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<script setup lang="ts">');
  });

  it('should import required types from shared/types', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain("from '#shared/types'");
    expect(content).toContain('Product');
    expect(content).toContain('ProductCreate');
    expect(content).toContain('ProductUpdate');
    expect(content).toContain('ProductApiOptions');
  });

  it('should use useEntityEdit composable', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('useEntityEdit');
    expect(content).toContain('repository: productApi');
  });

  it('should define six tabs: General, Variants, Pricing, Stock, Images, SEO', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    
    // Check tabs array definition
    expect(content).toContain('const tabs = [');
    
    // Check for all six tab translations
    expect(content).toMatch(/t\(['"]general['"]\)/);
    expect(content).toMatch(/t\(['"]variants['"]\)/);
    expect(content).toMatch(/t\(['"]pricing['"]\)/);
    expect(content).toMatch(/t\(['"]stock['"]\)/);
    expect(content).toMatch(/t\(['"]images['"]\)/);
    expect(content).toMatch(/t\(['"]seo['"]\)/);
  });

  it('should use ContentEditWrap component structure', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<ContentEditWrap>');
    expect(content).toContain('</ContentEditWrap>');
  });

  it('should use ContentEditMain with sidebar', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<ContentEditMain');
    expect(content).toContain(':show-sidebar="showSidebar"');
    expect(content).toContain('<template #sidebar>');
  });

  it('should use ContentEditTabs component', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<ContentEditTabs');
    expect(content).toContain('v-model:current-tab="currentTab"');
    expect(content).toContain(':tabs="tabs"');
  });

  it('should render all six tab contents with KeepAlive', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    
    // Check for KeepAlive wrapping
    expect(content.match(/<KeepAlive>/g)?.length).toBeGreaterThanOrEqual(6);
    
    // Check for all tab conditions
    expect(content).toContain('v-if="currentTab === 0"'); // General
    expect(content).toContain('v-if="currentTab === 1"'); // Variants
    expect(content).toContain('v-if="currentTab === 2"'); // Pricing
    expect(content).toContain('v-if="currentTab === 3"'); // Stock
    expect(content).toContain('v-if="currentTab === 4"'); // Images
    expect(content).toContain('v-if="currentTab === 5"'); // SEO
  });

  it('should use ContentEditMainContent for each tab', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    const matches = content.match(/<ContentEditMainContent/g);
    expect(matches).toBeTruthy();
    expect(matches!.length).toBeGreaterThanOrEqual(6);
  });

  it('should include ContentEditSummary in sidebar', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<ContentEditSummary');
    expect(content).toContain('v-model:active="entityDataUpdate.active"');
    expect(content).toContain('v-bind="summaryProps"');
  });

  it('should display product ID in summary', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('summary = computed<DataItem[]>');
    expect(content).toContain('productId');
    expect(content).toContain("label: t('entity_id', { entityName })");
  });

  it('should display product name in summary', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain("label: t('entity_name', { entityName })");
    expect(content).toContain('entityData.value?.name');
  });

  it('should display article number in summary', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('articleNumber');
    expect(content).toContain("label: t('article_number')");
  });

  it('should include active/inactive toggle capability', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('v-model:active="entityDataUpdate.active"');
    expect(content).toContain('entityLiveStatus');
  });

  it('should have save button in action bar', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<ButtonIcon');
    expect(content).toContain('icon="save"');
    expect(content).toContain(':disabled="!hasUnsavedChanges"');
    expect(content).toContain('@click="handleSave"');
  });

  it('should have dropdown menu with new and delete actions', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<DropdownMenu');
    expect(content).toContain('LucidePlus');
    expect(content).toContain('LucideTrash');
    expect(content).toContain('@click="openDeleteDialog"');
  });

  it('should include unsaved changes dialog', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<DialogUnsavedChanges');
    expect(content).toContain('v-model:open="unsavedChangesDialogOpen"');
    expect(content).toContain('@confirm="confirmLeave"');
  });

  it('should include delete confirmation dialog', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<DialogDelete');
    expect(content).toContain('v-model:open="deleteDialogOpen"');
    expect(content).toContain('@confirm="confirmDelete"');
  });

  it('should have form validation with zod schema', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain("import * as z from 'zod'");
    expect(content).toContain('toTypedSchema');
    expect(content).toContain('formSchema');
    expect(content).toContain('validationSchema: formSchema');
  });

  it('should validate required fields (name and articleNumber)', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('name: z.string().min(1');
    expect(content).toContain('articleNumber: z.string().min(1');
  });

  it('should use FormField components for inputs', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<FormField');
    expect(content).toContain('name="default.name"');
    expect(content).toContain('name="default.articleNumber"');
  });

  it('should use ContentEditCard for General tab', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<ContentEditCard');
    expect(content).toContain('product_general_info');
  });

  it('should show ContentEditHasChanges indicator', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('<ContentEditHasChanges');
    expect(content).toContain(':changes="hasUnsavedChanges"');
  });

  it('should handle entity data loading with useAsyncData', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('useAsyncData');
    expect(content).toContain('productApi.get');
    expect(content).toContain('if (!createMode.value)');
  });

  it('should have error handling setup', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('usePageError');
    expect(content).toContain('handleFetchResult');
    expect(content).toContain('showErrorToast');
  });

  it('should use useEntityEditSummary for summary props', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    expect(content).toContain('useEntityEditSummary');
    expect(content).toContain('summaryProps');
  });

  it('should have SEO tab with real content implementation', async () => {
    const content = await readFile(PRODUCT_DETAIL_FILE, 'utf-8');
    // All tabs are now implemented with real content
    expect(content).toContain('seoData');
    expect(content).toContain('ContentDataList');
    expect(content).toContain('no_seo_data_available');
  });
});

describe('PIM Product Detail i18n Keys', () => {
  const EN_FILE = resolve(process.cwd(), 'i18n/locales/en.json');
  const SV_FILE = resolve(process.cwd(), 'i18n/locales/sv.json');

  it('should have variants key in en.json', async () => {
    const content = await readFile(EN_FILE, 'utf-8');
    const json = JSON.parse(content);
    expect(json.variants).toBeDefined();
    expect(json.variants).toBe('Variants');
  });

  it('should have images key in en.json', async () => {
    const content = await readFile(EN_FILE, 'utf-8');
    const json = JSON.parse(content);
    expect(json.images).toBeDefined();
    expect(json.images).toBe('Images');
  });

  it('should have seo key in en.json', async () => {
    const content = await readFile(EN_FILE, 'utf-8');
    const json = JSON.parse(content);
    expect(json.seo).toBeDefined();
    expect(json.seo).toBe('SEO');
  });

  it('should have article_number key in en.json', async () => {
    const content = await readFile(EN_FILE, 'utf-8');
    const json = JSON.parse(content);
    expect(json.article_number).toBeDefined();
    expect(json.article_number).toBe('Article number');
  });

  it('should have product description keys in en.json', async () => {
    const content = await readFile(EN_FILE, 'utf-8');
    const json = JSON.parse(content);
    expect(json.product_general_info).toBeDefined();
    expect(json.product_variants_description).toBeDefined();
    expect(json.product_pricing_description).toBeDefined();
    expect(json.product_stock_description).toBeDefined();
    expect(json.product_images_description).toBeDefined();
    expect(json.product_seo_description).toBeDefined();
  });

  it('should have SEO-related keys in en.json', async () => {
    const content = await readFile(EN_FILE, 'utf-8');
    const json = JSON.parse(content);
    // All tabs are now implemented with real content, SEO tab needs these keys
    expect(json.no_seo_data_available).toBeDefined();
    expect(json.seo_metadata_for_language).toBeDefined();
  });

  it('should have corresponding keys in sv.json', async () => {
    const content = await readFile(SV_FILE, 'utf-8');
    const json = JSON.parse(content);
    expect(json.variants).toBe('Varianter');
    expect(json.images).toBe('Bilder');
    expect(json.seo).toBe('SEO');
    expect(json.article_number).toBe('Artikelnummer');
  });
});
