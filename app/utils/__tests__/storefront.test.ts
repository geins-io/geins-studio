// @vitest-environment node
import { describe, it, expect } from 'vitest';
import type { SchemaFormField, StorefrontSchema } from '#shared/types';
import defaultSchema from '../../assets/schemas/storefront-settings-default.json';
import {
  analyzeSchemaChange,
  applySchemaChange,
  deepMerge,
  deleteSettingValue,
  getDefaultSettings,
  getSettingValue,
  isValueValidForField,
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
          buttonBackground: '#363636',
          buttonText: '#ffffff',
          buttonPurchaseBackground: '#363636',
          buttonPurchaseText: '#ffffff',
          siteBackground: '#FAFAFA',
          navBarBackground: '#FFFFFF',
          topBarBackground: '#363636',
          topBarText: '#ffffff',
          footerBackground: '#363636',
          footerText: '#ffffff',
        },
      },
      features: {
        priceVisibility: { enabled: true, access: 'authenticated' },
        orderPlacement: { enabled: true, access: 'authenticated' },
        stockStatus: { enabled: false, access: 'authenticated' },
        newsletterSignup: false,
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
    expect(
      getSettingValue({}, 'theme.colors.buttonBackground'),
    ).toBeUndefined();
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
    const updated = setSettingValue(
      {},
      'theme.colors.buttonBackground',
      '#000',
    );
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
    expect((updated.theme as { colors: object }).colors).not.toBe(
      original.theme.colors,
    );
  });

  it('overwrites a non-object segment with a fresh object', () => {
    const original = { theme: 'broken' };
    const updated = setSettingValue(original, 'theme.colors.x', 1);
    expect(updated).toEqual({ theme: { colors: { x: 1 } } });
  });
});

describe('deepMerge', () => {
  it('returns base when override is empty', () => {
    const base = { mode: 'commerce', theme: { radius: '0' } };
    expect(deepMerge(base, {})).toEqual(base);
  });

  it('overrides top-level keys', () => {
    const base = { mode: 'commerce', theme: { radius: '0' } };
    const override = { mode: 'catalogue' };
    expect(deepMerge(base, override)).toEqual({
      mode: 'catalogue',
      theme: { radius: '0' },
    });
  });

  it('backfills missing nested keys from base', () => {
    const base = {
      theme: {
        colors: { buttonBackground: '#0E7490', buttonText: '#FFFFFF' },
      },
    };
    const override = { theme: { colors: { buttonBackground: '#000' } } };
    expect(deepMerge(base, override)).toEqual({
      theme: {
        colors: { buttonBackground: '#000', buttonText: '#FFFFFF' },
      },
    });
  });

  it('fully overrides when override has every leaf', () => {
    const base = { theme: { radius: '0', colors: { x: '#fff' } } };
    const override = { theme: { radius: '8', colors: { x: '#000' } } };
    expect(deepMerge(base, override)).toEqual(override);
  });

  it('replaces arrays instead of concatenating', () => {
    const base = { tags: ['a', 'b'] };
    const override = { tags: ['c'] };
    expect(deepMerge(base, override)).toEqual({ tags: ['c'] });
  });

  it('treats primitives as leaves (override wins)', () => {
    expect(deepMerge({ x: 1 }, { x: 2 })).toEqual({ x: 2 });
    expect(deepMerge({ x: null }, { x: 'value' })).toEqual({ x: 'value' });
  });

  it('replaces object with primitive when override is primitive', () => {
    const base = { theme: { radius: '0' } };
    const override = { theme: null };
    expect(deepMerge(base, override)).toEqual({ theme: null });
  });

  it('does not mutate base or override', () => {
    const base = { theme: { colors: { x: '#fff' } } };
    const override = { theme: { colors: { x: '#000' } } };
    const result = deepMerge(base, override);

    expect(result).not.toBe(base);
    expect((result.theme as { colors: object }).colors).not.toBe(
      (base.theme as { colors: object }).colors,
    );
    expect(base.theme.colors.x).toBe('#fff');
    expect(override.theme.colors.x).toBe('#000');
  });

  it('backfills schema defaults under an empty entity object', () => {
    const defaults = { mode: 'commerce', theme: { radius: '0' } };
    expect(deepMerge(defaults, {})).toEqual(defaults);
  });
});

