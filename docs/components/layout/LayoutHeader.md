# `LayoutHeader`

`LayoutHeader` is the top header bar of the app shell — sidebar toggle button on the left and the breadcrumb trail on the right. Mounted by the default Nuxt layout; not used standalone.

## Features

- Sidebar toggle button bound to `useSidebar().toggleSidebar` with a `⌘ + G` shortcut hint in the tooltip
- Breadcrumb trail driven by [`useBreadcrumbsStore`](/stores/breadcrumbs) — items with `href` render as `NuxtLink`, the last item renders as plain text
- Mobile breadcrumb prepends a logo link to `/` so users can always reach home
- Suppresses the toggle tooltip on touch-only devices (`@media (hover: hover)` check)
- Calls [`useNavigation()`](/composables/useNavigation) on mount to wire navigation state

## Usage

The default Nuxt layout already includes this — no manual placement needed. To preview the breadcrumb behaviour, set the trail in any page:

```ts
const breadcrumbsStore = useBreadcrumbsStore();
breadcrumbsStore.setTrail([
  { label: t('quotations'), href: '/orders/quotations' },
  { label: 'Q-1042' },
]);
```

## Dependencies

- shadcn-vue [`Breadcrumb`](/components/shadcn-vue), [`Tooltip`](/components/shadcn-vue), `Button`, `useSidebar`
- [`useNavigation`](/composables/useNavigation), [`useBreadcrumbsStore`](/stores/breadcrumbs)
