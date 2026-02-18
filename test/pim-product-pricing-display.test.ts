/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const COMPONENT_PATH = resolve(
  __dirname,
  '../app/components/pim/ProductPricingDisplay.vue',
);

describe('ProductPricingDisplay Component', () => {
  it('should exist', () => {
    expect(existsSync(COMPONENT_PATH)).toBe(true);
  });

  it('should have script setup with Props interface', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('<script setup lang="ts">');
    expect(content).toContain('interface Props');
  });

  it('should import ProductPrice type', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain("import type { ProductPrice } from '#shared/types'");
  });

  it('should define defaultPrice prop of type ProductPrice', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('defaultPrice: ProductPrice');
  });

  it('should define optional loading prop', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('loading?: boolean');
  });

  it('should use withDefaults for props', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('withDefaults(defineProps<Props>()');
    expect(content).toContain('loading: false');
  });

  it('should use useI18n composable', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('const { t } = useI18n()');
  });

  it('should use accountStore for currency', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('const accountStore = useAccountStore()');
    expect(content).toContain('const { currentCurrency } = storeToRefs(accountStore)');
  });

  it('should use locale from useCookieLocale', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('const locale = useCookieLocale()');
  });

  it('should have formatPrice function using Intl.NumberFormat', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('const formatPrice');
    expect(content).toContain('Intl.NumberFormat');
    expect(content).toContain("style: 'currency'");
    expect(content).toContain('currency: currentCurrency.value');
    expect(content).toContain('minimumFractionDigits: 2');
  });

  it('should have formatVatRate function', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('const formatVatRate');
    expect(content).toContain('Math.round(rate * 100)');
  });

  it('should display loading skeleton when loading is true', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('v-if="loading"');
    expect(content).toContain('<Skeleton');
  });

  it('should display selling price inc VAT', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain("$t('selling_price_inc_vat')");
    expect(content).toContain('defaultPrice.sellingPriceIncVat');
  });

  it('should display selling price ex VAT', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain("$t('selling_price_ex_vat')");
    expect(content).toContain('defaultPrice.sellingPriceExVat');
  });

  it('should display regular price inc VAT', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain("$t('regular_price_inc_vat')");
    expect(content).toContain('defaultPrice.regularPriceIncVat');
  });

  it('should display regular price ex VAT', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain("$t('regular_price_ex_vat')");
    expect(content).toContain('defaultPrice.regularPriceExVat');
  });

  it('should display VAT rate as percentage', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain("$t('vat_rate')");
    expect(content).toContain('formatVatRate(defaultPrice.vatRate)');
  });

  it('should use DataItem component for displaying prices', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('<DataItem');
    expect(content).toContain(':label=');
  });

  it('should group selling prices together', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain("$t('selling_price')");
    expect(content).toContain('<h3');
  });

  it('should group regular prices together', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain("$t('regular_price')");
  });

  it('should use grid layout for price pairs', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    expect(content).toContain('grid gap-4 sm:grid-cols-2');
  });

  it('should format all four price values', () => {
    const content = readFileSync(COMPONENT_PATH, 'utf-8');
    const formatPriceCount = (content.match(/formatPrice\(/g) || []).length;
    expect(formatPriceCount).toBe(4);
  });
});

