import type { NavigationItem } from '../../../types/NavigationItem';
export const navigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: 'Gauge',
  },
  {
    label: 'Products (PIM)',
    href: '/pim/product/list',
    icon: 'ShoppingBasket',
    children: [
      {
        label: 'Products',
        href: '/pim/product/list',
      },
      {
        label: 'Brands',
        href: '',
      },
      {
        label: 'Categories',
        href: '/pim/category/list',
      },
      {
        label: 'Campaigns',
        href: '',
      },
      {
        label: 'Parameters / Filters',
        href: '',
      },
      {
        label: 'Product reviews',
        href: '',
      },
    ],
  },
  {
    label: 'Content (CMS)',
    href: '',
    icon: 'Brush',
    children: [
      {
        label: 'Start Page',
        href: '',
      },
      {
        label: 'Content Areas',
        href: '',
      },
      {
        label: 'Pages',
        href: '',
      },
      {
        label: 'Menus',
        href: '',
      },
    ],
  },
  {
    label: 'Customers (CRM)',
    href: '',
    icon: 'User',
    children: [
      {
        label: 'Customers',
        href: '',
      },
      {
        label: 'Groups',
        href: '',
      },
      {
        label: 'Subscribers',
        href: '',
      },
    ],
  },
  {
    label: 'Warehouse (WMS)',
    href: '',
    icon: 'Warehouse',
    children: [
      {
        label: 'Fulfill orders',
        href: '',
      },
      {
        label: 'Pending - Unstocked',
        href: '',
      },
      {
        label: 'Pending - Locked',
        href: '',
      },
      {
        label: 'Pending - Filter',
        href: '',
      },
      {
        label: 'Handle returns',
        href: '',
      },
      {
        label: 'Refunds',
        href: '',
      },
      {
        label: 'Refunds - Approval',
        href: '',
      },
      {
        label: 'Orders',
        href: '',
      },
      {
        label: 'Order filter',
        href: '',
      },
      {
        label: 'Fulfillment history',
        href: '',
      },
      {
        label: 'Inventory',
        href: '',
      },
    ],
  },
  {
    label: 'Incoming Stock (PO)',
    href: '',
    icon: 'Layers',
    children: [
      {
        label: 'Incoming stock',
        href: '',
      },
      {
        label: 'Purchase orders',
        href: '',
      },
      {
        label: 'Missing stock',
        href: '',
      },
      {
        label: 'Reorder points',
        href: '',
      },
      {
        label: 'Suppliers',
        href: '',
      },
    ],
  },
  {
    label: 'Accounting (ERP)',
    href: '',
    icon: 'Coins',
    children: [
      {
        label: 'Revenue',
        href: '',
      },
      {
        label: 'Revenue / Market',
        href: '',
      },
      {
        label: 'Inventory value',
        href: '',
      },
    ],
  },
  {
    label: 'Statistics',
    href: '',
    icon: 'BarChart3',
    children: [
      {
        label: 'Sales Demand',
        href: '',
      },
      {
        label: 'Products',
        href: '',
      },
      {
        label: 'Returns',
        href: '',
      },
      {
        label: 'Brands',
        href: '',
      },
      {
        label: 'Live',
        href: '',
      },
      {
        label: 'Customers',
        href: '',
      },
    ],
  },
  {
    label: 'Import Tool',
    href: '',
    icon: 'Import',
  },
  {
    label: 'Settings',
    href: '',
    icon: 'Settings',
    children: [
      {
        label: 'API Users',
        href: '',
      },
      {
        label: 'Administrators',
        href: '',
      },
      {
        label: 'Markets',
        href: '',
      },
      {
        label: 'Currencies',
        href: '',
      },
      {
        label: 'Metadata',
        href: '',
      },
      {
        label: '404 Pages',
        href: '',
      },
    ],
  },
  {
    label: 'Super Admin',
    href: '',
    icon: 'ShieldCheck',
    children: [
      {
        label: 'Sites',
        href: '',
      },
      {
        label: 'Settings',
        href: '',
      },
      {
        label: 'Translate / Texts',
        href: '',
      },
      {
        label: 'Language',
        href: '',
      },
      {
        label: 'Legal pages',
        href: '',
      },
      {
        label: 'Countries',
        href: '',
      },
      {
        label: 'Counties',
        href: '',
      },
      {
        label: 'Admin Menu',
        href: '',
      },
      {
        label: 'Pending changes',
        href: '',
      },
      {
        label: 'System information',
        href: '',
      },
      {
        label: 'Cache',
        href: '',
      },
      {
        label: 'Order return codes',
        href: '',
      },
    ],
  },
];
