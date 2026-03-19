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

## Golden Path

The primary flow through the system from start to finish:

1. **Entry** — User visits a protected route → `auth.global.ts` middleware checks session → redirects to `/auth/login` if unauthenticated → NextAuth.js `CredentialsProvider` verifies credentials → JWT issued → user lands on the dashboard.
2. **Core** — Dashboard → navigate to a domain (Customers / Orders / Pricing) → list page shows entities via `useAsyncData` → click an entity (or "New") → detail/edit page loads with `useEntityEdit`.
3. **Data flow** — Page calls `useGeinsRepository()` → composable injects `$geinsApi` into a repository factory → factory method calls `$geinsApi('/endpoint')` → Nitro catch-all proxy (`server/api/[...].ts`) adds the Bearer token and forwards to the Geins Management API → response returned to the page.
4. **Exit** — User edits the form and clicks Save → `updateEntity()` (or `createEntity()`) calls the repository → API responds → `parseAndSaveData` resets the form to the saved state → `hasUnsavedChanges` clears → unsaved-changes guard deactivates.

## Directory Structure

```
app/                        # Client-side SPA code
├── components/ui/          # shadcn-vue primitives (CLI-installed)
├── components/{domain}/    # Domain components (company/, price-list/, auth/, etc.)
├── composables/            # Stateful composition logic (useEntityEdit, useTable, etc.)
├── pages/                  # File-based routing
├── plugins/                # App initialization (geins-api, auth-state, etc.)
├── stores/                 # Pinia stores (account, user, products, breadcrumbs)
└── utils/repositories/     # API repository factory functions

shared/types/               # All TypeScript interfaces (import via #shared/types)
shared/utils/               # Pure utilities (log.ts, api-query.ts)
server/api/                 # Nitro proxy + NextAuth.js handler
i18n/locales/               # en.json, sv.json
```

## Business Domains

| Domain | Route prefix | Key entity | Domain doc |
| --- | --- | --- | --- |
| Products | — | Product, SKU, Category, Brand | [docs/domains/products.md](docs/domains/products.md) |
| Customers | `/customers/*` | Company, Buyer, Sales Rep | [docs/domains/customers.md](docs/domains/customers.md) |
| Orders | `/orders/*` | Quotation, Order | [docs/domains/orders.md](docs/domains/orders.md) |
| Pricing | `/pricing/*` | Price List, Price Rule | [docs/domains/pricing.md](docs/domains/pricing.md) |
| Account & Auth | `/auth/*`, `/account/*` | User, Session, Channel | [docs/domains/account-auth.md](docs/domains/account-auth.md) |

### Domain Dependency Graph

```
Account/Auth ◄── all domains (session, channels, currencies)
     │
Products ◄────── Pricing (price list product data)
     │  ◄──────── Orders (SKU selection for quotation items)
     │
Customers ◄───── Orders (company, buyer, addresses for quotations)
     │
     └──────────► Pricing (company price list assignments use ProductPriceList type)
```

Dependencies are acyclic. Account/Auth and Products are foundational (no domain deps). Orders is a leaf (depends on all others, nothing depends on it). See individual `docs/domains/*.md` files for detailed dependency notes.

## Key Dependencies

| Package | Purpose |
| --- | --- |
| `@tanstack/vue-table` | Data tables |
| `vee-validate` + `zod` | Form validation |
| `reka-ui` | Headless component primitives (used by shadcn-vue) |
| `pinia` | State management |
| `@sidebase/nuxt-auth` | Auth module (wraps NextAuth.js) |

## Further Reading

- **App composition & routing**: [APP.md](APP.md)
- **Coding conventions & patterns**: [CLAUDE.md](CLAUDE.md)
- **Contributing guide**: [CONTRIBUTING.md](CONTRIBUTING.md)

## Decision Log

**2024-05-24: Nuxt 4 + Vue 3 as application framework**
Nuxt provides file-based routing, auto-imports, and a Nitro server — eliminating boilerplate for an admin SPA. Vue 3 Composition API aligns with the composable-first architecture.

**2024-05-24: shadcn-vue for UI components**
Provides accessible, customizable primitives without the lock-in of a traditional component library. Components are copied into the project (`app/components/ui/`) and owned by the team.

**2024-05-24: Client-side SPA with Nitro proxy (no SSR)**
An admin interface has no SEO requirements. Running as `ssr: false` simplifies auth, avoids hydration mismatches, and lets the Nitro server focus on proxying API calls with auth headers.

**2024-06-10: Pinia for state management**
Official Vue 3 state management with first-class TypeScript support and devtools integration.

**2024-06-17: TanStack Table for data tables**
Headless table logic that integrates with Vue 3 reactivity. Pairs well with shadcn-vue table primitives.

**2024-07-02: NextAuth.js (via @sidebase/nuxt-auth) for authentication**
JWT-based auth with credential providers, token refresh, and session management. Server-side handler keeps secrets off the client.

**2024-07-02: VeeValidate + Zod for form validation**
Zod schemas define validation rules in TypeScript; VeeValidate bridges them to Vue form components via `toTypedSchema()`.

**2026-03-19: Trimmed to ~1 page overview**
Detailed sections (auth flow, plugins, state management, page patterns, component architecture, styling, logging, i18n, path aliases) relocated to APP.md, CLAUDE.md, and domain docs. ARCHITECTURE.md now serves the 10,000ft altitude only.
