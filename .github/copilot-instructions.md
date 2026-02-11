# Geins Studio AI Coding Agent Instructions

## Project Overview

Geins Studio is an admin interface for Geins Commerce Backend built with Nuxt 3, TypeScript, and shadcn-vue. It's an SPA (`ssr: false`) that integrates with Geins Management API for e-commerce operations (products, orders, customers, pricing).

## Architecture & Data Flow

### Repository Pattern for API Communication

**Core concept**: All API interactions go through typed repository factories in `app/utils/repositories/`:

```typescript
// Use pre-configured repositories via composable
const { productApi, globalApi, customerApi } = useGeinsRepository();
const product = await productApi.get(id);
const products = await productApi.list({ fields: ['id', 'name'] });
```

**Repository layers** (from base to specialized):

1. `entityGetRepo` - single entity retrieval
2. `entityListRepo` - list operations
3. `entityBaseRepo` - combines get + list (read-only)
4. `entityRepo` - adds create/update/delete (full CRUD)
5. Domain-specific repos (`product.ts`, `customer.ts`, `order.ts`) - extend with domain logic

**Creating repositories**: Pass `$geinsApi` (authenticated fetch instance) to factory functions:

```typescript
const customRepo = entityRepo<ResponseType, CreateType, UpdateType>(
  '/endpoint',
  $geinsApi,
);
```

**API query options**: Use `ApiOptions<TFields>` for field selection:

```typescript
{
  fields: ['id', 'name', 'price'];
} // Typed field selection
```

### Authentication Flow

**Multi-layered auth system** using `@sidebase/nuxt-auth` + custom Geins integration:

1. **Plugin layer** (`app/plugins/geins-api.ts`): Custom `$geinsApi` fetch instance that:
   - Intercepts requests to check token expiration with `isExpired()` / `expiresSoon()`
   - Auto-refreshes tokens using WeakMap-based promise caching (prevents duplicate refreshes)
   - Retries 401s with fresh token

2. **Composable layer** (`useGeinsAuth`): Session management, token parsing (jwt-decode), login/logout
3. **Middleware** (`auth.global.ts`): Route protection, redirects to `/auth/login` with `?redirect=` param
4. **Server handler** (`server/api/auth/[...].ts`): NextAuth.js integration with Geins API

**BroadcastChannel**: Auth state synced across tabs via `useBroadcastChannel<AuthBroadcastData>` in `auth-state.ts` plugin.

### Entity Edit Pattern (`useEntityEdit`)

**Centralized CRUD workflow** for all entity edit pages. This composable handles:

- Dual-mode operation (create vs. edit) with `createMode` ref
- Form state with vee-validate + Zod schemas
- Unsaved changes tracking (compares current vs. saved state)
- Step-based validation (`stepValidationMap: Record<number, string>`)
- Auto-save preparation with `prepareCreateData` / `prepareUpdateData` transformers
- Entity data reshaping via `reshapeEntityData` (API → form format)

**Usage pattern** (see `app/pages/pricing/price-list/[id].vue`):

```typescript
const {
  entityData,
  form,
  createEntity,
  updateEntity,
  hasUnsavedChanges
} = useEntityEdit<Base, Response, Create, Update>({
  repository: { get, create, update, delete },
  validationSchema: toTypedSchema(zodSchema),
  initialEntityData: createTemplate,
  initialUpdateData: updateTemplate,
  reshapeEntityData: (entity) => transformToFormShape(entity),
  stepValidationMap: { 1: 'step1Fields', 2: 'step2Fields' }
});
```

## Component Patterns

### shadcn-vue Components

**UI components** live in `app/components/ui/` (installed via shadcn-nuxt CLI). Key patterns:

- **Form components**: Use `FormField` with `componentField` slot pattern (vee-validate integration)
- **Table components**: TanStack Table-based data tables with `useTable` composable
- **No default props rule**: ESLint disables `vue/require-default-prop` - use TypeScript interfaces instead

**Component organization**:

```
app/components/
  ui/          # shadcn-vue components (Button, Form, Table, etc.)
  content/     # Display components (Heading, AddressDisplay, etc.)
  auth/        # Auth-related components
  customer/    # Customer domain components
  price-list/  # Price list domain components
  table/       # Table utilities (filters, headers, etc.)
```

### Props Pattern

Use TypeScript-first approach with `defineProps` + `withDefaults`:

```vue
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
  }>(),
  {
    placeholder: 'Enter value',
  },
);
</script>
```

## Composables Conventions

### Naming & Structure

**All composables** return typed interfaces ending in `ReturnType`:

```typescript
interface UseGeinsRepositoryReturnType {
  globalApi: ReturnType<typeof repo.global>;
  productApi: ReturnType<typeof repo.product>;
}

export function useGeinsRepository(): UseGeinsRepositoryReturnType {
  // implementation
}
```

### Key Domain Composables

- `useGeinsRepository` - Pre-configured API repositories
- `useGeinsApi` - Lower-level fetch wrappers (`useGeinsFetch`, `geinsFetch`)
- `useGeinsAuth` - Authentication state and operations
- `useEntityEdit` - CRUD workflow orchestration
- `useTable` - Data table state management
- `useUnsavedChanges` - Change detection (used by `useEntityEdit`)
- `useBatchQuery` - Parallel API request batching
- `useGeinsLog` - Scoped logging (respects `GEINS_DEBUG` env var)

### Logging Pattern

Use scoped loggers instead of `console.log`:

