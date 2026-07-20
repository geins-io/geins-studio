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
- NEVER wrap a `<Button>` (or other interactive element) inside `<NuxtLink>`/`<a>` — renders invalid `<a><button>`. Use `<Button as-child><NuxtLink …>…</NuxtLink></Button>` (single `<a>` with button styling). For icon-only link buttons use a `Tooltip` (`TooltipProvider :delay-duration="100"` → `Tooltip`/`TooltipTrigger as-child`/`TooltipContent`), never the `title` attr. Ref: [orchestrator/index.vue](app/pages/orchestrator/index.vue) card actions
- NEVER hardcode user-facing text in templates/components/scripts (incl. `title=`/`placeholder=`/toast strings) — every label, button, heading, placeholder, tooltip, toast, dialog, and message MUST be an i18n key resolved via `$t`/`t` and added to BOTH `en.json` and `sv.json`. Only dynamic API/data values render raw. Reuse existing keys (e.g. `$t('workflow', 2)`) before adding new ones — see [feedback_i18n_no_duplicate_keys]
- NEVER use Title Case for UI copy — write **sentence case**: capitalize only the first word and proper nouns. Applies to every i18n value AND any inline UI string: labels, buttons, headings, menu/nav items, placeholders, tooltips, empty states, toasts. e.g. `Total workflows` not `Total Workflows`; `Integration kits` not `Integration Kits`; `New workflow` not `New Workflow`. Pluralized entity keys keep their case (`Workflow | Workflows`)
- NEVER pass an already-translated string as `entityKey` to an entity-action key. Entity keys (`add_entity`, `no_entity`, `select_entity`, `no_entity_found`, `all_entity`, …) interpolate via `@.lower:{entityKey}`, so `entityKey` MUST be the raw key name and the **pluralizer goes last**: `t('no_entity', { entityKey: 'input' }, 2)` → "No inputs", `t('add_entity', { entityKey: 'group' })` → "Add group". NEVER `t('no_entity', { entityKey: t('input', 2) })` — the link can't resolve a pre-translated value and it double-translates. The outer count drives the linked plural form (verified: `…,2` → "Inputs"), so omit the count for singular. **Prefer these entity-based keys over bespoke per-entity strings** to keep the locale files small — reuse `add_entity`/`no_entity`/etc. before adding a new key
- NEVER `git push --force` to `main`/`next`
- NEVER commit `.env`, credentials, or secret files

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
- **i18n**: `@nuxtjs/i18n` — always update both `en.json` and `sv.json`. No hardcoded UI strings; **sentence case** for all values (see Hard Blocks). Entity action keys: `save_entity`, `delete_entity`, `send_entity`, etc. use `@.lower:{entityKey}` interpolation.
- **State**: Pinia stores in `app/stores/`
- **Tables**: TanStack Table (`@tanstack/vue-table`)

## Commands