const changeSchema: StorefrontSchema = {
  general: {
    label: 'General',
    sections: [
      {
        key: 'branding',
        title: 'Branding',
        fields: [
          { key: 'branding.logo', type: 'image', label: 'Logo' },
          {
            key: 'theme.colors',
            type: 'sub-section',
            label: 'Colors',
            children: [
              {
                key: 'theme.colors.primary',
                type: 'color',
                label: 'Primary',
                default: '#000000',
              },
              {
                key: 'theme.colors.accent',
                type: 'color',
                label: 'Accent',
                default: '#FF0000',
              },
            ],
          },
          {
            key: 'mode',
            type: 'select',
            label: 'Mode',
            default: 'commerce',
            options: [
              { value: 'commerce', label: 'Commerce' },
              { value: 'catalogue', label: 'Catalogue' },
            ],
          },
          {
            key: 'features.priceVisibility',
            type: 'boolean-choice',
            label: 'Price visibility',
            default: { enabled: true, access: 'all' },
            choice: {
              key: 'access',
              type: 'radio',
              options: [
                { value: 'all', label: 'All' },
                { value: 'authenticated', label: 'Authenticated' },
              ],
            },
          },
          { key: 'itemsPerPage', type: 'number', label: 'Items per page' },
          { key: 'seo.title', type: 'string', label: 'Title', default: '' },
        ],
      },
    ],
  },
};

describe('isValueValidForField', () => {
  const field = (type: SchemaFormField['type'], extra = {}) => ({
    key: 'x',
    label: 'X',
    type,
    ...extra,
  });

  it('checks primitive types', () => {
    expect(isValueValidForField(field('color'), '#fff')).toBe(true);
    expect(isValueValidForField(field('color'), 12)).toBe(false);
    expect(isValueValidForField(field('number'), 3)).toBe(true);
    expect(isValueValidForField(field('number'), '3')).toBe(false);
    expect(isValueValidForField(field('boolean'), false)).toBe(true);
    expect(isValueValidForField(field('boolean'), 'false')).toBe(false);
  });

  it('requires select values to be one of the options', () => {
    const select = field('select', {
      options: [{ value: 'a', label: 'A' }],
    });
    expect(isValueValidForField(select, 'a')).toBe(true);
    expect(isValueValidForField(select, 'b')).toBe(false);
  });

  it('validates boolean-choice objects and their choice value', () => {
    const choiceField = changeSchema.general!.sections[0]!.fields[3]!;
    expect(
      isValueValidForField(choiceField, { enabled: false, access: 'all' }),
    ).toBe(true);
    expect(isValueValidForField(choiceField, { enabled: 'yes' })).toBe(false);
    expect(isValueValidForField(choiceField, { access: 'nobody' })).toBe(false);
    expect(isValueValidForField(choiceField, true)).toBe(false);
  });
});

// The schema before the edit: no accent color, no price visibility, a
// `retired-mode` option, `itemsPerPage` as a string and a `legacy.banner` field.
function previousSchema(): StorefrontSchema {
  const schema = structuredClone(changeSchema);
  const fields = schema.general!.sections[0]!.fields;
  fields[1]!.children = fields[1]!.children!.slice(0, 1);
  fields[2]!.options = [
    ...fields[2]!.options!,
    { value: 'retired-mode', label: 'Retired' },
  ];
  fields.splice(3, 1);
  fields.find((f) => f.key === 'itemsPerPage')!.type = 'string';
  fields.push({ key: 'legacy.banner', type: 'string', label: 'Banner' });
  return schema;
}

describe('analyzeSchemaChange', () => {
  it('lists only new fields as getting a default', () => {
    const { added } = analyzeSchemaChange(previousSchema(), changeSchema, {
      theme: { colors: { primary: '#123456' } },
      mode: 'commerce',
    });
    expect(added.map((e) => e.key)).toEqual([
      'theme.colors.accent',
      'features.priceVisibility',
    ]);
  });

  it('leaves unchanged fields alone, even when they have no value', () => {
    const { added, typeReset } = analyzeSchemaChange(
      previousSchema(),
      changeSchema,
      { seo: { title: null }, branding: { logo: 42 } },
    );
    expect(added.map((e) => e.key)).not.toContain('seo.title');
    expect(typeReset).toEqual([]);
  });

  it('lists values that no longer fit a changed field', () => {
    const { typeReset } = analyzeSchemaChange(previousSchema(), changeSchema, {
      mode: 'retired-mode',
      itemsPerPage: 'twelve',
    });
    expect(typeReset).toEqual([
      { key: 'mode', value: 'retired-mode' },
      { key: 'itemsPerPage', value: 'twelve' },
    ]);
  });

  it('keeps values that still fit a changed field', () => {
    const { typeReset } = analyzeSchemaChange(previousSchema(), changeSchema, {
      mode: 'catalogue',
      itemsPerPage: 12,
    });
    expect(typeReset).toEqual([]);
  });

  it('treats null in a changed field as missing, not as a type change', () => {
    const { typeReset } = analyzeSchemaChange(previousSchema(), changeSchema, {
      itemsPerPage: null,
    });
    expect(typeReset).toEqual([]);
  });

  it('lists leaf settings without a field as orphans, including removed fields', () => {
    const { orphaned } = analyzeSchemaChange(previousSchema(), changeSchema, {
      branding: { logo: 'logo.png', favicon: 'favicon.ico' },
      legacy: { banner: 'Sale' },
      footer: { links: ['a'] },
      features: { priceVisibility: { enabled: true, legacy: 1 } },
    });
    expect(orphaned).toEqual([
      { key: 'branding.favicon', value: 'favicon.ico' },
      { key: 'legacy.banner', value: 'Sale' },
      { key: 'footer.links', value: ['a'] },
    ]);
  });

  it('flags a primitive sitting where the schema expects an object', () => {
    const { orphaned } = analyzeSchemaChange(previousSchema(), changeSchema, {
      theme: 'dark',
    });
    expect(orphaned).toEqual([{ key: 'theme', value: 'dark' }]);
  });
});

