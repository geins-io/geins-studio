import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import pkg from 'eslint-plugin-prettier/recommended';
const { eslintPluginPrettierRecommended } = pkg;

export default createConfigForNuxt()
  .append(eslintPluginPrettierRecommended)
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
    },
  });
