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
 * - Localization support via i18n keys
 *
 * Note: Items without roles/permissions are visible to all users
 */

/**
 * Returns localized navigation items
 * @param t - Translation function from useI18n()
 */
export const getNavigation = (t: (key: string) => string): NavigationItem[] => {
  return [
    // {
    //   label: t('navigation.dashboard'),
    //   href: '/',
    //   icon: 'LayoutDashboard',
    //   // Visible to all authenticated users
    // },
    {
      label: t('navigation.pricing'),
      href: '/pricing/price-list/list',
      icon: 'Tag',
      group: 'sales',
      // TODO: Add roles when auth system is ready
      // roles: ['admin', 'pricing_manager'],
      // permissions: ['pricing.read'],
      children: [
        {
          label: t('navigation.price_lists'),
          href: '/pricing/price-list/list',
          childPattern: '/pricing/price-list/:id',
          // permissions: ['pricing.pricelists.read'],
        },
      ],
    },
    {
      label: t('navigation.customers'),
      href: '/customers/company/list',
      icon: 'Users',
      group: 'sales',
      // TODO: Add roles when auth system is ready
      // roles: ['admin', 'customer_manager'],
      // permissions: ['customers.read'],
      children: [
        {
          label: t('navigation.companies'),
          href: '/customers/company/list',
          childPattern: '/customers/company/:id',
          // permissions: ['customers.companies.read'],
        },
      ],
    },
    {
      label: t('navigation.orders'),
      href: '/orders/quotation/list',
      icon: 'Package',
      group: 'sales',
      // TODO: Add roles when auth system is ready
      // roles: ['admin', 'order_manager'],
      // permissions: ['orders.read'],
      children: [
        {
          label: t('navigation.quotations'),
          href: '/orders/quotation/list',
          childPattern: '/orders/quotation/:id',
          // permissions: ['orders.quotations.read'],
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
