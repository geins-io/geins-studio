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
        collapsed: true,
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
              { text: 'useDate', link: '/composables/useDate.md' },
              { text: 'useGeinsImage', link: '/composables/useGeinsImage.md' },
              { text: 'useGeinsLog', link: '/composables/useGeinsLog.md' },
              { text: 'useLayout', link: '/composables/useLayout.md' },
              { text: 'useNavigation', link: '/composables/useNavigation.md' },
              { text: 'usePageError', link: '/composables/usePageError.md' },
              { text: 'usePageTitle', link: '/composables/usePageTitle.md' },
              { text: 'usePrice', link: '/composables/usePrice.md' },
              { text: 'useSkeleton', link: '/composables/useSkeleton.md' },
            ],
          },
          {
            text: 'Orders',
            items: [
              {
                text: 'useCompanyOrders',
                link: '/composables/useCompanyOrders.md',
              },
              {
                text: 'useCustomerCompanies',
                link: '/composables/useCustomerCompanies.md',
              },
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
        text: 'Components',
        collapsed: true,
        items: [
          {
            text: 'shadcn-vue primitives',
            link: '/components/shadcn-vue.md',
          },
          {
            text: 'Buttons',
            items: [
              {
                text: 'ButtonExport',
                link: '/components/button/ButtonExport.md',
              },
              { text: 'ButtonIcon', link: '/components/button/ButtonIcon.md' },
            ],
          },
          {
            text: 'Dialogs',
            items: [
              {
                text: 'DialogDelete',
                link: '/components/dialog/DialogDelete.md',
              },
              {
                text: 'DialogStatusTransition',
                link: '/components/dialog/DialogStatusTransition.md',
              },
              {
                text: 'DialogUnsavedChanges',
                link: '/components/dialog/DialogUnsavedChanges.md',
              },
            ],
          },
          {
            text: 'Form layout',
            items: [
              { text: 'FormGrid', link: '/components/form/FormGrid.md' },
              {
                text: 'FormGridWrap',
                link: '/components/form/FormGridWrap.md',
              },
              {
                text: 'FormItemSwitch',
                link: '/components/form/item/FormItemSwitch.md',
              },
            ],
          },
          {
            text: 'Form inputs',
            items: [
              {
                text: 'FormInputChannels',
                link: '/components/form/input/FormInputChannels.md',
              },
              {
                text: 'FormInputColor',
                link: '/components/form/input/FormInputColor.md',
              },
              {
                text: 'FormInputCountrySelect',
                link: '/components/form/input/FormInputCountrySelect.md',
              },
              {
                text: 'FormInputDate',
                link: '/components/form/input/FormInputDate.md',
              },
              {
                text: 'FormInputDescription',
                link: '/components/form/input/FormInputDescription.md',
              },
              {
                text: 'FormInputFont',
                link: '/components/form/input/FormInputFont.md',
              },
              {
                text: 'FormInputImage',
                link: '/components/form/input/FormInputImage.md',
              },
              {
                text: 'FormInputLanguageSelect',
                link: '/components/form/input/FormInputLanguageSelect.md',
              },
              {
                text: 'FormInputLocked',
                link: '/components/form/input/FormInputLocked.md',
              },
              {
                text: 'FormInputMarketSelect',
                link: '/components/form/input/FormInputMarketSelect.md',
              },
              {
                text: 'FormInputPixel',
                link: '/components/form/input/FormInputPixel.md',
              },
              {
                text: 'FormInputRadioCards',
                link: '/components/form/input/FormInputRadioCards.md',
              },
              {
                text: 'FormInputSelectSearch',
                link: '/components/form/input/FormInputSelectSearch.md',
              },
              {
                text: 'FormInputTagsSearch',
                link: '/components/form/input/FormInputTagsSearch.md',
              },
            ],
          },
          {
            text: 'Tables',
            items: [
              {
                text: 'TableColumnToggle',
                link: '/components/table/TableColumnToggle.md',
              },
              {
                text: 'TablePagination',
                link: '/components/table/TablePagination.md',
              },
              { text: 'TableView', link: '/components/table/TableView.md' },
              {
                text: 'TableHeaderSort',
                link: '/components/table/header/TableHeaderSort.md',
              },
            ],
          },
          {
            text: 'Table cells',
            items: [
              {
                text: 'TableCellActions',
                link: '/components/table/cell/TableCellActions.md',
              },
              {
                text: 'TableCellBoolean',
                link: '/components/table/cell/TableCellBoolean.md',
              },
              {
                text: 'TableCellChannels',
                link: '/components/table/cell/TableCellChannels.md',
              },
              {
                text: 'TableCellCurrency',
                link: '/components/table/cell/TableCellCurrency.md',
              },
              {
                text: 'TableCellDelete',
                link: '/components/table/cell/TableCellDelete.md',
              },
              {
                text: 'TableCellEdit',
                link: '/components/table/cell/TableCellEdit.md',
              },
              {
                text: 'TableCellEditable',
                link: '/components/table/cell/TableCellEditable.md',
              },
              {
                text: 'TableCellFlag',
                link: '/components/table/cell/TableCellFlag.md',
              },
              {
                text: 'TableCellLongText',
                link: '/components/table/cell/TableCellLongText.md',
              },
              {
                text: 'TableCellProduct',
                link: '/components/table/cell/TableCellProduct.md',
              },
              {
                text: 'TableCellStatus',
                link: '/components/table/cell/TableCellStatus.md',
              },
              {
                text: 'TableCellSwitch',
                link: '/components/table/cell/TableCellSwitch.md',
              },
              {
                text: 'TableCellTags',
                link: '/components/table/cell/TableCellTags.md',
              },
              {
                text: 'TableCellTooltip',
                link: '/components/table/cell/TableCellTooltip.md',
              },
            ],
          },
          {
            text: 'Selector',
            items: [
              {
                text: 'Selector',
                link: '/components/selector/Selector.md',
              },
              {
                text: 'SelectorHeader',
                link: '/components/selector/SelectorHeader.md',
              },
              {
                text: 'SelectorLinkingWord',
                link: '/components/selector/SelectorLinkingWord.md',
              },
              {
                text: 'SelectorPanel',
                link: '/components/selector/SelectorPanel.md',
              },
              {
                text: 'SelectorQuickAdd',
                link: '/components/selector/SelectorQuickAdd.md',
              },
              {
                text: 'SelectorSelection',
                link: '/components/selector/SelectorSelection.md',
              },
              {
                text: 'SelectorTag',
                link: '/components/selector/SelectorTag.md',
              },
              {
                text: 'SelectorTagLink',
                link: '/components/selector/SelectorTagLink.md',
              },
              {
                text: 'SelectorTags',
                link: '/components/selector/SelectorTags.md',
              },
            ],
          },
          {
            text: 'Content',
            items: [
              {
                text: 'ContentActionBar',
                link: '/components/content/ContentActionBar.md',
              },
              {
                text: 'ContentAddressDisplay',
                link: '/components/content/ContentAddressDisplay.md',
              },
              {
                text: 'ContentAddressForm',
                link: '/components/content/ContentAddressForm.md',
              },
              {
                text: 'ContentCard',
                link: '/components/content/ContentCard.md',
              },
              {
                text: 'ContentCardHeader',
                link: '/components/content/ContentCardHeader.md',
              },
              {
                text: 'ContentDataList',
                link: '/components/content/ContentDataList.md',
              },
              {
                text: 'ContentHeader',
                link: '/components/content/ContentHeader.md',
              },
              {
                text: 'ContentHeading',
                link: '/components/content/ContentHeading.md',
              },
              {
                text: 'ContentLinkCard',
                link: '/components/content/ContentLinkCard.md',
              },
              {
                text: 'ContentPriceSummary',
                link: '/components/content/ContentPriceSummary.md',
              },
              {
                text: 'ContentSection',
                link: '/components/content/ContentSection.md',
              },
              {
                text: 'ContentSwitch',
                link: '/components/content/ContentSwitch.md',
              },
              {
                text: 'ContentTitleBlock',
                link: '/components/content/ContentTitleBlock.md',
              },
              {
                text: 'ContentTextCopy',
                link: '/components/content/text/ContentTextCopy.md',
              },
              {
                text: 'ContentTextTooltip',
                link: '/components/content/text/ContentTextTooltip.md',
              },
            ],
          },
          {
            text: 'Layout',
            items: [
              {
                text: 'LayoutHeader',
                link: '/components/layout/LayoutHeader.md',
              },
              {
                text: 'LayoutSidebar',
                link: '/components/layout/sidebar/LayoutSidebar.md',
              },
              {
                text: 'LayoutSidebarUser',
                link: '/components/layout/sidebar/LayoutSidebarUser.md',
              },
            ],
          },
          {
            text: 'Sidebar nav',
            items: [
              {
                text: 'SidebarNav',
                link: '/components/sidebar/SidebarNav.md',
              },
              {
                text: 'SidebarNavItem',
                link: '/components/sidebar/SidebarNavItem.md',
              },
            ],
          },
          {
            text: 'Errors',
            items: [
              { text: '404', link: '/components/error/404.md' },
              { text: '500', link: '/components/error/500.md' },
            ],
          },
          {
            text: 'Feedback',
            items: [
              {
                text: 'Feedback',
                link: '/components/feedback/Feedback.md',
              },
            ],
          },
          {
            text: 'Other',
            items: [
              { text: 'StatusBadge', link: '/components/StatusBadge.md' },
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
          { text: 'Testing', link: '/guides/testing' },
          { text: 'Forms', link: '/guides/forms' },
        ],
      },
    ],
    // footer: {
    //   message: '',
    //   copyright: '',
    // },
  },
});
