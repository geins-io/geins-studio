# APP.md — App-Level Composition & Routing

> Geins Studio: how domains wire together into a runnable SPA.
> For system-wide architecture and data flow, see `ARCHITECTURE.md`.
> For coding conventions and entity patterns, see `CLAUDE.md`.

---

## File-Based Routing

All pages live under `app/pages/` and are auto-registered by Nuxt as routes.

| Route prefix   | Domain pages                        | Capability                           |
| -------------- | ----------------------------------- | ------------------------------------ |
| `/`            | `index.vue`                         | Dashboard — quick access + recent orders |
| `/auth/*`      | `login`, `logout`, `reset-password` | Authentication flows (no sidebar)    |
| `/pricing/*`   | `price-list/list`, `price-list/[id]`| Price list management                |
| `/customers/*` | `company/list`, `company/[id]`      | Company / buyer management           |
| `/orders/*`    | `quotation/list`, `quotation/[id]`  | Quotation lifecycle                  |
| `/account/*`   | `profile/index`, `user/index`       | User profile (hidden from nav)       |

Entity pages follow the convention `pages/{domain}/{entity}/list.vue` and `pages/{domain}/{entity}/[id].vue`. The param `new` on `[id].vue` activates create mode.

---

## Layout System

Two layouts in `app/layouts/`:

| Layout        | Used by               | Structure                                        |
| ------------- | --------------------- | ------------------------------------------------ |
| `default.vue` | All authenticated pages | `SidebarProvider` → `LayoutSidebar` + `SidebarInset` with sticky `LayoutHeader` and a scrollable content slot |
| `auth.vue`    | `/auth/*` routes      | Minimal centered card, no sidebar or header      |

The default layout reads `route.meta.pageType` and applies `overflow-hidden` when `pageType === 'list'` (enables proper full-height table scrolling). Edit/detail pages use `overflow-y-auto`.

---

## Middleware

`app/middleware/auth.global.ts` — runs on every navigation.

- `/auth/*` routes: authenticated users are redirected to `/`; `logout` broadcasts a sign-out event via `BroadcastChannel('geins-auth')`.
- All other routes: unauthenticated users are redirected to `/auth/login?redirect={path}`.
- Test environments (`process.env.VITEST`) skip the guard entirely.

---

## Plugin Initialization Order

Nuxt loads plugins in filename order. Each plugin has a single responsibility:

| Plugin                       | Runs on     | Purpose                                                                        |
| ---------------------------- | ----------- | ------------------------------------------------------------------------------ |
| `geins-api.ts`               | client+server | Creates `$geinsApi` (`$fetch`) with auth headers and token auto-refresh         |
| `auth-state.ts`              | client      | Syncs auth state across browser tabs via `BroadcastChannel`; sets skeleton cookie |
| `geins-global.ts`            | client      | Calls `accountStore.init()` and `productsStore.fetchProducts()` on session start |
| `error-handler.ts`           | client      | Catches `AUTH_ERROR` / `API_ERROR` from Vue's global error handler             |
| `click-outside.client.ts`    | client      | Registers `v-click-outside` directive                                          |
| `click-outside.server.ts`    | server      | Stub — prevents directive errors during SSR compatibility checks               |
| `suppress-devtools-warn.client.ts` | client | Suppresses noisy devtools warnings in development                             |

`$geinsApi` must be initialised before `geins-global.ts` runs — plugin filename order guarantees this.

---

## Navigation Config

`app/lib/navigation.ts` exports `getNavigation(t)` — the single source of truth for the sidebar menu. It returns a `NavigationItem[]` array consumed by `LayoutSidebar`.

Current top-level entries (all in group `sales`):

| Label      | Root href                   | Domain              |
| ---------- | --------------------------- | ------------------- |
| Pricing    | `/pricing/price-list/list`  | Price lists         |
| Customers  | `/customers/company/list`   | Companies           |
| Orders     | `/orders/quotation/list`    | Quotations          |
| Account    | *(hidden from menu)*        | User profile        |

Each entry has optional `children[]` with `childPattern` used for active-state matching. Labels are i18n keys resolved via `t('navigation.*')`.

---

## Page Composition Patterns

### List Page

```
definePageMeta({ pageType: 'list' })
→ useGeinsRepository()     — typed API client
→ useAsyncData()           — fetch with SSR cache key
→ useColumns<T>()          — column defs + addActionsColumn
→ useTable<T>()            — visibility / sort state
→ useEntityUrl()           — link generation
→ usePageError()           — error handling
→ <TableView />            — renders table + pagination
```

Error handling: a `fetchError` ref is passed to `TableView` (`:error` + `:on-retry`). `NuxtErrorBoundary` wraps as a safety net.

### Detail / Edit Page

```
Zod schema → toTypedSchema()
→ useEntityEdit<TBase, TResponse, TCreate, TUpdate>({
    repository,          — { get, create, update, delete }
    validationSchema,
    initialEntityData,
    parseEntityData,     — API response → form values
    prepareCreateData,   — form → POST body
    prepareUpdateData,   — form → PATCH body
  })
```

`useEntityEdit` provides: `form`, `entityData`, `createMode`, `createEntity()`, `updateEntity()`, `deleteEntity()`, `hasUnsavedChanges`, `confirmLeave`, `currentTab`, `showSidebar`.

Edit mode requires the standard data-loading block (see `CLAUDE.md` → "Edit Mode Data Loading") using `useAsyncData` + `onMounted` + `parseAndSaveData`.

---

## Routes ↔ Domain Capabilities

Routes are entry points; domains are the capabilities they expose.

| Route                       | Domain capability                            |
| --------------------------- | -------------------------------------------- |
| `/pricing/price-list/*`     | CRUD price lists; assign to companies        |
| `/customers/company/*`      | CRUD companies; assign buyers, salesreps, price lists, addresses |
| `/orders/quotation/*`       | Full quotation lifecycle: draft → send → accept/reject → confirm → finalize |
| `/account/profile`          | Edit own user profile and preferences        |
| `/auth/*`                   | Session management (login, logout, password reset) |

Cross-domain links: the quotation edit page links to company and price-list entities via `useEntityUrl()` / `getEntityUrlFor()`.

---

## Decision Log