```bash
pnpm dev              # Dev server at localhost:3000
pnpm build:profile    # Build with Nuxt profile output for perf analysis
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
- **Comments**: Comment only the non-obvious **why** — gotchas, external/runtime behavior not visible in the file (e.g. framework internals in `node_modules`), workarounds, race conditions. NEVER narrate the **what** of self-evident code (`// clone the query`, `// wait for next tick`). NEVER put issue references in comments (`STU-xxx`, ticket links) — git blame/PR history covers traceability; they bloat and rot. Keep to ~2 lines unless a gotcha genuinely needs more. Match this over the surrounding density if the existing code is more verbose.
- **Composables**: File `use{Name}.ts`, export named function, return type ending in `ReturnType`
- **Props**: `defineProps<{}>()` with `withDefaults()` | **Stores**: `storeToRefs(store)` for reactive state
- **Imports**: Nuxt auto-imports composables/utils/components. Types: `import type { X } from '#shared/types'`
- **Forms**: `<FormField v-slot="{ componentField }">` pattern. `useEntityEdit` handles unsaved-changes. Disabled/read-only fields should still use `FormField`/`FormItem`/`FormLabel`/`FormControl` for visual consistency — omit `v-slot="{ componentField }"` and bind `:model-value` directly on the input.
- **Data fetching**: Page/entity reads use `useAsyncData(key, () => repo.x())` with explicit stable keys. Mutations stay imperative (`await repo.update(...)`) and must invalidate related reads via `refresh()` / `refreshNuxtData(key)`. Put shared reference data in Pinia stores. Avoid raw `useFetch(url)` where a repository exists, and never wrap mutations in `useAsyncData`.
- **404 & fetch errors (entity pages)**: EVERY entity detail/edit page MUST route its `useAsyncData` result through `usePageError().handleFetchResult(error.value, data.value)` in `onMounted` — this throws a fatal Nuxt error via `createError()` so a missing/invalid ID renders the standard 404 error boundary. NEVER silently render with `null` data and NEVER hand-roll an inline error `<div>`. Handle 404s and fetch errors the SAME way across all entity pages. Refs: [usePageError.ts](app/composables/usePageError.ts), [pricing/price-lists/[id].vue](app/pages/pricing/price-lists/[id].vue), [orders/quotations/[id].vue](app/pages/orders/quotations/[id].vue).
- **Sidebar summary entity ID**: Always use `entityId.value` (from `useEntityEdit`) for the summary ID row, not `entityDataUpdate.value?._id` which can be `undefined` before data loads.
- **Entity URLs**: Build from the registry helpers in `#shared/utils/entities` — `entityListUrl(key)` (the collection index), `entityNewUrl(key)`, `entityEditUrl(key, id)`, `entityChildPattern(key)` (nav). Pure functions off `ENTITIES[key].route`; NEVER hardcode `/domain/entity/...`. The create segment is the single `NEW_ENTITY_URL_SEGMENT` constant (white-label knob — set `'add'`/`'create'` in one place). `useEntityEdit` exposes `newEntityUrl`/`entityListUrl` for the current entity (derived from its entry), so pages need the helpers mainly on list/index pages + cross-entity links. (There is no `useEntityUrl` composable — removed.)
- **Entity identity**: `useEntityEdit`/`usePageError` take the registry entry `entity: ENTITIES.x` (`#shared/utils/entities`) — the single source; they derive the i18n key (`entityKey`) from `entity.key`. NEVER pass a bare string. For display, use the `entityKey` string returned by `useEntityEdit` (or `ENTITIES.x.key`); for label-only interpolation use raw key literals. Ref: [docs/concepts/entities.md](docs/concepts/entities.md).
- **Full name display**: Use `fullName(entity)` (auto-imported). Never use inline template literals.
- **Date formatting**: Use `useDate()` → `formatDate(value, options?)` for locale-aware dates. Defaults to `dateStyle: 'long'`. For fixed-format log timestamps and compact durations (execution/console UIs), use `formatTimestamp` / `formatDuration` from `#shared/utils/time`.
- **Live clocks & polling**: Use `useLiveClock(active)` for ticking `now` refs and `usePollWhile(active, fn, ms)` for interval polling — never hand-roll `setInterval` in pages. Orchestrator status icons come from `useExecutionStatus()`. See APP.md "Live & Async Primitives".
- **Loading state resilience**: In list pages, `loading.value = false` must be reached in ALL code paths (error, empty, success). Either place it at the end of `onMounted` outside the watcher (reference pattern), or ensure every early `return` in the watcher also clears loading. Never let an unhandled throw leave the page stuck on skeletons.
- **Empty & error states**: Use the `<Empty>` primitive (`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription`/`EmptyContent`) — NEVER hand-roll `Card`+`div` with manual centering. Error states use `EmptyMedia variant="destructive"` + `<ButtonIcon icon="retry" variant="secondary">` in `EmptyContent`; empty states use `EmptyMedia variant="icon"`. `TableView` renders these internally — on non-table list pages (e.g. card-grid pages) supply them yourself and wrap each in `<Card><CardContent class="p-0">` (the `Empty` primitive provides its own padding, so `p-0` avoids double-pad). Ref: [orchestrator/index.vue](app/pages/orchestrator/index.vue), [settings/orchestrator/kits/index.vue](app/pages/settings/orchestrator/kits/index.vue).
- **Vue gotchas**: `<KeepAlive>` expects exactly one child — wrap each tab in its own `<KeepAlive>` with a single `v-if` child (never use `v-else-if` chains inside one `<KeepAlive>`). `<KeepAlive>` cannot contain HTML comments. `v-auto-animate` on icon-swapping `v-if/v-else` causes layout shift — use CSS transitions instead. **VeeValidate `<FormField>` clears its value on unmount** — any path that unmounts a `<FormField>` (Reka UI `TabsContent` tab swap, `v-if` on a conditional/optional field) wipes that field on the form, which can immediately overwrite a value just set by `setFieldValue` and cascade into dependent fields. Symptom: a `:disabled`/value watcher fires correct-then-wrong on the same tick (e.g. `false → true` after a successful write). Fix: keep the field mounted via `force-mount class="data-[state=inactive]:hidden"` (for `TabsContent`) or `keep-value` on the `<FormField>` (for `v-if`).
- **Page titles**: `usePageTitle()` auto-derives from breadcrumbs. Entity pages get names via `setCurrentTitle`.
- **Navigation items**: Workspace-group items MUST have a `children` array — without it, the sidebar renders a flat button instead of the collapsible parent/child style. Parent and child labels must be distinct (domain ≠ entity, e.g. "Orchestrator" > "Workflows") or breadcrumbs/page title will duplicate. Icon strings are resolved dynamically by `useLucideIcon()` (any PascalCase Lucide icon name works — no manual import map needed). Use `import.meta.dev` to gate dev-only nav items (Vite tree-shakes at build time). For entity items, build `href`/`childPattern` from the registry via `entityListUrl(key)` / `entityChildPattern(key)` / `entityBasePath(key)` (`#shared/utils/entities`) — NEVER hardcode an entity path that already lives in `ENTITIES[key].route`.
- **Toasts**: `useToast` from `@/components/ui/toast/use-toast` (explicit import). `useEntityEdit` handles CRUD toasts — only add toasts for extra actions (status transitions, copy, etc.).
- **API error toasts**: ONE global owner — `$geinsApi`'s `onRequestError`/`onResponseError` ([geins-api.ts](app/plugins/geins-api.ts)) fire `showGlobalErrorToast` ([useApiErrorToast.ts](app/composables/useApiErrorToast.ts)) once per failed mutation (non-`GET`/`HEAD`, excluding `401`). It surfaces the backend `data.title` + `data.detail` (joined via `composeErrorMessage`) and, when a call passes `errorContext`, a specific `error_{action}_entity` title. NEVER hand-roll a per-call/per-page API-error `catch` toast — let it flow to the global one; attach `errorContext: { action, entity: ENTITIES.x.key }` for a specific title (entity repos do this automatically for create/update/delete). To silence a call (failure shown better inline, or a background fetch), pass `suppressErrorToast: true` in the fetch options — request-scoped, forwarded by every entity factory method (`get`/`list`/`create`/`update`/`delete`) via `RepoFetchOptions`. Reads (GET) and HTTP-200 partial-success responses never auto-toast — handle those in the page. (There is no `withSuppressedErrorToast` wrapper — removed; use the flag.)
- **Scratch dirs & dev watcher**: `.temp/`, `.agents/`, `.mint/` are scratch/notes areas that may contain cloned repos with their own `node_modules`. They are gitignored, but Vite/Nitro do not read `.gitignore`. Any new scratch dir at the repo root MUST be added to `nuxt.config.ts` → `ignore`, `vite.server.watch.ignored`, and `nitro.watchOptions.ignored`. Otherwise `pnpm dev` will throw `EMFILE: too many open files, watch` from `FSWatcher` even with raised `ulimit -n`.

