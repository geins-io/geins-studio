import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Geins Studio - Developer Docs',
  description: 'Geins Studio - Developer Docs',
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: 'Geins Studio',
    logo: {
      light: '/geins-g.svg',
      dark: '/geins-g-white.svg',
      alt: 'Geins Studio - Developer Docs',
    },
    search: {
      provider: 'local',
    },
    outline: 'deep',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/introduction/what-is-geins-studio' },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/geins-io/geins-studio',
      },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          {
            text: 'What is Geins Studio?',
            link: '/introduction/what-is-geins-studio',
          },
          { text: 'Getting Started', link: '/introduction/getting-started' },
          { text: 'Features', link: '/introduction/features' },
        ],
      },
      {
        text: 'Concepts',
        items: [
          { text: 'Entities', link: '/concepts/entities' },
          { text: 'Authentication', link: '/concepts/authentication' },
        ],
      },
      {
        text: 'Composables',
        items: [
          { text: 'useColumns', link: '/composables/useColumns.md' },
          { text: 'useEntityUrl', link: '/composables/useEntityUrl.md' },
          { text: 'useGeinsApi', link: '/composables/useGeinsApi.md' },
          { text: 'useGeinsAuth', link: '/composables/useGeinsAuth.md' },
          { text: 'useGeinsLog', link: '/composables/useGeinsLog.md' },
          { text: 'useSkeleton', link: '/composables/useSkeleton.md' },
        ],
      },
      {
        text: 'Guides',
        items: [
          {
            text: 'Working with Data Tables',
            link: '/guides/data-tables/',
            items: [
              { text: 'Composables', link: '/guides/data-tables/composables' },
              { text: 'Components', link: '/guides/data-tables/components' },
            ],
          },
          {
            text: 'Working with the UI',
            link: '/guides/ui/',
            items: [
              { text: 'Feedback system', link: '/guides/ui/feedback-system' },
            ],
          },
          { text: 'Working with the API', link: '/guides/api' },
        ],
      },
    ],
    // footer: {
    //   message: '',
    //   copyright: '',
    // },
  },
});
