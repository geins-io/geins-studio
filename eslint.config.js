import { createConfigForNuxt } from '@nuxt/eslint-config/flat';
import pkg from 'eslint-plugin-prettier/recommended';
const { eslintPluginPrettierRecommended } = pkg;

export default createConfigForNuxt()
  .append(eslintPluginPrettierRecommended)
  .append({
    rules: {
      'vue/require-default-prop': 'off',
      'vue/no-multiple-template-root': 'off',
    },
  });
