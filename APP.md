# APP.md — App-Level Composition & Routing

> Geins Studio — how domains wire into a runnable application.
> For system architecture, data flow, and the repository layer see `ARCHITECTURE.md`.
> For coding conventions, component patterns, and domain-specific rules see `CLAUDE.md`.

---

## File-Based Routing

Nuxt 4 maps `app/pages/` directly to URL routes. The current route tree:

```
/                              → app/pages/index.vue          (dashboard)
/auth/login                    → app/pages/auth/login.vue
/auth/logout                   → app/pages/auth/logout.vue
/auth/reset-password           → app/pages/auth/reset-password.vue
/pricing/price-list/list       → app/pages/pricing/price-list/list.vue
/pricing/price-list/:id        → app/pages/pricing/price-list/[id].vue
/customers/company/list        → app/pages/customers/company/list.vue
/customers/company/:id         → app/pages/customers/company/[id].vue
/orders/quotation/list         → app/pages/orders/quotation/list.vue
/orders/quotation/:id          → app/pages/orders/quotation/[id].vue
/account/profile               → app/pages/account/profile/index.vue
/account/user/list             → app/pages/account/user/list.vue
```

The special param value `new` on `/:id` routes activates **create mode** (`route.params.id === 'new'`). All other values are treated as entity IDs for edit mode. See `CLAUDE.md → Entity Edit Page` for the full required boilerplate.

---

## Routes → Domains

Each URL segment maps to a business domain. Domains own their components, composables, and repository logic:

| URL segment   | Domain            | Capabilities                                 |
| ------------- | ----------------- | -------------------------------------------- |
| `/pricing`    | Price lists       | Create, edit, copy, delete price list rules  |
| `/customers`  | Companies & users | Manage B2B companies, buyers, addresses      |
| `/orders`     | Quotations        | Full quotation lifecycle (draft → finalized) |
| `/account`    | Account & profile | User profile, system users                   |
| `/auth`       | Authentication    | Login, logout, password reset                |

Domain components live in `app/components/{domain}/` (e.g. `company/`, `price-list/`, `orders/`). Routes are the entry points; domains hold the capability.

---

## Navigation Config

`app/lib/navigation.ts` exports `getNavigation(t)` — the single source of truth for sidebar links. It returns a `NavigationItem[]` tree that the sidebar component renders. Items use:

- `href` — primary route
- `childPattern` — route pattern for active-state matching (e.g. `/pricing/price-list/:id`)
- `icon` — Lucide icon name
- `group` — visual grouping in the sidebar
- `hideFromMenu` — for account routes rendered outside the main nav

Navigation labels are translated via `t('navigation.*')` so adding a new section requires an i18n key in both `en.json` and `sv.json`.

---

## Layouts

| Layout       | File                    | Used for                                      |
| ------------ | ----------------------- | --------------------------------------------- |
| `default`    | `app/layouts/default.vue` | All authenticated pages — sidebar + sticky header + content area |
| `auth`       | `app/layouts/auth.vue`  | Auth pages (`/auth/*`) — minimal centered card |

**`default.vue`** composes:
- `LayoutSidebar` — collapsible sidebar driven by `useLayout()` / `SidebarProvider`
- `LayoutHeader` — sticky top header (breadcrumbs, account menu)
- Content area — `overflow-hidden` for list pages, `overflow-y-auto` for all others (controlled by `route.meta.pageType === 'list'`)
- `SpeedInsights` — Vercel analytics

Page type is declared with `definePageMeta({ pageType: 'list' })` on list pages to trigger the correct scroll behavior in the layout.

---

## Middleware

**`app/middleware/auth.global.ts`** — global route guard, runs on every navigation:

- **Auth pages** (`/auth/*`): allowed through for unauthenticated users. Already-authenticated users are redirected to `/`.
- **Logout** (`/auth/logout`): broadcasts `{ session: null }` to other tabs via the `geins-auth` `BroadcastChannel` before allowing the route.
- **All other pages**: unauthenticated users are redirected to `/auth/login?redirect={fullPath}`. Root path (`/`) omits the redirect param.
- **Vitest**: middleware is skipped when `process.env.VITEST` is set, so tests don't need an auth session.

---

## Plugin Initialization Order

Plugins in `app/plugins/` run at app startup in this logical order:

| Plugin                        | Purpose                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `geins-api.ts`                | Creates `$geinsApi` (`$fetch` instance) with auth headers and token auto-refresh  |
| `auth-state.ts`               | Cross-tab auth sync via `BroadcastChannel`; sets `geins-auth` cookie for skeleton screens |
| `geins-global.ts`             | Initializes `accountStore` and `productsStore` on authenticated sessions          |
| `error-handler.ts`            | Global Vue error handler — catches `AUTH_ERROR` and `API_ERROR` and routes them   |
| `click-outside.client.ts`     | Registers `v-click-outside` directive (client only)                               |
| `click-outside.server.ts`     | Server-side stub for SSR compatibility                                            |
| `suppress-devtools-warn.client.ts` | Suppresses Vue devtools warnings in development (client only)               |

`$geinsApi` must be created before `geins-global.ts` can init stores, so plugin order matters.

---

## Page Composition Patterns

### List Page

```
definePageMeta({ pageType: 'list' })
  useGeinsRepository()       — typed API access
  useAsyncData()             — fetch + cache
  useColumns<T>()            — column definitions + addActionsColumn
  useTable<T>()              — visibility state
  useEntityUrl()             — route URL helpers
  usePageError()             — error/retry state
  → <TableView />            — renders table with pagination, sorting, filters
```

Error handling: `fetchError` ref passed to `<TableView :error="fetchError" :on-retry="refresh" />` renders an inline retry empty state (`EmptyMedia variant="destructive"` — red icon + retry button).

### Detail / Edit Page

```
Zod schema → toTypedSchema()
  useEntityEdit<TBase, TResponse, TCreate, TUpdate>({
    repository: { get, create, update, delete },
    validationSchema,
    parseEntityData,          — API response → form values
    prepareCreateData,        — form → POST body
    prepareUpdateData,        — form → PATCH body
  })
  → Edit mode boilerplate:
      useAsyncData(entityFetchKey, () => repo.get(id))
      onMounted → handleFetchResult → parseAndSaveData
```

Route param `new` → create mode (no data fetch). Any other value → edit mode (loads entity, populates form). After creation the composable auto-navigates to the edit URL via `router.replace()`.

---

## Decision Log

<!-- Record significant architectural decisions here as they are made. -->
