import type { NavigationItem } from '#shared/types';

/**
 * Main navigation configuration for the admin system
 *
 * Features:
 * - Role-based access control via `roles` and `permissions` fields
 * - Hierarchical structure with children
 * - Icons from lucide-vue-next
 * - Grouping and visual dividers
 * - Badge support for notifications
 *
 * Note: Items without roles/permissions are visible to all users
 */
export const navigation: NavigationItem[] = [
  // {
  //   label: 'Dashboard',
  //   href: '/',
  //   icon: 'LayoutDashboard',
  //   // Visible to all authenticated users
  // },
  {
    label: 'Wholesale',
    href: '/wholesale/account/list',
    icon: 'Building2',
    group: 'sales',
    // TODO: Add roles when auth system is ready
    // roles: ['admin', 'wholesale_manager'],
    // permissions: ['wholesale.read'],
    children: [
      {
        label: 'Accounts',
        href: '/wholesale/account/list',
        childPattern: '/wholesale/account/:id', // Matches detail pages like /wholesale/account/123
        // permissions: ['wholesale.accounts.read'],
      },
      {
        label: 'Price lists',
        href: '/wholesale/price-list/list',
        childPattern: '/wholesale/price-list/:id', // Matches detail pages like /wholesale/price-list/456
        // permissions: ['wholesale.pricelists.read'],
      },
    ],
  },
  {
    label: 'Integrations',
    href: '/integrations/list',
    icon: 'Layers',
    group: 'sales',
    children: [
      {
        label: 'Workflows',
        href: '/integrations/workflows/list',
        childPattern: '/integrations/workflows/:id', // Matches detail pages like /wholesale/price-list/456
        // permissions: ['wholesale.pricelists.read'],
      },
    ],
  },

  // {
  //   label: 'Settings',
  //   href: '/account/market/list',
  //   icon: 'Settings',
  //   // roles: ['admin'],
  //    children: [
  //     {
  //       label: 'Users',
  //       href: '/account/user/list',
  //       // permissions: ['users.manage'],
  //     },
  //   ],
  // },
  {
    label: 'Account',
    href: '',
    icon: 'User',
    hideFromMenu: true,
    // roles: ['admin'],
    children: [
      {
        label: 'Profile',
        href: '/account/profile',
        // permissions: ['users.manage'],
      },
    ],
  },
];
