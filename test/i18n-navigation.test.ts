/**
 * @vitest-environment node
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Navigation i18n Keys', () => {
  const enJsonPath = resolve(process.cwd(), 'i18n/locales/en.json');
  const svJsonPath = resolve(process.cwd(), 'i18n/locales/sv.json');

  it('should have navigation.pim key in en.json', () => {
    const enJson = JSON.parse(readFileSync(enJsonPath, 'utf-8'));
    
    expect(enJson.navigation).toBeDefined();
    expect(enJson.navigation.pim).toBeDefined();
    expect(enJson.navigation.pim).toBe('PIM');
  });

  it('should have navigation.products key in en.json', () => {
    const enJson = JSON.parse(readFileSync(enJsonPath, 'utf-8'));
    
    expect(enJson.navigation).toBeDefined();
    expect(enJson.navigation.products).toBeDefined();
    expect(enJson.navigation.products).toBe('Products');
  });

  it('should have navigation.pim key in sv.json', () => {
    const svJson = JSON.parse(readFileSync(svJsonPath, 'utf-8'));
    
    expect(svJson.navigation).toBeDefined();
    expect(svJson.navigation.pim).toBeDefined();
    expect(svJson.navigation.pim).toBe('PIM');
  });

  it('should have navigation.products key in sv.json', () => {
    const svJson = JSON.parse(readFileSync(svJsonPath, 'utf-8'));
    
    expect(svJson.navigation).toBeDefined();
    expect(svJson.navigation.products).toBeDefined();
    expect(svJson.navigation.products).toBe('Produkter');
  });
});
