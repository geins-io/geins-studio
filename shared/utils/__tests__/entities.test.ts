import { describe, it, expect } from 'vitest';
import en from '../../../i18n/locales/en.json';
import sv from '../../../i18n/locales/sv.json';
import { ENTITY } from '../entities';

/**
 * Guards the canonical entity-key map against drift from the locale files.
 * Every ENTITY value must resolve to a real i18n key in BOTH locales — so a
 * renamed/removed key surfaces here instead of silently degrading toasts,
 * 404 titles, or empty states to an unresolved key string.
 */
describe('ENTITY constant', () => {
  const keys = Object.values(ENTITY);

  it('maps every key to its own name (no copy-paste typos)', () => {
    for (const [name, value] of Object.entries(ENTITY)) {
      expect(value).toBe(name);
    }
  });

  it.each(keys)('"%s" exists in en.json', (key) => {
    expect(en).toHaveProperty(key);
  });

  it.each(keys)('"%s" exists in sv.json', (key) => {
    expect(sv).toHaveProperty(key);
  });
});
