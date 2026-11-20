// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import en from '../../../i18n/locales/en.json';
import sv from '../../../i18n/locales/sv.json';
import { ENTITIES } from '../entities';

/**
 * Guards the entity registry and the locale files against drift.
 *
 * 1. **Locale parity** — `en.json` and `sv.json` must have identical key paths
 *    at every depth. This covers EVERY key (domain entities, label-only entity
 *    names, everything) with zero per-key maintenance — no hand-kept list.
 * 2. **Registry keys** — every domain-entity key (the i18n key) must resolve in
 *    both locales, so a renamed/removed entity key surfaces here instead of
 *    silently degrading toasts, 404 titles, or empty states.
 * 3. **Registry routes** — every `route` must point at a real `app/pages/`
 *    folder, so a moved/renamed folder (or a typo) is caught.
 */
const keyPaths = (messages: object, prefix = ''): string[] =>
  Object.entries(messages).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? keyPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

// Read from disk: the imported locale JSON is compiled to message ASTs by the
// i18n vite plugin, so walking it would compare AST nodes, not keys.
const rawLocaleKeys = (locale: string): string[] =>
  keyPaths(
    JSON.parse(
      readFileSync(
        resolve(process.cwd(), `i18n/locales/${locale}.json`),
        'utf8',
      ),
    ),
  );

describe('entity registry', () => {
  // Nested keys too: comparing only top-level keys let a missing sv key inside
  // `orders` or `workflows.events` through, which renders English or a raw path.
  const enKeys = rawLocaleKeys('en');
  const svKeys = rawLocaleKeys('sv');

  it('every en.json key exists in sv.json', () => {
    expect(enKeys.filter((key) => !svKeys.includes(key))).toEqual([]);
  });

  it('every sv.json key exists in en.json', () => {
    expect(svKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
  });

  // A message that interpolates an entity name must resolve the key itself
  // (`@.lower:` mid-sentence, `@.capitalize:`/`@:` sentence-initial). A bare
  // `{entityKey}` leaves the caller no option but to pass an already-translated
  // `$t(key)` — a hard block — and renders the entity's own capitalization
  // mid-sentence ("delete this Price list").
  const MODIFIED_ENTITY_KEY = /@(\.lower:|\.capitalize:|:)\{entityKey\}/;
  const entityKeyMessages = (
    messages: Record<string, unknown>,
    prefix = '',
  ): [string, string][] =>
    Object.entries(messages).flatMap(([key, value]) => {
      const path = `${prefix}${key}`;
      if (value && typeof value === 'object')
        return entityKeyMessages(value as Record<string, unknown>, `${path}.`);
      return typeof value === 'string' && value.includes('{entityKey}')
        ? [[path, value] as [string, string]]
        : [];
    });

  it.each([
    ['en', en],
    ['sv', sv],
  ])('every %s message with {entityKey} carries a link modifier', (_, msgs) => {
    // The locale JSON is compiled to a message AST by the i18n vite plugin, so
    // the raw text sits at `<key>.loc.source` — trim that back to the key path.
    const bare = [
      ...new Set(
        entityKeyMessages(msgs as Record<string, unknown>)
          .filter(([, value]) => !MODIFIED_ENTITY_KEY.test(value))
          .map(([path]) => path.replace(/\.loc\.source$/, '')),
      ),
    ];
    expect(bare).toEqual([]);
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
