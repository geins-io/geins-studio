// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@sidebase/nuxt-auth',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@nuxtjs/robots',
    '@pinia/nuxt',
    'shadcn-nuxt',
    'nuxt-svgo',
    'nuxt-svgo',
  ],
  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui',
  },
  colorMode: {
    preference: 'system', // default value of $colorMode.preference
    fallback: 'light', // fallback value if not system preference found
    classSuffix: '',
    storageKey: 'nuxt-color-mode',
  },
  auth: {
    isEnabled: true,
    baseURL: process.env.AUTH_ORIGIN,
    provider: {
      type: 'authjs',
    },
    globalAppMiddleware: {
      isEnabled: false,
    },
  },
  i18n: {
    defaultLocale: 'en',
    langDir: 'lang/',
    locales: [{ code: 'en', iso: 'en-US', file: 'en-US.ts' }],
  },
  robots: {
    rules: {
      UserAgent: '*',
      Disallow: '/',
    },
  },
  runtimeConfig: {
    // Variables within 'public' can be accessed both client-side and server-side
    public: {
      apiBaseUrl: process.env.AUTH_ORIGIN, // Example public config
      VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      // Other public runtime configs
    },
    // Variables within 'private' are server-side only
    private: {
      apiSecretKey: process.env.AUTH_SECRET, // Example private config
      // Other private runtime configs
    },
  },
});
