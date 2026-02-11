import type { NavigationItem } from '#shared/types';

/**
 * Main navigation configuration for the admin system
 *
 * Features:
 * - Role-based access control via `roles` and `permissions` fields
 * - Hierarchical structure with children
 * - Icons from nuxt-lucide-icons (auto-imported Lucide icons)
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
    {
      label: t('navigation.pricing'),
      href: '/pricing/price-list/list',
      icon: 'Tag',
      group: 'sales',
      children: [
        {
          label: t('navigation.price_lists'),
          href: '/pricing/price-list/list',
          childPattern: '/pricing/price-list/:id',
        },
      ],
    },
    {
      label: t('navigation.customers'),
      href: '/customers/company/list',
      icon: 'Users',
      group: 'sales',
      children: [
        {
          label: t('navigation.companies'),
          href: '/customers/company/list',
          childPattern: '/customers/company/:id',
        },
      ],
    },
    {
      label: t('navigation.account'),
      href: '',
      icon: 'User',
      hideFromMenu: true,
      children: [
        {
          label: t('navigation.profile'),
          href: '/account/profile',
        },
      ],
    },
  ];
};
