import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import en from '../../../i18n/locales/en.json';
import sv from '../../../i18n/locales/sv.json';
import { ENTITIES } from '../entities';

/**
 * Guards the entity registry and the locale files against drift.
 *
 * 1. **Locale parity** — `en.json` and `sv.json` must have identical keys. This
 *    one assertion covers EVERY key (domain entities, label-only entity names,
 *    everything) with zero per-key maintenance — no hand-kept list to forget.
 * 2. **Registry keys** — every domain-entity key (the i18n key) must resolve in
 *    both locales, so a renamed/removed entity key surfaces here instead of
 *    silently degrading toasts, 404 titles, or empty states.
 * 3. **Registry routes** — every `route` must point at a real `app/pages/`
 *    folder, so a moved/renamed folder (or a typo) is caught.
 */
describe('entity registry', () => {
  it('en.json and sv.json have identical keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(sv).sort());
  });

  const entityKeys = Object.keys(ENTITIES);

  it.each(entityKeys)('"%s" exists in en.json', (key) => {
    expect(en).toHaveProperty(key);
  });

  it.each(entityKeys)('"%s" exists in sv.json', (key) => {
    expect(sv).toHaveProperty(key);
  });

  const routeEntries = Object.entries(ENTITIES).flatMap(([key, def]) =>
    'route' in def ? [{ key, route: def.route }] : [],
  );

  it.each(routeEntries)(
    '"$key" route ($route) resolves to a page folder',
    ({ route }) => {
      const folder = resolve(process.cwd(), 'app/pages', route);
      expect(existsSync(folder)).toBe(true);
    },
  );
});
