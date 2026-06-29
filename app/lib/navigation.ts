import type { NavigationItem } from '#shared/types';
import {
  entityBasePath,
  entityChildPattern,
  entityListHref,
} from '#shared/utils/entities';

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
      href: entityListHref('price_list'),
      icon: 'Tag',
      group: 'workspace',
      children: [
        {
          label: t('navigation.price_lists'),
          href: entityListHref('price_list'),
          childPattern: entityChildPattern('price_list'),
        },
      ],
    },
    {
      label: t('navigation.customers'),
      href: entityListHref('company'),
      icon: 'Users',
      group: 'workspace',
      children: [
        {
          label: t('navigation.companies'),
          href: entityListHref('company'),
          childPattern: entityChildPattern('company'),
        },
      ],
    },
    {
      label: t('navigation.orders'),
      href: entityListHref('quotation'),
      icon: 'Package',
      group: 'workspace',
      children: [
        {
          label: t('navigation.quotations'),
          href: entityListHref('quotation'),
          childPattern: entityChildPattern('quotation'),
        },
      ],
    },
    {
      label: t('navigation.orchestrator'),
      href: '/orchestrator',
      icon: 'Workflow',
      group: 'workspace',
      children: [
        {
          label: t('navigation.overview'),
          href: '/orchestrator',
        },
        {
          label: t('navigation.workflows'),
          href: entityListHref('workflow'),
          childPattern: entityChildPattern('workflow'),
        },
        {
          label: t('navigation.executions'),
          href: entityListHref('execution'),
          childPattern: entityChildPattern('execution'),
        },
      ],
    },
    {
      label: t('navigation.channels'),
      href: entityListHref('channel'),
      icon: 'Store',
      group: 'settings',
      childPattern: entityChildPattern('channel'),
    },
    {
      label: t('navigation.orchestrator_config'),
      href: entityListHref('variable'),
      icon: 'Plug',
      group: 'settings',
      defaultOpen: false,
      children: [
        {
          label: t('navigation.variables'),
          href: entityListHref('variable'),
          childPattern: entityChildPattern('variable'),
        },
        {
          label: t('navigation.installed_kits'),
          href: '/settings/orchestrator/kits/installed',
        },
        {
          label: t('navigation.kits'),
          href: '/settings/orchestrator/kits/list',
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
          href: entityBasePath('profile'),
        },
      ],
    },
  ];
};
