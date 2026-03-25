// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { StorefrontSchema } from '#shared/types';
import defaultSchema from '../../assets/schemas/storefront-settings-default.json';
import { getDefaultSettings, getSettingValue, setSettingValue } from '../storefront';

describe('getDefaultSettings', () => {
  it('extracts all default values from the default schema', () => {
    const settings = getDefaultSettings(defaultSchema as StorefrontSchema);

    expect(settings).toEqual({
      storefrontMode: 'commerce',
      accessRequirements: true,
      'accessRequirements.priceVisibility': true,
      'accessRequirements.orderPlacement': true,
      'accessRequirements.stockStatus': false,
      cornerStyle: 'square',
      'themeColors.primary': '#171717',
      'themeColors.background': '#ffffff',
      'themeColors.accent': '#5cc190',
    });
  });

  it('omits fields without a default value', () => {
    const settings = getDefaultSettings(defaultSchema as StorefrontSchema);

    // logotype has no default, fonts.headings and fonts.body have no default
    expect(settings).not.toHaveProperty('logotype');
    expect(settings).not.toHaveProperty('fonts.headings');
    expect(settings).not.toHaveProperty('fonts.body');
  });

  it('includes group children defaults', () => {
    const settings = getDefaultSettings(defaultSchema as StorefrontSchema);

    expect(settings['accessRequirements.priceVisibility']).toBe(true);
    expect(settings['accessRequirements.orderPlacement']).toBe(true);
    expect(settings['accessRequirements.stockStatus']).toBe(false);
  });

  it('returns empty object for empty schema', () => {
    const settings = getDefaultSettings({});
    expect(settings).toEqual({});
  });

  it('handles schema with sections but no defaults', () => {
    const schema: StorefrontSchema = {
      tab: {
        label: 'Test',
        sections: [
          {
            key: 'test',
            title: 'Test',
            fields: [
              { key: 'noDefault', type: 'string', label: 'No default' },
            ],
          },
        ],
      },
    };

    const settings = getDefaultSettings(schema);
    expect(settings).toEqual({});
  });
});

describe('getSettingValue', () => {
  it('reads a flat key', () => {
    const settings = { storefrontMode: 'commerce' };
    expect(getSettingValue(settings, 'storefrontMode')).toBe('commerce');
  });

  it('reads a dot-notation key as a flat key', () => {
    const settings = { 'accessRequirements.priceVisibility': true };
    expect(getSettingValue(settings, 'accessRequirements.priceVisibility')).toBe(true);
  });

  it('returns undefined for missing keys', () => {
    expect(getSettingValue({}, 'nonexistent')).toBeUndefined();
  });
});

describe('setSettingValue', () => {
  it('returns a new object with the key set', () => {
    const original = { storefrontMode: 'commerce' };
    const updated = setSettingValue(original, 'storefrontMode', 'catalogue');

    expect(updated).toEqual({ storefrontMode: 'catalogue' });
    expect(original).toEqual({ storefrontMode: 'commerce' });
  });

  it('adds new keys without removing existing ones', () => {
    const original = { a: 1 };
    const updated = setSettingValue(original, 'b', 2);

    expect(updated).toEqual({ a: 1, b: 2 });
  });

  it('does not mutate the original object', () => {
    const original = { key: 'value' };
    const updated = setSettingValue(original, 'key', 'new');

    expect(original.key).toBe('value');
    expect(updated.key).toBe('new');
    expect(updated).not.toBe(original);
  });
});
