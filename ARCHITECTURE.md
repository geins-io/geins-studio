# Architecture

> Geins Studio — Admin interface for Geins Commerce Backend

## Overview

Geins Studio is a **client-side SPA** (`ssr: false`) built with **Nuxt 4**, **TypeScript**, **shadcn-vue**, and **Tailwind CSS 4**. It communicates with the Geins Management API through a Nitro server proxy that handles authentication forwarding.

```
┌─────────────────────────────────────────────────────────┐
│  Browser (SPA)                                          │
│  ┌────────┐  ┌────────────┐  ┌───────────────────────┐  │
│  │ Pages  │→│ Composables │→│ Repository Factories  │  │
│  │        │  │ useEntity…  │  │ product/customer/…    │  │
│  │        │  │ useTable    │  │ entityRepo/entityBase │  │
│  └────────┘  └────────────┘  └───────────┬───────────┘  │
│         ↕            ↕                    │              │
│  ┌────────────┐ ┌──────────┐              │              │
│  │ Pinia      │ │ Plugins  │              │              │
│  │ Stores     │ │ geins-api│              │              │
│  └────────────┘ └──────────┘              │              │
│                                           ↓              │
│                               $geinsApi ($fetch)         │
└───────────────────────────────────┬──────────────────────┘
                                    │ /api/*
                                    ↓
┌───────────────────────────────────────────────────────────┐
│  Nitro Server                                             │
│  server/api/[...].ts  — catch-all proxy                   │
│  server/api/auth/[...].ts — NextAuth.js handler           │
│  Adds Bearer token, forwards to GEINS_API_URL             │
└───────────────────────────────────┬───────────────────────┘
                                    ↓
                        Geins Management API
                   (https://mgmtapi.geins.services/v2)
```

## Directory Structure

```
app/                        # All client-side SPA code
├── assets/css/             # Tailwind 4 theme (main.css with CSS custom properties)
├── components/
│   ├── ui/                 # shadcn-vue primitives (install via CLI, don't create manually)
│   └── {domain}/           # Domain components: price-list/, company/, auth/, table/, etc.
├── composables/            # Stateful composition logic (useEntityEdit, useTable, etc.)
├── layouts/                # default.vue (sidebar + header) and auth.vue (minimal centered)
├── lib/                    # Pure logic: navigation.ts (sidebar nav config)
├── middleware/             # auth.global.ts — route protection
├── pages/                  # File-based routing
├── plugins/                # App initialization (see Plugin System below)
├── stores/                 # Pinia stores (account, user, products, breadcrumbs)
└── utils/
    ├── repositories/       # API repository factory functions (stateless fetch wrappers)
    └── *.ts                # Utility functions (errors, password-validation, tooltip)

shared/                     # Code shared between client and server
├── types/                  # All TypeScript interfaces (import via #shared/types)
└── utils/                  # Pure utilities: log.ts, deployment.ts, api-query.ts

server/                     # Nitro server
├── api/
│   ├── [...].ts            # Catch-all proxy → Geins Management API
│   └── auth/[...].ts       # NextAuth.js handler (CredentialsProvider)
└── utils/auth.ts           # Server-side token management

i18n/locales/               # en.json, sv.json
docs/                       # VitePress documentation site
test/                       # Vitest setup
```

## Data Flow

### API Communication

All API calls flow through a layered repository pattern:

```
Page/Component
  → useGeinsRepository()          # composable: injects $geinsApi into factories
    → repo.product($geinsApi)     # factory: returns typed CRUD methods
      → $geinsApi('/products')    # $fetch with auth headers + auto token refresh
        → /api/products           # Nitro catch-all proxy
          → GEINS_API_URL/products  # External Geins Management API
```

### Repository Factory Chain

Each layer adds capabilities. Domain repos compose these generics:

