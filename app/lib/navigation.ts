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
        // permissions: ['wholesale.accounts.read'],
      },
      {
        label: 'Price lists',
        href: '/wholesale/price-list/list',
        // permissions: ['wholesale.pricelists.read'],
      },
    ],
  },
  // {
  //   label: 'Settings',
  //   href: '/account/market/list',
  //   icon: 'Settings',
  //   divider: true, // Add visual separator above this item
  //   // roles: ['admin'],
  //   children: [
  //     {
  //       label: 'Markets',
  //       href: '/account/market/list',
  //     },
  //     {
  //       label: 'Languages',
  //       href: '/account/language/list',
  //     },
  //     {
  //       label: 'Users',
  //       href: '/account/user/list',
  //       // permissions: ['users.manage'],
  //     },
  //   ],
  // },
];
