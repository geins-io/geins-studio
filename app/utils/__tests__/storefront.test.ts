// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { StorefrontSchema } from '#shared/types';
import defaultSchema from '../../assets/schemas/storefront-settings-default.json';
import {
  getDefaultSettings,
  getSettingValue,
  setSettingValue,
} from '../storefront';

describe('getDefaultSettings', () => {
  it('materializes nested defaults from the default schema', () => {
    const settings = getDefaultSettings(defaultSchema as StorefrontSchema);

    expect(settings).toEqual({
      mode: 'commerce',
      theme: {
        radius: '0',
        typography: {
          fontFamily: 'Geist',
          headingFontFamily: 'Hanuman',
        },
        colors: {
          buttonBackground: '#0E7490',
          buttonText: '#FFFFFF',
          buttonPurchaseBackground: '#0E7490',
          buttonPurchaseText: '#FFFFFF',
          siteBackground: '#FFFFFF',
          navBarBackground: '#F5F5F5',
          topBarBackground: '#0E7490',
          topBarText: '#FFFFFF',
          footerBackground: '#F5F5F5',
          footerText: '#0A0A0A',
        },
      },
      features: {
        priceVisibility: { enabled: true, access: 'authenticated' },
        orderPlacement: { enabled: true, access: 'authenticated' },
        stockStatus: { enabled: false, access: 'authenticated' },
      },
      seo: {
        defaultTitle: '',
        titleTemplate: '',
        defaultDescription: '',
        defaultKeywords: '',
        robots: 'index, follow',
        googleAnalyticsId: '',
        googleTagManagerId: '',
        verification: '',
      },
      contact: {
        email: '',
        phone: '',
        address: {
          street: '',
          postalCode: '',
          city: '',
          country: '',
        },
      },
    });
  });

  it('omits fields without a default value', () => {
    const settings = getDefaultSettings(defaultSchema as StorefrontSchema);
    expect(getSettingValue(settings, 'branding.logoUrl')).toBeUndefined();
    expect(getSettingValue(settings, 'branding.faviconUrl')).toBeUndefined();
  });

  it('writes boolean-choice defaults as full nested objects', () => {
    const settings = getDefaultSettings(defaultSchema as StorefrontSchema);
    expect(getSettingValue(settings, 'features.priceVisibility')).toEqual({
      enabled: true,
      access: 'authenticated',
    });
  });

  it('returns empty object for empty schema', () => {
    expect(getDefaultSettings({})).toEqual({});
  });

  it('handles schema with sections but no defaults', () => {
    const schema: StorefrontSchema = {
      tab: {
        label: 'Test',
        sections: [
          {
            key: 'test',
            title: 'Test',
            fields: [{ key: 'noDefault', type: 'string', label: 'No default' }],
          },
        ],
      },
    };

    expect(getDefaultSettings(schema)).toEqual({});
  });
});

describe('getSettingValue', () => {
  it('reads a top-level key', () => {
    expect(getSettingValue({ mode: 'commerce' }, 'mode')).toBe('commerce');
  });

  it('reads a deep dot-notation path', () => {
    const settings = {
      theme: { colors: { buttonBackground: '#0E7490' } },
    };
    expect(getSettingValue(settings, 'theme.colors.buttonBackground')).toBe(
      '#0E7490',
    );
  });

  it('returns undefined for any missing segment', () => {
    expect(getSettingValue({}, 'theme.colors.buttonBackground')).toBeUndefined();
    expect(
      getSettingValue({ theme: {} }, 'theme.colors.buttonBackground'),
    ).toBeUndefined();
  });

  it('returns undefined when traversing through a non-object', () => {
    const settings = { theme: 'not-an-object' };
    expect(getSettingValue(settings, 'theme.colors')).toBeUndefined();
  });
});

describe('setSettingValue', () => {
  it('returns a new object with the leaf set', () => {
    const original = { mode: 'commerce' };
    const updated = setSettingValue(original, 'mode', 'catalogue');

    expect(updated).toEqual({ mode: 'catalogue' });
    expect(original).toEqual({ mode: 'commerce' });
  });

  it('creates intermediate objects on a fresh path', () => {
    const updated = setSettingValue({}, 'theme.colors.buttonBackground', '#000');
    expect(updated).toEqual({
      theme: { colors: { buttonBackground: '#000' } },
    });
  });

  it('preserves siblings while writing deep', () => {
    const original = {
      theme: {
        colors: { buttonBackground: '#0E7490', buttonText: '#FFFFFF' },
        radius: '0',
      },
    };
    const updated = setSettingValue(
      original,
      'theme.colors.buttonBackground',
      '#000',
    );

    expect(updated).toEqual({
      theme: {
        colors: { buttonBackground: '#000', buttonText: '#FFFFFF' },
        radius: '0',
      },
    });
    // original untouched
    expect(
      (original.theme.colors as { buttonBackground: string }).buttonBackground,
    ).toBe('#0E7490');
  });

  it('does not mutate the original object along the path', () => {
    const original = { theme: { colors: { buttonBackground: '#0E7490' } } };
    const updated = setSettingValue(
      original,
      'theme.colors.buttonBackground',
      '#FFF',
    );

    expect(updated).not.toBe(original);
    expect(updated.theme).not.toBe(original.theme);
    expect(
      (updated.theme as { colors: object }).colors,
    ).not.toBe(original.theme.colors);
  });

  it('overwrites a non-object segment with a fresh object', () => {
    const original = { theme: 'broken' };
    const updated = setSettingValue(original, 'theme.colors.x', 1);
    expect(updated).toEqual({ theme: { colors: { x: 1 } } });
  });
});
