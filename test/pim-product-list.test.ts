// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('PIM Product List Page', () => {
  const projectRoot = join(__dirname, '..');
  const productListPath = join(projectRoot, 'app/pages/pim/product/list.vue');

  it('should have product list page at /app/pages/pim/product/list.vue', () => {
    expect(existsSync(productListPath)).toBe(true);
  });

  it('should define the list page with required structure', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for script setup
    expect(content).toContain('<script setup lang="ts">');
    
    // Check for Product type import
    expect(content).toContain("type { Product }");
    
    // Check for pageType meta
    expect(content).toContain("pageType: 'list'");
    
    // Check for template
    expect(content).toContain('<template>');
  });

  it('should use useAsyncData to fetch products', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for useAsyncData call
    expect(content).toContain('useAsyncData');
    expect(content).toContain('pim-products-list');
    expect(content).toContain('productApi.list()');
  });

  it('should use TableView component with columns', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for TableView component
    expect(content).toContain('<TableView');
    expect(content).toContain(':columns="columns"');
    expect(content).toContain(':data="dataList"');
    expect(content).toContain(':loading="loading"');
  });

  it('should configure columns with thumbnail, name, articleNumber, and active', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for column configuration
    expect(content).toContain("thumbnail: 'image'");
    expect(content).toContain("name: 'link'");
    expect(content).toContain("active: 'status'");
    expect(content).toContain("'articleNumber'");
  });

  it('should have ContentHeader with entity title and action bar', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for ContentHeader
    expect(content).toContain('<ContentHeader');
    expect(content).toContain('$t(entityName, 2)');
    
    // Check for ContentActionBar with new button
    expect(content).toContain('<ContentActionBar>');
    expect(content).toContain('ButtonIcon');
    expect(content).toContain('icon="new"');
  });

  it('should have error boundary for error handling', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for NuxtErrorBoundary
    expect(content).toContain('<NuxtErrorBoundary>');
    expect(content).toContain('#error=');
  });

  it('should have empty state with create action', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for empty state template slot
    expect(content).toContain('#empty-actions');
    expect(content).toContain('create_new_entity');
  });

  it('should configure name column to link to product detail page', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for link configuration
    expect(content).toContain('linkColumns:');
    expect(content).toContain('name: { url: entityUrl, idField: \'_id\' }');
  });
});
