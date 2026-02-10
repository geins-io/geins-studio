import { getBaseUrl, getAuthBaseUrl } from './shared/utils/deployment';
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
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
    'nuxt-viewport',
  ],

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  viewport: {
    breakpoints: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },

    defaultBreakpoints: {
      desktop: 'lg',
      mobile: 'xs',
      tablet: 'md',
    },

    fallbackBreakpoint: 'lg',
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
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'sv', name: 'Swedish', file: 'sv.json' },
    ],
    bundle: {
      optimizeTranslationDirective: false,
    },
  },

  runtimeConfig: {
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
    },
    private: {
      authSecret: process.env.AUTH_SECRET,
    },
  },

  sourcemap: {
    server: false,
    client: true,
  },

  ...(process.env.NITRO_PRESET && {
    nitro: {
      preset: process.env.NITRO_PRESET,
    },
  }),

  compatibilityDate: '2024-07-05',
});