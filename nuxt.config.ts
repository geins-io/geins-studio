import { getBaseUrl, getAuthBaseUrl } from './shared/utils/deployment';
import tailwindcss from '@tailwindcss/vite';

const nitroPreset = {
  nitro: {
    preset: process.env.NITRO_PRESET,
  },
};

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  ssr: false,

  spaLoadingTemplate: 'app-skeleton.html',

  routeRules: {
    '/auth/*': { prerender: true },
  },

  devtools: { enabled: true },

  modules: [
    '@sidebase/nuxt-auth',
    '@nuxt/test-utils/module',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@formkit/auto-animate/nuxt',
    'shadcn-nuxt',
    'nuxt-svgo',
    'nuxt-lucide-icons',
    'nuxt-applicationinsights', // Add Application Insights module
  ],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  css: ['~/assets/css/tailwind.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'geins-color-mode',
  },

  auth: {
    isEnabled: true,
    baseURL: getAuthBaseUrl(),
    provider: {
      type: 'authjs',
    },
    sessionRefresh: {
      enableOnWindowFocus: false,
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: [{ code: 'en', name: 'English', file: 'en.json' }],
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  runtimeConfig: {
    applicationinsights: {
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    },
    public: {
      fallback: {
        language: 'en',
        currency: 'SEK',
        channel: '1',
        country: 'SE',
      },
      baseUrl: getBaseUrl(),
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

  ...(process.env.NITRO_PRESET ? nitroPreset : {}),

  compatibilityDate: '2024-07-05',
});
