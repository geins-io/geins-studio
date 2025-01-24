import { getAuthBaseUrlVercel } from './app/lib/deployment';

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  modules: [
    '@sidebase/nuxt-auth',
    '@nuxt/test-utils/module',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@nuxtjs/robots',
    '@pinia/nuxt',
    'shadcn-nuxt',
    'nuxt-svgo',
    'nuxt-lucide-icons',
  ],

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./app/components/ui"
     */
    componentDir: './app/components/ui',
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'geins-color-mode',
  },

  auth: {
    isEnabled: true,
    baseURL: getAuthBaseUrlVercel(),
    provider: {
      type: 'authjs',
    },
    sessionRefresh: {
      enableOnWindowFocus: false,
    },
  },

  i18n: {
    defaultLocale: 'en',
    langDir: 'lang/',
    locales: [{ code: 'en', language: 'en-US', file: 'en-US.ts' }],
  },

  robots: {
    rules: {
      UserAgent: '*',
      Disallow: '/',
    },
  },

  runtimeConfig: {
    public: {
      accountKey: process.env.GEINS_ACCOUNT_KEY,
      apiUrl: process.env.GEINS_API_URL,
      debug: process.env.GEINS_DEBUG === 'true',
      VERCEL: process.env.VERCEL,
      VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    private: {},
  },

  sourcemap: {
    server: false,
    client: true,
  },

  compatibilityDate: '2024-07-05',
});