describe('ProductPricingDisplay i18n Keys', () => {
  const EN_PATH = resolve(__dirname, '../i18n/locales/en.json');
  const SV_PATH = resolve(__dirname, '../i18n/locales/sv.json');

  it('should have selling_price key in en.json', () => {
    const content = readFileSync(EN_PATH, 'utf-8');
    expect(content).toContain('"selling_price"');
  });

  it('should have selling_price_inc_vat key in en.json', () => {
    const content = readFileSync(EN_PATH, 'utf-8');
    expect(content).toContain('"selling_price_inc_vat"');
  });

  it('should have selling_price_ex_vat key in en.json', () => {
    const content = readFileSync(EN_PATH, 'utf-8');
    expect(content).toContain('"selling_price_ex_vat"');
  });

  it('should have regular_price key in en.json', () => {
    const content = readFileSync(EN_PATH, 'utf-8');
    expect(content).toContain('"regular_price"');
  });

  it('should have regular_price_inc_vat key in en.json', () => {
    const content = readFileSync(EN_PATH, 'utf-8');
    expect(content).toContain('"regular_price_inc_vat"');
  });

  it('should have regular_price_ex_vat key in en.json', () => {
    const content = readFileSync(EN_PATH, 'utf-8');
    expect(content).toContain('"regular_price_ex_vat"');
  });

  it('should have vat_rate key in en.json', () => {
    const content = readFileSync(EN_PATH, 'utf-8');
    expect(content).toContain('"vat_rate"');
  });

  it('should have selling_price key in sv.json', () => {
    const content = readFileSync(SV_PATH, 'utf-8');
    expect(content).toContain('"selling_price"');
  });

  it('should have selling_price_inc_vat key in sv.json', () => {
    const content = readFileSync(SV_PATH, 'utf-8');
    expect(content).toContain('"selling_price_inc_vat"');
  });

  it('should have selling_price_ex_vat key in sv.json', () => {
    const content = readFileSync(SV_PATH, 'utf-8');
    expect(content).toContain('"selling_price_ex_vat"');
  });

  it('should have regular_price key in sv.json', () => {
    const content = readFileSync(SV_PATH, 'utf-8');
    expect(content).toContain('"regular_price"');
  });

  it('should have regular_price_inc_vat key in sv.json', () => {
    const content = readFileSync(SV_PATH, 'utf-8');
    expect(content).toContain('"regular_price_inc_vat"');
  });

  it('should have regular_price_ex_vat key in sv.json', () => {
    const content = readFileSync(SV_PATH, 'utf-8');
    expect(content).toContain('"regular_price_ex_vat"');
  });

  it('should have vat_rate key in sv.json', () => {
    const content = readFileSync(SV_PATH, 'utf-8');
    expect(content).toContain('"vat_rate"');
  });
});

describe('Product Detail Page - Pricing Tab Integration', () => {
  const DETAIL_PAGE_PATH = resolve(
    __dirname,
    '../app/pages/pim/product/[id].vue',
  );

  it('should import ProductPricingDisplay component', () => {
    const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
    // Component is auto-imported, but should be used in template
    expect(content).toContain('<ProductPricingDisplay');
  });

  it('should pass defaultPrice prop to ProductPricingDisplay', () => {
    const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
    expect(content).toContain(':default-price=');
    expect(content).toContain('entityData?.defaultPrice || entityBase.defaultPrice');
  });

  it('should pass loading prop to ProductPricingDisplay', () => {
    const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
    expect(content).toContain(':loading="loading"');
  });

  it('should use ProductPricingDisplay in Pricing tab (currentTab === 2)', () => {
    const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
    expect(content).toContain('v-if="currentTab === 2"');
    // Verify ProductPricingDisplay is in the same content block
    const pricingTabMatch = content.match(
      /v-if="currentTab === 2"[\s\S]*?<\/KeepAlive>/,
    );
    expect(pricingTabMatch).toBeTruthy();
    expect(pricingTabMatch?.[0]).toContain('ProductPricingDisplay');
  });

  it('should use ContentEditCard for Pricing tab', () => {
    const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
    const pricingTabMatch = content.match(
      /v-if="currentTab === 2"[\s\S]*?<\/KeepAlive>/,
    );
    expect(pricingTabMatch?.[0]).toContain('ContentEditCard');
  });

  it('should not have pricing_content_placeholder in Pricing tab', () => {
    const content = readFileSync(DETAIL_PAGE_PATH, 'utf-8');
    const pricingTabMatch = content.match(
      /v-if="currentTab === 2"[\s\S]*?<\/KeepAlive>/,
    );
    expect(pricingTabMatch?.[0]).not.toContain('pricing_content_placeholder');
  });
});
