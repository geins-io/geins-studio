import { icons } from '@lucide/vue';
import type { Component } from 'vue';

type LucideIconName = keyof typeof icons;

/**
 * Maps semantic / non-Lucide icon names (as shipped by the orchestrator
 * manifest) and renamed Lucide icons to valid current Lucide names. Keyed by a
 * normalized form (lowercase, alphanumerics only) so `database-import`,
 * `databaseImport`, etc. all match.
 */
const ICON_ALIASES: Record<string, LucideIconName> = {
  http: 'Globe',
  broadcast: 'Radio',
  engine: 'Cog',
  filter: 'Funnel', // Lucide renamed Filter → Funnel
  loop: 'Repeat',
  pages: 'Files',
  transform: 'Replace',
  translate: 'Languages',
  databaseimport: 'Import',
  databasesync: 'RefreshCw',
};

const normalize = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]/g, '');

const toPascalCase = (s: string): string =>
  s
    .replace(/[-_\s]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join('');

/**
 * Resolves a Lucide icon Vue component by name. Accepts PascalCase Lucide names
 * directly, plus camelCase/kebab-case/snake_case (normalized to PascalCase) and
 * a set of semantic aliases the manifest uses (see `ICON_ALIASES`).
 *
 * Uses the `icons` barrel export from `@lucide/vue` for runtime lookup,
 * bypassing tree-shaking limitations of `nuxt-lucide-icons` which cannot
 * detect dynamically constructed component names.
 */
export function useLucideIcon() {
  function resolveIcon(iconName?: string): Component | null {
    if (!iconName) return null;
    // Fast path: already a valid Lucide name.
    if (icons[iconName as LucideIconName])
      return icons[iconName as LucideIconName] as Component;
    // Semantic / renamed aliases.
    const alias = ICON_ALIASES[normalize(iconName)];
    if (alias && icons[alias]) return icons[alias] as Component;
    // Casing fallback (camel/kebab/snake → PascalCase).
    const pascal = toPascalCase(iconName) as LucideIconName;
    return (icons[pascal] as Component) ?? null;
  }

  return { resolveIcon };
}
