/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { getNavigation } from '../app/lib/navigation';

describe('Navigation Configuration', () => {
  // Mock translation function
  const mockT = (key: string) => key;

  it('should include PIM navigation item', () => {
    const navigation = getNavigation(mockT);
    const pimItem = navigation.find((item) => item.label === 'navigation.pim');
    
    expect(pimItem).toBeDefined();
    expect(pimItem?.icon).toBe('Package');
    expect(pimItem?.href).toBe('/pim/product/list');
  });

  it('should have Products child item under PIM', () => {
    const navigation = getNavigation(mockT);
    const pimItem = navigation.find((item) => item.label === 'navigation.pim');
    
    expect(pimItem?.children).toBeDefined();
    expect(pimItem?.children?.length).toBeGreaterThan(0);
    
    const productsChild = pimItem?.children?.find(
      (child) => child.label === 'navigation.products'
    );
    
    expect(productsChild).toBeDefined();
    expect(productsChild?.href).toBe('/pim/product/list');
    expect(productsChild?.childPattern).toBe('/pim/product/:id');
  });

  it('should place PIM navigation before Pricing', () => {
    const navigation = getNavigation(mockT);
    const pimIndex = navigation.findIndex((item) => item.label === 'navigation.pim');
    const pricingIndex = navigation.findIndex((item) => item.label === 'navigation.pricing');
    
    expect(pimIndex).toBeGreaterThanOrEqual(0);
    expect(pricingIndex).toBeGreaterThan(pimIndex);
  });

  it('should have sales group for PIM navigation', () => {
    const navigation = getNavigation(mockT);
    const pimItem = navigation.find((item) => item.label === 'navigation.pim');
    
    expect(pimItem?.group).toBe('sales');
  });
});
