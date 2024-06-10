<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isCollapsed?: boolean;
  }>(),
  {
    isCollapsed: false,
  },
);
const navigationMenu = [
  {
    label: 'Dashboard',
    href: '/Admin/Dashboard/Index',
    icon: 'Gauge',
  },
  {
    label: 'Products (PIM)',
    href: '/Admin/Product/List',
    icon: 'ShoppingBasket',
    children: [
      {
        label: 'Products',
        href: '/Admin/Product/List',
      },
      {
        label: 'Brands',
        href: '/Admin/Brand/List',
      },
      {
        label: 'Categories',
        href: '/Admin/ProductCategory/List',
      },
      {
        label: 'Campaigns',
        href: '/Admin/Campaigns/List',
      },
      {
        label: 'Parameters / Filters',
        href: '/Admin/ProductParameterGroupAll/List',
      },
      {
        label: 'Product reviews',
        href: '/Admin/ProductComment/List',
      },
    ],
  },
  {
    label: 'Content (CMS)',
    href: '/Admin/PageWidget/List?target=start',
    icon: 'Brush',
    children: [
      {
        label: 'Start Page',
        href: '/Admin/PageWidget/List?target=start',
      },
      {
        label: 'Content Areas',
        href: '/Admin/PageWidget/List?target=content',
      },
      {
        label: 'Pages',
        href: '/Admin/PageWidget/List?target=pages',
      },
      {
        label: 'Menus',
        href: '/Admin/Menus/List',
      },
    ],
  },
  {
    label: 'Customers (CRM)',
    href: '/Admin/User/List',
    icon: 'User',
    children: [
      {
        label: 'Customers',
        href: '/Admin/User/List',
      },
      {
        label: 'Groups',
        href: '/Admin/Member/List',
      },
      {
        label: 'Subscribers',
        href: '/Admin/Mail/List',
      },
    ],
  },
  {
    label: 'Warehouse (WMS)',
    href: '/Admin/Order/List',
    icon: 'Warehouse',
    children: [
      {
        label: 'Fulfill orders',
        href: '/Stock/Order/Deliver',
      },
      {
        label: 'Pending - Unstocked',
        href: '/Stock/Order/NotReady',
      },
      {
        label: 'Pending - Locked',
        href: '/Admin/OrderLockedTemp/List',
      },
      {
        label: 'Pending - Filter',
        href: '/Admin/OrderFilterNewOrder/List',
      },
      {
        label: 'Handle returns',
        href: '/Stock/Order/OrderReturn',
      },
      {
        label: 'Refunds',
        href: '/Admin/OrderRefund/List',
      },
      {
        label: 'Refunds - Approval',
        href: '/Admin/Refund/Approvals',
      },
      {
        label: 'Orders',
        href: '/Admin/Order/List',
      },
      {
        label: 'Order filter',
        href: '/Admin/OrderFilter/List',
      },
      {
        label: 'Fulfillment history',
        href: '/Stock/OrderParcelGroup/List',
      },
      {
        label: 'Inventory',
        href: '/Stock/Inventory/Manage',
      },
    ],
  },
  {
    label: 'Incoming Stock (PO)',
    href: '/Admin/ProductSupplierOrderInsGet/List',
    icon: 'Layers',
    children: [
      {
        label: 'Incoming stock',
        href: '/Admin/ProductSupplierOrderInsGet/List',
      },
      {
        label: 'Purchase orders',
        href: '/Admin/ProductSupplierOrder/List',
      },
      {
        label: 'Missing stock',
        href: '/Stock/ProductsNotReadyToSendGet/List',
      },
      {
        label: 'Reorder points',
        href: '/Admin/ProductSupplier/ProductListAll',
      },
      {
        label: 'Suppliers',
        href: '/Admin/ProductSupplier/List',
      },
    ],
  },
  {
    label: 'Accounting (ERP)',
    href: '/Statistics/Stat/Revenue',
    icon: 'Coins',
    children: [
      {
        label: 'Revenue',
        href: '/Statistics/Stat/Revenue',
      },
      {
        label: 'Revenue / Market',
        href: '/Statistics/Stat/Sales',
      },
      {
        label: 'Inventory value',
        href: '/Admin/ProductItemStockValueSummaryGet/List',
      },
    ],
  },
  {
    label: 'Statistics',
    href: '/Statistics/Stat/Demand',
    icon: 'BarChart3',
    children: [
      {
        label: 'Sales Demand',
        href: '/Statistics/Stat/Demand',
      },
      {
        label: 'Products',
        href: '/Statistics/Stat/Products',
      },
      {
        label: 'Returns',
        href: '/Statistics/Stat/Returns',
      },
      {
        label: 'Brands',
        href: '/Statistics/StatisticsTotalBrandMonthSalesGet/List',
      },
      {
        label: 'Live',
        href: '/Statistics/LiveStat/LatestOrders',
      },
      {
        label: 'Customers',
        href: '/Statistics/Stat/Customers',
      },
    ],
  },
  {
    label: 'Import Tool',
    href: '/Admin/Import/List',
    icon: 'Import',
  },
  {
    label: 'Settings',
    href: '/Admin/MgmtApiUser/List',
    icon: 'Settings',
    children: [
      {
        label: 'API Users',
        href: '/Admin/MgmtApiUser/List',
      },
      {
        label: 'Administrators',
        href: '/Admin/AdminUser/List',
      },
      {
        label: 'Markets',
        href: '/Admin/SiteCountry/List',
      },
      {
        label: 'Currencies',
        href: '/Admin/Currency/List',
      },
      {
        label: 'Metadata',
        href: '/Admin/Meta/List',
      },
      {
        label: '404 Pages',
        href: '/Admin/Url404/List',
      },
    ],
  },
  {
    label: 'Super Admin',
    href: '/Admin/Settings/List',
    icon: 'ShieldCheck',
    children: [
      {
        label: 'Sites',
        href: '/Admin/Site/List',
      },
      {
        label: 'Settings',
        href: '/Admin/Settings/List',
      },
      {
        label: 'Translate / Texts',
        href: '/Language/SystemText/Translate',
      },
      {
        label: 'Language',
        href: '/Admin/Language/List',
      },
      {
        label: 'Legal pages',
        href: '/Admin/InfoPage/List',
      },
      {
        label: 'Countries',
        href: '/Admin/Country/List',
      },
      {
        label: 'Counties',
        href: '/Admin/State/List',
      },
      {
        label: 'Admin Menu',
        href: '/Admin/AdminMenu/List',
      },
      {
        label: 'Pending changes',
        href: '/Admin/PendingChange/List',
      },
      {
        label: 'System information',
        href: '/Admin/SystemInformation/List',
      },
      {
        label: 'Cache',
        href: '/Admin/Cache/List',
      },
      {
        label: 'Order return codes',
        href: '/Admin/OrderReturnCode/List',
      },
    ],
  },
];
</script>

<template>
  <nav>
    <ul>
      <li v-for="(item, index) in navigationMenu" :key="index">
        <NavigationItem :item="item" :is-collapsed="props.isCollapsed" />
      </li>
    </ul>
  </nav>
</template>
