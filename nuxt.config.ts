// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@nuxtjs/robots',
    '@pinia/nuxt',
    'shadcn-nuxt',
    'nuxt-svgo',
    'nuxt-svgo',
  ],
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
});
