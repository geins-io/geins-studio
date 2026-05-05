# `LayoutSidebarUser`

`LayoutSidebarUser` is the sidebar footer — user avatar with name + email and a dropdown menu for account switching, profile, logout, and dark-mode toggle. Mounted inside [`LayoutSidebar`](/components/layout/sidebar/LayoutSidebar)'s footer.

## Features

- Avatar with initials fallback, plus name + email pulled from [`useUserStore`](/stores/user)
- Account switcher submenu when the user has more than one account (`hasMultipleAccounts`) — calls [`useGeinsAuth().setAccount`](/composables/useGeinsAuth) and reloads to `/`
- Profile link to `/account/profile`
- Logout via [`useGeinsAuth().logout`](/composables/useGeinsAuth)
- Dark / light mode toggle via Nuxt's `useColorMode`
- Mobile-aware menu placement (bottom on mobile, right on desktop) via `useSidebar().isMobile`

## Usage

This component is not designed to be used standalone — it's mounted inside [`LayoutSidebar`](/components/layout/sidebar/LayoutSidebar)'s footer. Customising the menu means editing this file directly.

## Dependencies

- shadcn-vue [`DropdownMenu`](/components/shadcn-vue) (with `Sub`/`Portal` variants), `Avatar`, `SidebarMenu`, `useSidebar`
- [`useGeinsAuth`](/composables/useGeinsAuth) — `session`, `setAccount`, `logout`
- [`useUserStore`](/stores/user) — user identity + account list
- [`usePageError`](/composables/usePageError) — `showErrorToast` on account-switch failure
- `useColorMode` (Nuxt color-mode module) — dark/light toggle