```typescript
const { geinsLog, geinsLogError, geinsLogWarn } = useGeinsLog('component-name');
geinsLog('Debug message', data); // Only logs when GEINS_DEBUG=true
```

## State Management (Pinia)

**Stores** in `app/stores/`:

- `account.ts` - Current account context (channels, currencies, market settings)
- `user.ts` - Current user session
- `products.ts` - Product cache for cross-page usage
- `breadcrumbs.ts` - Dynamic breadcrumb navigation

**Pattern**: Use `storeToRefs` for reactive store properties:

```typescript
const accountStore = useAccountStore();
const { channels, currentCurrency } = storeToRefs(accountStore);
```

## Environment & Configuration

### Required Environment Variables

```bash
GEINS_API_URL=https://mgmtapi.geins.services/v2  # Geins Management API endpoint
AUTH_SECRET=<random-secret>                       # NextAuth.js secret (generate at auth-secret-generator.vercel.app)
GEINS_DEBUG=true                                  # Enable useGeinsLog output
```

### Deployment-Aware Configuration

`shared/utils/deployment.ts` provides environment-aware URL builders:

- `getBaseUrl()` - Detects Vercel preview/production, falls back to localhost
- `getAuthBaseUrl()` - Combines base URL with auth path

Used in `nuxt.config.ts` for `auth.baseURL` configuration.

## Development Workflows

### Running the Project

```bash
yarn install           # Install dependencies (uses Yarn 1.22.22)
yarn dev              # Start dev server at localhost:3000
yarn lint             # ESLint with auto-fix
yarn test             # Run Vitest tests
yarn docs:dev          # Start VitePress docs on localhost
```

### Project Commands

- `yarn build` - Production build (Nuxt)
- `yarn preview` - Preview production build
- `yarn changelog:release` - Bump version and create release
- `yarn docs:build` - Build VitePress documentation

### Testing

- **Framework**: Vitest with `@nuxt/test-utils`
- **Config**: `vitest.config.ts` at root
- **Setup**: `test/vitest.setup.ts`

## Styling & Theming

**Tailwind CSS 4.x** with shadcn-vue theming system:

- **Theme config**: `app/assets/css/main.css` (CSS variables approach)
- **shadcn config**: `components.json` (style: "new-york", baseColor: "stone")
- **Prefix**: No prefix (empty string in config)
- **Icons**: Lucide via `nuxt-lucide-icons`

**Custom ESLint rule**: `tailwindcss/no-custom-classname: off` (allows non-Tailwind classes)

## Type System

### Shared Types

**All types** defined in `shared/types/`:

- Domain types: `Product.ts`, `Customer.ts`, `Order.ts`, `Account.ts`
- Generic types: `Entity.ts`, `Api.ts`, `Table.ts`, `Selector.ts`
- `index.ts` - Barrel export for all types

**Import pattern**: Use `#shared/types` alias:

```typescript
import type { ProductPriceList, ApiOptions } from '#shared/types';
```

### Generic Entity Types

Entity operations use three generic types:

```typescript
TResponse extends ResponseEntity<TBase>  // API response shape
TCreate extends CreateEntity<TBase>      // Creation payload
TUpdate extends UpdateEntity<TBase>      // Update payload
```

## Path Aliases

Configured in `components.json` (used by shadcn-nuxt):

```json
{
  "aliases": {
    "components": "@/components",
    "composables": "@/composables",
    "utils": "@/utils/index",
    "ui": "@/components/ui"
  }
}
```

**Special Nuxt aliases**:

- `#shared/types` - `shared/types/`
- `#shared/utils` - `shared/utils/`

## Nuxt Configuration Highlights

- **SPA mode**: `ssr: false` (client-only rendering)
- **Loading template**: `spaLoadingTemplate: 'app-skeleton.html'`
- **i18n**: English (en) + Swedish (sv) with `@nuxtjs/i18n`
- **Auto-imports**: Nuxt auto-imports from `composables/`, `utils/`, `components/`
- **Viewport**: Custom breakpoints via `nuxt-viewport` module
- **Devtools**: Enabled in development

## Key Third-Party Integrations

- **TanStack Table** (`@tanstack/vue-table`) - Data tables
- **vee-validate + Zod** - Form validation
- **Reka UI** - Headless component primitives (used by shadcn-vue)
- **VueUse** (`@vueuse/core`) - Vue composition utilities (e.g., `useDebounceFn`, `useBroadcastChannel`)
- **Pinia** - State management
- **auto-animate** (`@formkit/auto-animate`) - Automatic animations

## Common Pitfalls

1. **Auth token refresh**: Never create multiple refresh promises - `geins-api.ts` plugin uses WeakMap to deduplicate
2. **Repository injection**: Always pass `$geinsApi` to repository factories (not raw `$fetch`)
3. **Field selection**: Use typed `ApiOptions<TFields>` for field selection, not string literals
4. **Form validation**: Use `toTypedSchema(zodSchema)` to convert Zod schemas for vee-validate
5. **Unsaved changes**: `useEntityEdit` handles this - don't implement custom change tracking
6. **Logging**: Use `useGeinsLog` scoped loggers, not `console.log` (respects debug flag)
7. **shadcn components**: Install via `npx shadcn-vue@latest add <component>`, don't create manually

## Documentation

**VitePress docs** in `docs/`:

- `concepts/` - Architecture patterns (API repositories, etc.)
- `composables/` - Composable API documentation
- `guides/` - Feature guides (data tables, forms, etc.)
- `introduction/` - Getting started, deployment

Run `yarn docs` to view at `localhost:3010`.
