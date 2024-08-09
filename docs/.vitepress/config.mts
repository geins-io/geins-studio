import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Geins Merchant Center Developer Docs',
  description: 'Geins Merchant Center Developer Docs',
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: '/assets/favicon.ico' }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: 'Merchant Center',
    logo: {
      light: '/assets/geins-g.svg',
      dark: '/assets/geins-g-white.svg',
      alt: 'Geins Merchant Center Developer Docs',
    },
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/introduction/what-is-geins-mc' },
    ],
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/geins-io/geins-merchant-center',
      },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          {
            text: 'What is Geins MC?',
            link: '/introduction/what-is-geins-mc',
          },
          { text: 'Getting Started', link: '/introduction/getting-started' },
          { text: 'Deploy', link: '/introduction/deploy' },
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
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' },
        ],
      },
    ],
    // footer: {
    //   message: '',
    //   copyright: '',
    // },
  },
});