describe('applySchemaChange', () => {
  const current = {
    branding: { logo: 'logo.png' },
    theme: { colors: { primary: '#123456' } },
    mode: 'retired-mode',
    itemsPerPage: 'twelve',
    seo: { title: null },
    legacy: { banner: 'Sale' },
  };
  const keep = { mode: 'changes', removeOrphans: false } as const;

  it('keeps untouched values and fills defaults for new fields', () => {
    const result = applySchemaChange(
      previousSchema(),
      changeSchema,
      current,
      keep,
    );
    expect(getSettingValue(result, 'branding.logo')).toBe('logo.png');
    expect(getSettingValue(result, 'theme.colors.primary')).toBe('#123456');
    expect(getSettingValue(result, 'theme.colors.accent')).toBe('#FF0000');
    expect(getSettingValue(result, 'features.priceVisibility')).toEqual({
      enabled: true,
      access: 'all',
    });
    expect(getSettingValue(result, 'seo.title')).toBeNull();
  });

  it('resets values that no longer fit, or drops them when there is no default', () => {
    const result = applySchemaChange(
      previousSchema(),
      changeSchema,
      current,
      keep,
    );
    expect(getSettingValue(result, 'mode')).toBe('commerce');
    expect(result).not.toHaveProperty('itemsPerPage');
  });

  it('keeps orphans by default and removes them on request', () => {
    const kept = applySchemaChange(
      previousSchema(),
      changeSchema,
      current,
      keep,
    );
    expect(getSettingValue(kept, 'legacy.banner')).toBe('Sale');

    const removed = applySchemaChange(previousSchema(), changeSchema, current, {
      mode: 'changes',
      removeOrphans: true,
    });
    expect(removed).not.toHaveProperty('legacy');
  });

  it('never overwrites a kept value that blocks a new default', () => {
    const blocked = { theme: 'dark' };
    const kept = applySchemaChange(
      previousSchema(),
      changeSchema,
      blocked,
      keep,
    );
    expect(kept.theme).toBe('dark');

    const removed = applySchemaChange(previousSchema(), changeSchema, blocked, {
      mode: 'changes',
      removeOrphans: true,
    });
    expect(getSettingValue(removed, 'theme.colors.accent')).toBe('#FF0000');
  });

  it('keeps keys inside a boolean-choice object when removing orphans', () => {
    const result = applySchemaChange(
      changeSchema,
      changeSchema,
      { features: { priceVisibility: { enabled: true, legacy: 1 } } },
      { mode: 'changes', removeOrphans: true },
    );
    expect(getSettingValue(result, 'features.priceVisibility.legacy')).toBe(1);
  });

  it('replaces everything with defaults in reset mode', () => {
    const result = applySchemaChange(previousSchema(), changeSchema, current, {
      mode: 'reset',
      removeOrphans: false,
    });
    expect(result).toEqual(getDefaultSettings(changeSchema));
  });

  it('changes nothing when the schema is unchanged', () => {
    const result = applySchemaChange(changeSchema, changeSchema, current, keep);
    expect(result).toBe(current);
  });

  it('does not mutate current settings', () => {
    const snapshot = structuredClone(current);
    applySchemaChange(previousSchema(), changeSchema, current, {
      mode: 'changes',
      removeOrphans: true,
    });
    expect(current).toEqual(snapshot);
  });
});

describe('deleteSettingValue', () => {
  it('removes a nested key and prunes empty parents', () => {
    expect(deleteSettingValue({ a: { b: { c: 1 } }, d: 2 }, 'a.b.c')).toEqual({
      d: 2,
    });
  });

  it('keeps siblings of the removed key', () => {
    expect(deleteSettingValue({ a: { b: 1, c: 2 } }, 'a.b')).toEqual({
      a: { c: 2 },
    });
  });

  it('returns the input unchanged for a missing path', () => {
    const settings = { a: { b: 1 } };
    expect(deleteSettingValue(settings, 'a.x.y')).toBe(settings);
  });
});
