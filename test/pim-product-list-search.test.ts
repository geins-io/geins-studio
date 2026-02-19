// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('US-004: Product List - Search, Filters, and Pagination', () => {
  const projectRoot = join(__dirname, '..');
  const productListPath = join(projectRoot, 'app/pages/pim/product/list.vue');

  it('should have searchableFields prop configured for name and articleNumber', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for searchableFields prop with name and articleNumber
    expect(content).toContain(':searchable-fields');
    expect(content).toContain("'name'");
    expect(content).toContain("'articleNumber'");
    
    // Verify both fields are in the array
    const searchableFieldsMatch = content.match(/:searchable-fields="?\[([^\]]+)\]"?/);
    expect(searchableFieldsMatch).toBeTruthy();
    if (searchableFieldsMatch) {
      const fields = searchableFieldsMatch[1];
      expect(fields).toContain('name');
      expect(fields).toContain('articleNumber');
    }
  });

  it('should configure pagination with pageSize of 30', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for pageSize prop
    expect(content).toContain(':page-size');
    expect(content).toContain('30');
  });

  it('should have showSearch prop enabled', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for showSearch prop
    expect(content).toContain(':show-search');
    expect(content).toContain('true');
  });

  it('should have Create Product button linking to /pim/product/new', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for ButtonIcon with new icon
    expect(content).toContain('ButtonIcon');
    expect(content).toContain('icon="new"');
    
    // Check for href to new entity URL (newEntityUrl is derived from useEntityUrl)
    expect(content).toContain(':href="newEntityUrl"');
    
    // Verify newEntityUrl is set up correctly
    expect(content).toContain('const newEntityUrl = getEntityNewUrl()');
  });

  it('should have column visibility state configured', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for visibility state setup
    expect(content).toContain('VisibilityState');
    expect(content).toContain('visibilityState');
    expect(content).toContain(':init-visibility-state="visibilityState"');
    
    // Check for getVisibilityState usage
    expect(content).toContain('getVisibilityState');
    expect(content).toContain('hiddenColumns');
  });

  it('should pass all TableView props correctly', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Verify TableView has all required props
    expect(content).toContain('<TableView');
    expect(content).toContain(':loading="loading"');
    expect(content).toContain(':entity-name="entityName"');
    expect(content).toContain(':columns="columns"');
    expect(content).toContain(':data="dataList"');
    expect(content).toContain(':init-visibility-state="visibilityState"');
    expect(content).toContain(':searchable-fields');
    expect(content).toContain(':page-size');
    expect(content).toContain(':show-search');
  });

  it('should have proper TypeScript types for visibility state', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for VisibilityState import from tanstack
    expect(content).toContain("type { ColumnDef, VisibilityState }");
    expect(content).toContain("from '@tanstack/vue-table'");
  });

  it('should configure includeColumns to show the right columns', () => {
    const content = readFileSync(productListPath, 'utf-8');
    
    // Check for includeColumns configuration
    expect(content).toContain('includeColumns:');
    expect(content).toContain("'thumbnail'");
    expect(content).toContain("'name'");
    expect(content).toContain("'articleNumber'");
    expect(content).toContain("'active'");
  });
});