| Factory          | Methods                                         | Use Case                  |
| ---------------- | ----------------------------------------------- | ------------------------- |
| `entityGetRepo`  | `get(id)`                                       | Single entity read        |
| `entityListRepo` | `list(options?)`                                | List with field selection |
| `entityBaseRepo` | `get` + `list`                                  | Read-only entity access   |
| `entityRepo`     | `get` + `list` + `create` + `update` + `delete` | Full CRUD                 |

Domain repositories (`product.ts`, `customer.ts`, `order.ts`, `user.ts`, `global.ts`) extend these with domain-specific sub-repos and logic.

**Creating a new repository:**

```typescript
const customRepo = entityRepo<ResponseType, CreateType, UpdateType>(
  '/endpoint',
  $geinsApi,
);
```

**Using repositories in pages:**

```typescript
const { productApi, globalApi, customerApi } = useGeinsRepository();
const products = await productApi.list({ fields: ['id', 'name'] });
```

## Authentication

Multi-layered auth with cross-tab synchronization:

1. **Middleware** (`auth.global.ts`) — Route guard. Redirects unauthenticated users to `/auth/login?redirect={path}`.
2. **Server handler** (`server/api/auth/[...].ts`) — NextAuth.js with `CredentialsProvider`. JWT callback handles sign-in and token refresh server-side.
3. **Server utility** (`server/utils/auth.ts`) — Direct API calls to Geins auth endpoints (login, refresh, verify).
4. **Plugin** (`geins-api.ts`) — Creates `$geinsApi` fetch instance. `onRequest` interceptor auto-refreshes expiring tokens via WeakMap-cached promises (prevents duplicate concurrent refreshes).
5. **Composable** (`useGeinsAuth`) — Client-side auth state: `session`, `accessToken`, `isAuthenticated`, `login()`, `logout()`, `refresh()`.
6. **Plugin** (`auth-state.ts`) — Syncs auth state across browser tabs via `BroadcastChannel`.

## Plugin System

| Plugin                    | Purpose                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `geins-api.ts`            | Creates `$geinsApi` fetch instance with auth headers, token auto-refresh, 401 retry |
| `auth-state.ts`           | Cross-tab auth sync via `BroadcastChannel`, sets `geins-auth` cookie for skeleton   |
| `geins-global.ts`         | Initializes account & products stores on authenticated session                      |
| `error-handler.ts`        | Global Vue error handler — catches `AUTH_ERROR` and `API_ERROR`                     |
| `click-outside.client.ts` | Registers `v-click-outside` directive                                               |
| `click-outside.server.ts` | Server-side stub for SSR compatibility                                              |

## State Management (Pinia)

| Store         | Manages                                                                           | Key Methods                                             |
| ------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `account`     | Account details, channels, currencies, languages. Persists selections in cookies. | `init()`, `reset()`                                     |
| `products`    | Products list, categories, brands cache                                           | `fetchProducts()`, `fetchCategories()`, `fetchBrands()` |
| `user`        | Current user derived from session                                                 | Computed `userInitials`                                 |
| `breadcrumbs` | Navigation breadcrumbs with auto-derivation + manual override                     | `titleOverride`, `replaceLast`                          |

**Usage pattern:** Always use `storeToRefs` for reactive store properties:

```typescript
const accountStore = useAccountStore();
const { channels, currentCurrency } = storeToRefs(accountStore);
```

## Page Patterns

### List Pages

Pattern: `pages/{domain}/{entity}/list.vue`

```
definePageMeta({ pageType: 'list' })
  → useGeinsRepository()     — get API
  → useAsyncData()           — fetch data
  → useColumns<T>()          — define columns + addActionsColumn
  → useTable<T>()            — visibility state
  → useEntityUrl()           — entity URL generation
  → usePageError()           — error handling
```

`pageType: 'list'` triggers `overflow-hidden` in the default layout for proper table scrolling.

### Detail/Edit Pages

Pattern: `pages/{domain}/{entity}/[id].vue`

