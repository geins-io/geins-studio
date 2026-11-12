// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

// Prerendered HTML carries the build's public runtime config. The Azure image
// gets its base URL only at runtime, so a prerendered page links to localhost.
describe('nuxt.config', () => {
  it('prerenders no route', async () => {
    vi.stubGlobal('defineNuxtConfig', (config: unknown) => config);
    const { default: config } = await import('../nuxt.config');

    const prerendered = [
      config.routeRules,
      config.$production?.routeRules,
      config.$development?.routeRules,
    ].flatMap((rules) =>
      Object.entries(rules ?? {})
        .filter(([, rule]) => rule?.prerender)
        .map(([path]) => path),
    );

    expect(prerendered).toEqual([]);
    expect(config.nitro?.prerender?.routes ?? []).toEqual([]);
  });
});
