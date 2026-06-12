import type { Component } from 'vue';

// Kit logos live in app/assets/logos/kits/ and are resolved locally by matching
// the slug of a kit's name, category, or tag against the SVG filenames (the kit
// API has no logo field). Shared by the kit directory cards (KitCard) and the
// orchestrator overview group cards. See the folder's README for naming.
const logoModules = import.meta.glob<{ default: Component }>(
  '@/assets/logos/kits/*.svg',
  { eager: true },
);

const logoMap: Record<string, Component> = {};
for (const [path, mod] of Object.entries(logoModules)) {
  const name = path.match(/\/([^/]+)\.svg$/)?.[1];
  if (name) logoMap[name] = mod.default;
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

interface UseKitLogoReturnType {
  /**
   * Returns the first logo whose slug matches a candidate, in the order given
   * (typically name → category → tags). Falsy candidates are skipped. Returns
   * `null` when nothing matches, so callers can fall back to an avatar.
   */
  resolveKitLogo: (candidates: (string | undefined)[]) => Component | null;
}

export function useKitLogo(): UseKitLogoReturnType {
  const resolveKitLogo = (
    candidates: (string | undefined)[],
  ): Component | null => {
    for (const candidate of candidates) {
      if (!candidate) continue;
      const match = logoMap[slugify(candidate)];
      if (match) return match;
    }
    return null;
  };

  return { resolveKitLogo };
}
