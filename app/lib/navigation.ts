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
 * - Localization support via i18n keys (use `getNavigation()` function)
 *
 * Note: Items without roles/permissions are visible to all users
 */

/**
 * Returns localized navigation items
 * Call this function within a component that has access to useI18n()
 */
export const getNavigation = (): NavigationItem[] => {
  const { t } = useI18n();

  return [
    // {
    //   label: t('navigation.dashboard'),
    //   href: '/',
    //   icon: 'LayoutDashboard',
    //   // Visible to all authenticated users
    // },
    {
      label: t('navigation.wholesale'),
      href: '/wholesale/account/list',
      icon: 'Building2',
      group: 'sales',
      // TODO: Add roles when auth system is ready
      // roles: ['admin', 'wholesale_manager'],
      // permissions: ['wholesale.read'],
      children: [
        {
          label: t('navigation.accounts'),
          href: '/wholesale/account/list',
          childPattern: '/wholesale/account/:id', // Matches detail pages like /wholesale/account/123
          // permissions: ['wholesale.accounts.read'],
        },
        {
          label: t('navigation.price_lists'),
          href: '/wholesale/price-list/list',
          childPattern: '/wholesale/price-list/:id', // Matches detail pages like /wholesale/price-list/456
          // permissions: ['wholesale.pricelists.read'],
        },
      ],
    },
    // {
    //   label: t('navigation.settings'),
    //   href: '/account/market/list',
    //   icon: 'Settings',
    //   // roles: ['admin'],
    //    children: [
    //     {
    //       label: t('navigation.users'),
    //       href: '/account/user/list',
    //       // permissions: ['users.manage'],
    //     },
    //   ],
    // },
    {
      label: t('navigation.account'),
      href: '',
      icon: 'User',
      hideFromMenu: true,
      // roles: ['admin'],
      children: [
        {
          label: t('navigation.profile'),
          href: '/account/profile',
          // permissions: ['users.manage'],
        },
      ],
    },
  ];
};
