import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Geins Merchant Center Developer Docs',
  description: 'Geins Merchant Center Developer Docs',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    siteTitle: 'Merchant Center',
    logo: {
      light: '/geins-g.svg',
      dark: '/geins-g-white.svg',
      alt: 'Geins Merchant Center Developer Docs',
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/introduction/what-is-geins-mc' },
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
          { text: 'Working with the UI', link: '/guides/ui' },
          { text: 'Working with the API', link: '/guides/api' },
          { text: 'Working with Data Tables', link: '/guides/data-tables' },
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

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/geins-io/geins-merchant-center',
      },
    ],
  },
});
