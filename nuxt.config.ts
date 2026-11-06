import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import {
  getBaseUrl,
  getAuthBaseUrl,
  includeDevPages,
} from './shared/utils/deployment';
import {
  SECURITY_HEADERS,
  reportOnlyCspHeaders,
} from './shared/utils/security-headers';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Scratch dirs that may hold cloned repos / other worktrees with their own
// node_modules — watching them blows the fd limit (EMFILE).
const SCRATCH_DIRS = ['.temp', '.agents', '.mint', '.claude'];
const rootDir = fileURLToPath(new URL('.', import.meta.url));
// Root-anchored on purpose: a `**/.claude/**` glob also matches the project
// itself when it runs from a Claude Code worktree (<repo>/.claude/worktrees/…),
// silently disabling HMR. A function, since Nitro's chokidar 5 treats string
// matchers as exact paths (no globs).
const isScratchPath = (path: string) =>
  SCRATCH_DIRS.some(
    (dir) => path === rootDir + dir || path.startsWith(`${rootDir}${dir}/`),
  );

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
      // Each weight is its own @font-face, fetched only on first use — preload
      // so the first semibold text doesn't swap in after paint.
      link: ['SuisseIntl-Regular', 'SuisseIntl-Medium'].map((file) => ({
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: `/fonts/${file}.woff2`,
        crossorigin: 'anonymous',
      })),
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

  // Production only: X-Frame-Options DENY would also block the Nuxt DevTools
  // iframe in dev. Vercel writes these into its edge config, so static assets
  // get them too. The report-only CSP is per document (server/plugins/csp.ts).
  $production: {
    routeRules: {
      '/**': { headers: SECURITY_HEADERS },
    },
  },

  devtools: { enabled: true },

  experimental: {
    normalizeComponentNames: true,
  },

  ignore: [
    // Nuxt matches these relative to rootDir, so they're already anchored.
    ...SCRATCH_DIRS.map((dir) => `${dir}/**`),
    // Dev harnesses are excluded from the build itself, not gated at runtime,
    // so their hardcoded copy never reaches a prod bundle. INCLUDE_DEV_PAGES=true
    // brings them back for the QA + preview projects.
    ...(includeDevPages() ? [] : ['app/pages/dev/**']),
  ],

  modules: [
    '@sidebase/nuxt-auth',
    '@nuxt/test-utils/module',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
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

  alias: {
    // vuedraggable's dist is a webpack UMD whose global lookup calls
    // `Function('return this')`: a CSP eval report on every page. The ESM
    // source it also ships has none (types already point at src/).
    vuedraggable: `${rootDir}node_modules/vuedraggable/src/vuedraggable.js`,
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
        ignored: [isScratchPath, '**/.output/**', '**/.nuxt/**'],
      },
    },
  },

  nitro: {
    watchOptions: {
      ignored: [isScratchPath],
    },
    // Blockly's sprites and cursors, at the installed version (BlocklyWorkspace).
    publicAssets: [
      { baseURL: '/_blockly', dir: `${rootDir}node_modules/blockly/media` },
    ],
    hooks: {
      // Prerendered pages (/auth/*) are served as static files, which the
      // runtime CSP plugin never sees. Hash their HTML here and attach the
      // policy as a route rule: prerender runs before the Vercel config and
      // the server bundle are written, so both pick it up.
      async 'prerender:generate'(route, nitro) {
        if (!route.contents || !route.fileName?.endsWith('.html')) return;
        const rule = (nitro.options.routeRules[route.route] ??= {});
        rule.headers = {
          ...rule.headers,
          ...(await reportOnlyCspHeaders(
            route.contents,
            process.env.VERCEL_ENV === 'preview',
          )),
        };
      },
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
    // nuxt-auth's own refetches would read the session outside the
    // `geins-auth-refresh` lock; auth-state.ts refreshes on focus and on a
    // timer through the locked path instead.
    sessionRefresh: {
      enableOnWindowFocus: false,
      enablePeriodically: false,
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
