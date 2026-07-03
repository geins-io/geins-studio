import type { NavigationItem } from '#shared/types';
import {
  entityBasePath,
  entityChildPattern,
  entityListUrl,
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
      href: entityListUrl('price_list'),
      icon: 'Tag',
      group: 'workspace',
      children: [
        {
          label: t('navigation.price_lists'),
          href: entityListUrl('price_list'),
          childPattern: entityChildPattern('price_list'),
        },
      ],
    },
    {
      label: t('navigation.customers'),
      href: entityListUrl('company'),
      icon: 'Users',
      group: 'workspace',
      children: [
        {
          label: t('navigation.companies'),
          href: entityListUrl('company'),
          childPattern: entityChildPattern('company'),
        },
      ],
    },
    {
      label: t('navigation.orders'),
      href: entityListUrl('quotation'),
      icon: 'Package',
      group: 'workspace',
      children: [
        {
          label: t('navigation.quotations'),
          href: entityListUrl('quotation'),
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
          href: entityListUrl('workflow'),
          childPattern: entityChildPattern('workflow'),
        },
        {
          label: t('navigation.executions'),
          href: entityListUrl('execution'),
          childPattern: entityChildPattern('execution'),
        },
      ],
    },
    {
      label: t('navigation.assets'),
      href: entityListUrl('asset'),
      icon: 'Image',
      group: 'workspace',
      childPattern: entityChildPattern('asset'),
    },
    {
      label: t('navigation.channels'),
      href: entityListUrl('channel'),
      icon: 'Store',
      group: 'settings',
      childPattern: entityChildPattern('channel'),
    },
    {
      label: t('navigation.orchestrator_config'),
      href: entityListUrl('variable'),
      icon: 'Plug',
      group: 'settings',
      defaultOpen: false,
      children: [
        {
          label: t('navigation.variables'),
          href: entityListUrl('variable'),
          childPattern: entityChildPattern('variable'),
        },
        {
          label: t('navigation.installed_kits'),
          href: '/settings/orchestrator/kits/installed',
        },
        {
          label: t('navigation.kits'),
          href: '/settings/orchestrator/kits',
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