## API & Repositories

All API calls flow through typed repository factories → `$geinsApi` → Nitro proxy → Geins Management API.

Access via `useGeinsRepository()`: `orderApi.quotation`, `customerApi.company`, `productApi`, `accountApi`.

Factory chain: `entityGetRepo` → `entityListRepo` → `entityBaseRepo` → `entityRepo` (full CRUD). Nitro proxy (`server/api/[...].ts`) is a transparent passthrough — adds auth headers, no response transformation.

### Repository rules

- **Entity registry is the single source of truth.** Every _domain_ entity (endpoint + repo + route) is declared once in `shared/utils/entities.ts` → `ENTITIES` (the key IS the i18n key; descriptor holds `endpoint` + optional `route`). `EntityKey` is derived from it. Each entry is self-describing — `defineEntities` stamps it with its own `key`, so passing `ENTITIES.x` carries endpoint + route + key. `repo.entity` takes an entity target (`{ endpoint, key? }`), which a registry entry satisfies directly: domain repos do `repo.entity(ENTITIES.key, fetch)` — NEVER re-declare an endpoint literal that already lives in the registry. For a scoped/non-registry endpoint (e.g. company-scoped `buyer`), pass an inline `repo.entity({ endpoint, key: 'buyer' }, fetch)`. Label-only entity-name keys (`name`, `currency`, …) are NOT domain entities — they stay as plain i18n keys (raw string literals at the call site), not the registry; the `entities.test.ts` en↔sv key-parity check guards them. Ref: [docs/concepts/entities.md](docs/concepts/entities.md).
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
- **Domain docs**: [orders](docs/domains/orders.md) | [customers](docs/domains/customers.md) | [products](docs/domains/products.md) | [pricing](docs/domains/pricing.md) | [account-auth](docs/domains/account-auth.md) | [assets](docs/domains/assets.md)

## Decision Log

**2025-01-15: Skills-based agent architecture**
Agent skills live in `.agents/skills/` as self-contained runbooks. CLAUDE.md is the source of truth for conventions; skills reference it for task-specific workflows.

**2025-02-01: `useEntityEdit` as universal entity page composable**
Every entity detail/edit page uses the same composable. Prevents divergence in unsaved-changes tracking, CRUD flows, and navigation patterns across domains.

**2025-02-25: Nested documentation hierarchy (ARCHITECTURE.md → APP.md → DOMAIN.md)**
Clara Philosophy: each altitude is self-contained. Architecture for the 10,000ft view, APP.md for composition/routing, DOMAIN.md for business rules, CLAUDE.md as the AI entry point.

**2026-04-29: Scratch dirs explicitly excluded from Vite/Nitro watchers**
`.temp/` (and other scratch dirs) may contain cloned reference repos with full `node_modules` trees. Vite/chokidar's recursive watch blew past macOS file-descriptor limits with `EMFILE`, even at `ulimit -n 65536`. Fix is config-level, not env-level: ignore patterns in `nuxt.config.ts` (top-level `ignore`, `vite.server.watch.ignored`, `nitro.watchOptions.ignored`). Watchman is not enough — Vite/chokidar does not auto-detect it.
