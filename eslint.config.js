import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import prettierConfig from 'eslint-config-prettier';
import tailwind from 'eslint-plugin-tailwindcss';

// Prettier owns all formatting. eslint handles code quality only.
// eslint-config-prettier (appended LAST) disables any eslint rules that would
// conflict with Prettier. We intentionally do NOT use eslint-plugin-prettier —
// it diverged from standalone Prettier (missing vue/tailwind plugin transforms),
// so formatting is enforced via `prettier`/`format:check`, not through eslint.
export default createConfigForNuxt()
  .prepend({
    ignores: ['.agents/**'],
  })
  .append(tailwind.configs['flat/recommended'])
  .append({
    settings: {
      tailwindcss: {
        // Tailwind CSS 4 doesn't use traditional config file
        config: false,
      },
    },
    rules: {
      'vue/require-default-prop': 'off',
      'vue/no-multiple-template-root': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': [
        'warn',
        {
          html: {
            void: 'any',
            normal: 'always',
            component: 'always',
          },
          svg: 'always',
          math: 'always',
        },
      ],
      'tailwindcss/no-custom-classname': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'type',
          ],
          pathGroups: [
            { pattern: '#shared/**', group: 'internal', position: 'before' },
            { pattern: '@/**', group: 'internal', position: 'after' },
          ],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  })
  .append({
    files: ['shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/*',
                '~/*',
                '~/app/*',
                '@/components/*',
                '@/composables/*',
                '@/utils/*',
              ],
              message:
                'shared/ must not import from app/ — dependency direction violation.',
            },
          ],
        },
      ],
    },
  })
  .append(prettierConfig);
