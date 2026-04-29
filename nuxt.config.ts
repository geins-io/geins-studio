import tailwindcss from '@tailwindcss/vite';
import { getBaseUrl, getAuthBaseUrl } from './shared/utils/deployment';

export default defineNuxtConfig({
  ssr: false,

  spaLoadingTemplate: 'app-skeleton.html',

  routeRules: {
    '/auth/*': { prerender: true },
  },

  devtools: { enabled: true },

  ignore: ['.temp/**', '.agents/**', '.mint/**'],

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

  imports: {
    dirs: ['composables', 'composables/**'],
  },

  css: ['~/assets/css/main.css', 'flag-icons/css/flag-icons.min.css'],

  vite: {
    // @ts-expect-error Type conflict: @tailwindcss/vite uses vite 7 types, vitepress pulls in vite 5 types
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: [
          '**/.temp/**',
          '**/.agents/**',
          '**/.mint/**',
          '**/.output/**',
          '**/.nuxt/**',
        ],
      },
    },
  },

  nitro: {
    watchOptions: {
      ignored: ['**/.temp/**', '**/.agents/**', '**/.mint/**'],
    },
    ...(process.env.NITRO_PRESET && { preset: process.env.NITRO_PRESET }),
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
    langDir: 'locales',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'sv', name: 'Swedish', file: 'sv.json' },
    ],
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
      featureOrchestrator:
        process.env.NUXT_PUBLIC_FEATURE_ORCHESTRATOR === 'true',
    },
    private: {
      authSecret: process.env.AUTH_SECRET,
    },
  },

  sourcemap: {
    server: false,
    client: true,
  },

  compatibilityDate: '2024-07-05',
});
