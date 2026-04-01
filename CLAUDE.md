<!-- CLAUDE.md: conventions + pointers. Skills: .agents/skills/. Update here first, then skills. -->

## Skills Index

Skills live in `.agents/skills/{name}/SKILL.md` and are auto-discovered by the agent.

- Dev loop: `geins-dev-loop` | CI preflight: `geins-ci-preflight`
- Add entity: `geins-add-entity` | Entity edit page: `geins-entity-edit-page`
- i18n: `geins-i18n-update` | API repos: `geins-api-repository`
- UI components: `geins-ui-components` | Tables: `geins-table-patterns` | List pages: `geins-list-page`
- Linear issues: `linear` | Implementation plan: `implementation-plan`
- Learning loop: `geins-learning-loop`
- Sync domain docs: `sync-domain` | Verify docs: `verify-docs`

## Token Efficiency Rules

- Prefer referencing docs/code paths over repeating content. Read narrowly — only the files/sections needed.
- Keep outputs diff-shaped: intended changes + file paths. Batch related edits together.
- Ask clarifying questions before large reads or broad changes. Ask before pulling broad context.

## Hard Blocks — What Must NEVER Happen

- NEVER add `_id: string` or `_type: string` directly to any interface — use `ResponseEntity<Base>` or extend `EntityBase`. Applies to all response types including sub-entities and auxiliary types
- NEVER `console.log` — use `useGeinsLog('scope')` | NEVER create shadcn-vue manually — use CLI
- NEVER import auto-imported composables/utils/components | NEVER custom unsaved-changes tracking
- NEVER inline template literals for names — use `fullName()` | NEVER cast `entityDataUpdate` to response type
- NEVER use `as unknown as` type casts — reshape data to fit the target type instead (e.g. `.map(x => x._id)` to get `string[]`)
- NEVER spread `entityDataUpdate` in `prepareUpdateData` | NEVER modify `ui/table/` primitives for modes
- NEVER omit `<DialogUnsavedChanges>` from entity edit page templates — without it the route guard silently blocks all navigation with no user feedback (stuck page, no error, no dialog)
- NEVER watch `quotationItems` for preview (infinite loop) | NEVER `git push --force` to `main`/`next`
- NEVER commit `.env`, credentials, or secret files
- NEVER use `FormData`/`multipart/form-data` for entity PATCH unless the backend endpoint explicitly requires it and you have verified this with a working network trace. Default to plain JSON (`body: data`). Premature multipart (e.g. "in case we need file uploads later") will break updates silently. File upload support requires a separate dedicated method confirmed against the actual API.

## Workflow Rules

These MUST be followed for every task.

**Before writing code**: (1) Set Linear issue to "In Progress". (2) Ask about branching — `feat/{issue}-{desc}` or `fix/{issue}-{desc}` from `next`. (3) Verify issue has enough codebase-specific guidance. (4) Read issue body against this file + matching skill. (5) Check the Linear project plan and issue for Figma links — if a design exists, fetch it with `get_design_context` and match the layout (field grouping, grid design, card structure) before coding. (6) Run `implementation-plan` skill before coding.

**While writing code**: (7) Follow all patterns in this file. If breaking a pattern, document why. (8) Consider performance implications.

**Before committing**: (9) Run `pnpm lint:check && pnpm typecheck` (and `pnpm test --run` if tests exist). All must pass.

**When user says "task done"**: (10) Update `/docs` if architectural changes. (11) Update CLAUDE.md with new learnings. (12) Organize CLAUDE.md (dedup, group, format).

---

# Geins Studio

Admin interface for Geins Commerce Backend. **Client-side SPA** (`ssr: false`) that communicates with Geins Management API through a Nitro server proxy.

## Stack

- **Framework**: Nuxt 4 + Vue 3 (Composition API, `<script setup>`)
- **Language**: TypeScript
- **Forms**: VeeValidate + Zod schemas (`toTypedSchema`)
- **Styling**: Tailwind CSS 4 with CSS custom properties theming
- **UI Components**: shadcn-vue (`app/components/ui/`) — install via `npx shadcn-vue@latest add`, never create manually
- **Icons**: Lucide (auto-imported via `nuxt-lucide-icons`). Dynamic name→component resolution: `useLucideIcon()` (uses `@lucide/vue` v1). Never use `resolveComponent('Lucide...')` — tree-shaking removes unresolved icons.
- **i18n**: `@nuxtjs/i18n` — always update both `en.json` and `sv.json`. Entity action keys: `save_entity`, `delete_entity`, `send_entity`, etc. use `@.lower:{entityName}` interpolation.
- **State**: Pinia stores in `app/stores/`
- **Tables**: TanStack Table (`@tanstack/vue-table`)

## Commands

```bash
pnpm dev              # Dev server at localhost:3000
pnpm lint             # ESLint with auto-fix
pnpm lint:check       # ESLint read-only (CI-safe)
pnpm typecheck        # Nuxi typecheck
pnpm test --run       # Vitest single run (CI-safe)
```

## Project Structure

```
app/
├── pages/              # File-based routing
├── components/
│   ├── ui/             # shadcn-vue primitives (CLI-installed)
│   └── {domain}/       # Domain components (company/, price-list/, table/, etc.)
├── composables/        # Auto-imported composables (use*.ts)
├── stores/             # Pinia stores (account, user, products, breadcrumbs)
├── plugins/            # App initialization (geins-api, auth-state, etc.)
├── utils/repositories/ # API repository factories (stateless fetch wrappers)
└── lib/                # Pure logic (navigation.ts)

shared/types/           # All TypeScript interfaces (import via #shared/types)
shared/utils/           # Shared utilities (log.ts, deployment.ts, api-query.ts)
server/api/             # Nitro proxy + NextAuth.js handler
i18n/locales/           # en.json, sv.json
```