```
Zod schema → toTypedSchema()
  → useEntityEdit<TBase, TResponse, TCreate, TUpdate>({
      repository: { get, create, update, delete },
      validationSchema,
      initialEntityData,
      reshapeEntityData,       — API → form format
      prepareCreateData,       — form → create payload
      prepareUpdateData,       — form → update payload
      stepValidationMap,       — multi-step validation
    })
```

`useEntityEdit` provides: `form`, `entityData`, `createMode`, `createEntity()`, `updateEntity()`, `deleteEntity()`, `hasUnsavedChanges`, `confirmLeave`, `currentTab`, `showSidebar`.

The `route.params.id === 'new'` triggers create mode.

## Component Architecture

### shadcn-vue Components (`app/components/ui/`)

Installed via `npx shadcn-vue@latest add <component>`. Do not create manually. Config in `components.json` (style: `new-york`, baseColor: `stone`).

### Domain Components (`app/components/{domain}/`)

Organized by feature: `auth/`, `company/`, `price-list/`, `table/`, `form/`, `dialog/`, `feedback/`, `content/`, `layout/`, `sidebar/`, `selector/`, `button/`, `error/`.

### Form Pattern

vee-validate + Zod integration:

```vue
<FormField v-slot="{ componentField }" name="fieldName">
  <FormItem>
    <FormLabel>Label</FormLabel>
    <FormControl>
      <Input v-bind="componentField" />
    </FormControl>
    <FormMessage />
  </FormItem>
</FormField>
```

### Table Pattern

TanStack Table with composable helpers:

- `useColumns<T>()` — column definitions with typed `ColumnDef<T>[]`
- `addActionsColumn()` — appends standard action column
- `useTable<T>()` — visibility state via `getVisibilityState()`

## Styling

**Tailwind CSS 4** with CSS custom properties theming:

- Theme: `app/assets/css/main.css` — defines `:root` (light) and `.dark` HSL variables
- Color mode: `@nuxtjs/color-mode` — system preference with `geins-color-mode` storage key
- Design tokens: `--color-primary`, `--color-positive`, `--color-negative`, `--color-warning`, `--color-info`, sidebar colors
- Font: Suisse Intl (custom, loaded from `public/fonts/`)
- Viewport breakpoints: xs(320), sm(640), md(768), lg(1024), xl(1280), 2xl(1536)

## Logging

Use scoped loggers — **never use `console.log` directly** (enforced by ESLint):

```typescript
const { geinsLog, geinsLogError, geinsLogWarn } = useGeinsLog('component-name');
geinsLog('Debug message', data); // Only logs when GEINS_DEBUG=true
```

## i18n

- Languages: English (`en`) and Swedish (`sv`)
- Locale files: `i18n/locales/{lang}.json`
- Navigation labels: `t('navigation.pricing')` via `getNavigation(t)` in `app/lib/navigation.ts`
- Entity patterns: `t('entity_required', { entityName })`, `t('new_entity', { entityName })`

## Path Aliases

| Alias             | Maps To              |
| ----------------- | -------------------- |
| `#shared/types`   | `shared/types/`      |
| `#shared/utils`   | `shared/utils/`      |
| `@/components`    | `app/components/`    |
| `@/composables`   | `app/composables/`   |
| `@/utils`         | `app/utils/index`    |
| `@/components/ui` | `app/components/ui/` |

## Key Dependencies

| Package                 | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `@tanstack/vue-table`   | Data tables                                        |
| `vee-validate` + `zod`  | Form validation                                    |
| `reka-ui`               | Headless component primitives (used by shadcn-vue) |
| `@vueuse/core`          | Vue composition utilities                          |
| `pinia`                 | State management                                   |
| `@sidebase/nuxt-auth`   | Auth module (wraps NextAuth.js)                    |
| `@formkit/auto-animate` | Automatic animations                               |
| `nuxt-lucide-icons`     | Icon library                                       |
