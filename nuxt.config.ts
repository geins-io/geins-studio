import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import { getBaseUrl, getAuthBaseUrl } from './shared/utils/deployment';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineNuxtConfig({
  ssr: false,

  app: {
    head: {
      meta: [
        {
          name: 'app-version',
          content: `${pkg.version}+${process.env.GIT_SHA || 'dev'}`,
        },
      ],
    },
  },

  spaLoadingTemplate: 'app-skeleton.html',

  routeRules: {
    '/auth/*': { prerender: true },
    // Orchestrator variables + kits moved under Settings (Settings › Orchestrator).
    // Keep old links working.
    '/orchestrator/kits/list': {
      redirect: '/settings/orchestrator/kits/list',
    },
    '/orchestrator/kits/installed': {
      redirect: '/settings/orchestrator/kits/installed',
    },
    '/orchestrator/variables/**': {
      redirect: '/settings/orchestrator/variables/**',
    },
  },

  devtools: { enabled: true },

  experimental: {
    normalizeComponentNames: true,
  },

  ignore: ['.temp/**', '.agents/**', '.mint/**', '.claude/**'],

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
    // Cast required because Nuxt and VitePress may resolve different Vite type versions.
    plugins: [tailwindcss() as unknown as never],
    optimizeDeps: {
      include: [
        '@lucide/vue',
        '@tanstack/vue-table',
        '@vercel/analytics/nuxt',
        '@vueuse/core',
        'chalk',
        'class-variance-authority',
        'clsx',
        'jwt-decode',
        'reka-ui',
        'tailwind-merge',
        'vuedraggable',
      ],
    },
    server: {
      watch: {
        ignored: [
          '**/.temp/**',
          '**/.agents/**',
          '**/.mint/**',
          '**/.claude/**',
          '**/.output/**',
          '**/.nuxt/**',
        ],
      },
    },
  },

  nitro: {
    watchOptions: {
      ignored: ['**/.temp/**', '**/.agents/**', '**/.mint/**', '**/.claude/**'],
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
      appVersion: pkg.version,
      gitSha: process.env.GIT_SHA || 'dev',
      fallback: {
        language: 'en',
        currency: 'SEK',
        channel: '1',
        country: 'SE',
      },
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || getBaseUrl(),
      apiUrl: process.env.GEINS_API_URL,
      debug: process.env.GEINS_DEBUG === 'true',
      appId: process.env.NUXT_PUBLIC_APP_ID || '',
      isVercel: !!process.env.VERCEL,
    },
    private: {
      authSecret: process.env.AUTH_SECRET,
      // HOTFIX STU-216 — remove when BE handles config-refresh natively (STU-217)
      salesPortalWebhookSecret: process.env.SALES_PORTAL_WEBHOOK_SECRET,
    },
  },

  sourcemap: {
    server: false,
    client: true,
  },

  compatibilityDate: '2024-07-05',
});
