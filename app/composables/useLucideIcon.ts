import { icons } from '@lucide/vue';
import type { Component } from 'vue';

type LucideIconName = keyof typeof icons;

/**
 * Resolves a Lucide icon Vue component by its PascalCase name string.
 *
 * Uses the `icons` barrel export from `lucide-vue-next` for runtime lookup,
 * bypassing tree-shaking limitations of `nuxt-lucide-icons` which cannot
 * detect dynamically constructed component names.
 */
export function useLucideIcon() {
  function resolveIcon(iconName?: string): Component | null {
    if (!iconName) return null;
    return (icons[iconName as LucideIconName] as Component) ?? null;
  }

  return { resolveIcon };
}
