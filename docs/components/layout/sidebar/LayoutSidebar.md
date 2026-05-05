# `LayoutSidebar`

`LayoutSidebar` is the app's primary navigation sidebar — logo, grouped navigation menu (workspace + settings), and the user dropdown footer. Mounted by the default Nuxt layout.

## Features

- Two visual states driven by shadcn-vue's `useSidebar`: `expanded` (full logo + labels) and `collapsed` (just the letter logo + icons with tooltips)
- Persists open/closed via the `SIDEBAR_COOKIE_NAME` cookie (1-year max age)
- Items grouped by `group` property (`workspace`, `settings`) — group label is i18n-translated via `navigation.<group>` keys
- Items with `children` render a `Collapsible` parent — when sidebar is collapsed, parent click navigates to first child instead
- Active item detection via [`useNavigation().isItemActive`](/composables/useNavigation)
- Auto-closes on mobile after navigation
- Icons resolved dynamically via `useLucideIcon().resolveIcon` — any PascalCase Lucide name works

## Usage

The default Nuxt layout already mounts this. Navigation items come from `useNavigation()` which reads from the navigation registry — see [navigation registration](/composables/useNavigation) for adding entries.

## Dependencies

- shadcn-vue [`Sidebar`](/components/shadcn-vue), `SidebarHeader`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuButton`, `SidebarFooter`, `Collapsible`, `useSidebar`
- [`LayoutSidebarUser`](/components/layout/sidebar/LayoutSidebarUser) — footer user dropdown
- [`useNavigation`](/composables/useNavigation) — source of `navigationItems` and `isItemActive`
- `useLucideIcon` — dynamic Lucide icon resolution
