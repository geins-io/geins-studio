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
      {
        text: 'Geins Studio',
        link: 'https://geins.studio',
        target: '_blank',
      },
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
          { text: 'API Repositories', link: '/concepts/api-repositories' },
        ],
      },
      {
        text: 'Composables',
        items: [
          {
            text: 'API ',
            items: [
              { text: 'useBatchQuery', link: '/composables/useBatchQuery.md' },
              { text: 'useGeinsApi', link: '/composables/useGeinsApi.md' },
              {
                text: 'useGeinsRepository',
                link: '/composables/useGeinsRepository.md',
              },
            ],
          },
          {
            text: 'Data Tables',
            items: [
              { text: 'useColumns', link: '/composables/useColumns.md' },
              { text: 'useTable', link: '/composables/useTable.md' },
            ],
          },
          {
            text: 'Entity Management',
            items: [
              {
                text: 'useDeleteDialog',
                link: '/composables/useDeleteDialog.md',
              },
              { text: 'useEntityEdit', link: '/composables/useEntityEdit.md' },
              {
                text: 'useEntityEditSummary',
                link: '/composables/useEntityEditSummary.md',
              },
              { text: 'useEntityUrl', link: '/composables/useEntityUrl.md' },
              { text: 'useSelector', link: '/composables/useSelector.md' },
              {
                text: 'useStepManagement',
                link: '/composables/useStepManagement.md',
              },
              {
                text: 'useUnsavedChanges',
                link: '/composables/useUnsavedChanges.md',
              },
            ],
          },

          {
            text: 'Global',
            items: [
              { text: 'useGeinsAuth', link: '/composables/useGeinsAuth.md' },
              { text: 'useGeinsImage', link: '/composables/useGeinsImage.md' },
              { text: 'useGeinsLog', link: '/composables/useGeinsLog.md' },
              { text: 'useLayout', link: '/composables/useLayout.md' },
              { text: 'useNavigation', link: '/composables/useNavigation.md' },
              { text: 'usePageError', link: '/composables/usePageError.md' },
              { text: 'usePrice', link: '/composables/usePrice.md' },
              { text: 'useSkeleton', link: '/composables/useSkeleton.md' },
            ],
          },
          {
            text: 'Wholesale',
            items: [
              {
                text: 'usePriceListProducts',
                link: '/composables/usePriceListProducts.md',
              },
              {
                text: 'usePriceListProductsTable',
                link: '/composables/usePriceListProductsTable.md',
              },
              {
                text: 'usePriceListPreview',
                link: '/composables/usePriceListPreview.md',
              },
              {
                text: 'usePriceListVolumePricing',
                link: '/composables/usePriceListVolumePricing.md',
              },
              {
                text: 'usePriceListRules',
                link: '/composables/usePriceListRules.md',
              },
              { text: 'useWholesale', link: '/composables/useWholesale.md' },
              {
                text: 'useWholesaleOrders',
                link: '/composables/useWholesaleOrders.md',
              },
            ],
          },
        ],
      },
      {
        text: 'Stores',
        items: [
          { text: 'useAccountStore', link: '/stores/account.md' },
          { text: 'useBreadcrumbsStore', link: '/stores/breadcrumbs.md' },
          { text: 'useProductsStore', link: '/stores/products.md' },
          { text: 'useUserStore', link: '/stores/user.md' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Feedback system', link: '/guides/ui/feedback-system' },
          // {
          //   text: 'Working with Data Tables',
          //   link: '/guides/data-tables/',
          //   items: [
          //     { text: 'Composables', link: '/guides/data-tables/composables' },
          //     { text: 'Components', link: '/guides/data-tables/components' },
          //   ],
          // },

          // {
          //   text: 'Working with the UI',
          //   link: '/guides/ui/',
          //   items: [
          //     { text: 'Feedback system', link: '/guides/ui/feedback-system' },
          //   ],
          // },
          //{ text: 'Working with the API', link: '/guides/api' },
        ],
      },
    ],
    // footer: {
    //   message: '',
    //   copyright: '',
    // },
  },
});