## Path Aliases

| Alias           | Maps To            |
| --------------- | ------------------ |
| `#shared/types` | `shared/types/`    |
| `#shared/utils` | `shared/utils/`    |
| `@/components`  | `app/components/`  |
| `@/composables` | `app/composables/` |
| `@/utils`       | `app/utils/index`  |

## Code Conventions

- **Logging**: `useGeinsLog('scope')` — never `console.log` (ESLint enforces)
- **Composables**: File `use{Name}.ts`, export named function, return type ending in `ReturnType`
- **Props**: `defineProps<{}>()` with `withDefaults()` | **Stores**: `storeToRefs(store)` for reactive state
- **Imports**: Nuxt auto-imports composables/utils/components. Types: `import type { X } from '#shared/types'`
- **Forms**: `<FormField v-slot="{ componentField }">` pattern. `useEntityEdit` handles unsaved-changes. Disabled/read-only fields should still use `FormField`/`FormItem`/`FormLabel`/`FormControl` for visual consistency — omit `v-slot="{ componentField }"` and bind `:model-value` directly on the input.
- **Sidebar summary entity ID**: Always use `entityId.value` (from `useEntityEdit`) for the summary ID row, not `entityDataUpdate.value?._id` which can be `undefined` before data loads.
- **Entity URLs**: Use `useEntityUrl()` — `getEntityUrl(id)` for current context, `getEntityUrlFor(entityName, parentPath, id)` for any entity. Prefer over hardcoded routes.
- **Full name display**: Use `fullName(entity)` (auto-imported). Never use inline template literals.
- **Date formatting**: Use `useDate()` → `formatDate(value, options?)`. Defaults to `dateStyle: 'long'`.
- **Loading state resilience**: In list pages, `loading.value = false` must be reached in ALL code paths (error, empty, success). Either place it at the end of `onMounted` outside the watcher (reference pattern), or ensure every early `return` in the watcher also clears loading. Never let an unhandled throw leave the page stuck on skeletons.
- **Vue gotchas**: `<KeepAlive>` expects exactly one child — wrap each tab in its own `<KeepAlive>` with a single `v-if` child (never use `v-else-if` chains inside one `<KeepAlive>`). `<KeepAlive>` cannot contain HTML comments. `v-auto-animate` on icon-swapping `v-if/v-else` causes layout shift — use CSS transitions instead.
- **Page titles**: `usePageTitle()` auto-derives from breadcrumbs. Entity pages get names via `setCurrentTitle`.
- **Navigation items**: Workspace-group items MUST have a `children` array — without it, the sidebar renders a flat button instead of the collapsible parent/child style. Parent and child labels must be distinct (domain ≠ entity, e.g. "Orchestrator" > "Workflows") or breadcrumbs/page title will duplicate. Icon strings are resolved dynamically by `useLucideIcon()` (any PascalCase Lucide icon name works — no manual import map needed). Use `import.meta.dev` to gate dev-only nav items (Vite tree-shakes at build time).
- **Toasts**: `useToast` from `@/components/ui/toast/use-toast` (explicit import). `useEntityEdit` handles CRUD toasts — only add toasts for extra actions (status transitions, copy, etc.).

## API & Repositories

All API calls flow through typed repository factories → `$geinsApi` → Nitro proxy → Geins Management API.

Access via `useGeinsRepository()`: `orderApi.quotation`, `customerApi.company`, `productApi`, `globalApi`.

Factory chain: `entityGetRepo` → `entityListRepo` → `entityBaseRepo` → `entityRepo` (full CRUD). Nitro proxy (`server/api/[...].ts`) is a transparent passthrough — adds auth headers, no response transformation.

### Repository rules

- Use `repo.entity`/`entityRepo` for standard CRUD, `repo.entityBase` for get+list. Don't reimplement what factories provide.
- `PATCH` for updates. Never `PUT` unless endpoint requires it.
- Always pass options through `buildQueryObject(options)`.
- Thin `fetch` wrappers only for non-standard actions. Let errors propagate.
- **Normalize API list responses at the consumer**: Repository return types are aspirational — the Geins Management API may wrap arrays in envelopes (`{ items: [...] }`). Always guard with `Array.isArray()` or a normalizer before calling `.map()` on API data, especially in list pages.

### Type conventions

- Define `{Entity}Base` → `{Entity}Create` (via `CreateEntity`) → `{Entity}Update` (via `UpdateEntity`) → `{Entity}` response (via `ResponseEntity`).
- Response types use the plain entity name (e.g. `Quotation`, not `QuotationResponse`).
- Export every type file from `shared/types/index.ts`.

---

## Further Reading

- **Page patterns, components, tables**: [APP.md](APP.md)
- **Architecture & golden path**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Domain docs**: [orders](docs/domains/orders.md) | [customers](docs/domains/customers.md) | [products](docs/domains/products.md) | [pricing](docs/domains/pricing.md) | [account-auth](docs/domains/account-auth.md)

## Decision Log

**2025-01-15: Skills-based agent architecture**
Agent skills live in `.agents/skills/` as self-contained runbooks. CLAUDE.md is the source of truth for conventions; skills reference it for task-specific workflows.

**2025-02-01: `useEntityEdit` as universal entity page composable**
Every entity detail/edit page uses the same composable. Prevents divergence in unsaved-changes tracking, CRUD flows, and navigation patterns across domains.

**2025-02-25: Nested documentation hierarchy (ARCHITECTURE.md → APP.md → DOMAIN.md)**
Clara Philosophy: each altitude is self-contained. Architecture for the 10,000ft view, APP.md for composition/routing, DOMAIN.md for business rules, CLAUDE.md as the AI entry point.
