import { fileURLToPath } from 'node:url';
import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    setupFiles: ['./test/vitest.setup.ts'],
    // The nuxt environment boots the full app in a beforeAll hook; each worker's first
    // file pays a cold transform that exceeds the 10s default under load (~20s measured)
    hookTimeout: 60_000,
    exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**'],
    // `test:changed` selects tests by import graph; a diff touching one of these reruns the whole suite.
    // Absolute paths, not `**/` globs: vitest matches them against absolute paths, where `**` can't
    // cross the dot dir of a `.claude/worktrees/` checkout. Setup files are added by vitest itself.
    forceRerunTriggers: [
      'package.json',
      'vitest.config.ts',
      'nuxt.config.ts',
    ].map((file) => fileURLToPath(new URL(file, import.meta.url))),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'app/composables/**/*.ts',
        'app/utils/**/*.ts',
        'app/components/**/*.vue',
        'shared/utils/**/*.ts',
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**',
        '**/*.d.ts',
        'app/components/ui/**',
      ],
    },
  },
});
