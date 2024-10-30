import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import pkg from 'eslint-plugin-prettier/recommended';

import tailwind from 'eslint-plugin-tailwindcss';
const { eslintPluginPrettierRecommended } = pkg;

export default createConfigForNuxt()
  .append(eslintPluginPrettierRecommended)
  .append(tailwind.configs['flat/recommended'])
  .append({
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
    },
  });
