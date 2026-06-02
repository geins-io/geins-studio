# APP.md — App-Level Composition & Routing

> Geins Studio: how domains wire together into a runnable SPA.
> For system-wide architecture and data flow, see `ARCHITECTURE.md`.
> For coding conventions and entity patterns, see `CLAUDE.md`.

---

## File-Based Routing

All pages live under `app/pages/` and are auto-registered by Nuxt as routes.

| Route prefix   | Domain pages                         | Capability                               |
| -------------- | ------------------------------------ | ---------------------------------------- |
| `/`            | `index.vue`                          | Dashboard — quick access + recent orders |
| `/auth/*`      | `login`, `logout`, `reset-password`  | Authentication flows (no sidebar)        |
| `/pricing/*`   | `price-list/list`, `price-list/[id]` | Price list management                    |
| `/customers/*` | `company/list`, `company/[id]`       | Company / buyer management               |
| `/orders/*`    | `quotation/list`, `quotation/[id]`   | Quotation lifecycle                      |
| `/account/*`   | `profile/index`, `user/index`        | User profile (hidden from nav)           |

Entity pages follow the convention `pages/{domain}/{entity}/list.vue` and `pages/{domain}/{entity}/[id].vue`. The param `new` on `[id].vue` activates create mode.

---

## Layout System

Two layouts in `app/layouts/`:

| Layout        | Used by                 | Structure                                                                                                     |
| ------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `default.vue` | All authenticated pages | `SidebarProvider` → `LayoutSidebar` + `SidebarInset` with sticky `LayoutHeader` and a scrollable content slot |
| `auth.vue`    | `/auth/*` routes        | Minimal centered card, no sidebar or header                                                                   |

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

| Plugin                             | Runs on       | Purpose                                                                           |
| ---------------------------------- | ------------- | --------------------------------------------------------------------------------- |
| `geins-api.ts`                     | client+server | Creates `$geinsApi` (`$fetch`) with auth headers and token auto-refresh           |
| `auth-state.ts`                    | client        | Syncs auth state across browser tabs via `BroadcastChannel`; sets skeleton cookie |
| `geins-global.ts`                  | client        | Calls `accountStore.init()` and `productsStore.fetchProducts()` on session start  |
| `error-handler.ts`                 | client        | Catches `AUTH_ERROR` / `API_ERROR` from Vue's global error handler                |
| `click-outside.client.ts`          | client        | Registers `v-click-outside` directive                                             |
| `click-outside.server.ts`          | server        | Stub — prevents directive errors during SSR compatibility checks                  |
| `suppress-devtools-warn.client.ts` | client        | Suppresses noisy devtools warnings in development                                 |

`$geinsApi` must be initialised before `geins-global.ts` runs — plugin filename order guarantees this.

---

## Navigation Config

`app/lib/navigation.ts` exports `getNavigation(t)` — the single source of truth for the sidebar menu. It returns a `NavigationItem[]` array consumed by `LayoutSidebar`.

Current top-level entries (all in group `sales`):

| Label     | Root href                  | Domain       |
| --------- | -------------------------- | ------------ |
| Pricing   | `/pricing/price-list/list` | Price lists  |
| Customers | `/customers/company/list`  | Companies    |
| Orders    | `/orders/quotation/list`   | Quotations   |
| Account   | _(hidden from menu)_       | User profile |

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

#### Edit Mode Data Loading (required boilerplate)

Every `[id].vue` page **must** include this block at the bottom of `<script setup>` to load entity data in edit mode:

```ts
if (!createMode.value) {
  const { data, error, refresh } = await useAsyncData<TResponse>(
    entityFetchKey.value,
    () => repository.get(entityId.value, { fields: ['all'] }),
  );
  refreshEntityData.value = refresh;
  onMounted(async () => {
    const entity = handleFetchResult<TResponse>(error.value, data.value);
    await parseAndSaveData(entity);
  });
}
```

- `useAsyncData` runs at setup time (before mount); `handleFetchResult` validates and throws on 404/500
- `parseAndSaveData` calls `reshapeEntityData` → sets `entityDataUpdate` → calls `parseEntityData` → sets form values
- If `parseEntityData` depends on other data, fetch those first inside `onMounted` before calling `parseAndSaveData`
- **Unsaved changes**: `useUnsavedChanges` suppresses `hasUnsavedChanges` while `originalData` is empty — no page-specific handling needed during loading
- **Snapshot timing**: When `parseEntityData` triggers side effects (watchers, async fetches), call `parseAndSaveData(entity, false)` to skip auto-snapshot, `await` all async work, then `await nextTick(); setOriginalSavedData();`. Same applies to save handlers: `await updateEntity(undefined, undefined, false)` → `await nextTick()` → `setOriginalSavedData()`
- **`onFormValuesChange` completeness**: Must map ALL update-relevant form fields into `entityDataUpdate`, otherwise missing fields won't trigger `hasUnsavedChanges`
- **Non-form refs**: When standalone `ref`s contribute to `entityDataUpdate` but aren't form fields, add a dedicated `watch()` to sync them
- **VeeValidate field unmount**: When switching from form-mode to read-only mode, VeeValidate unregisters fields and clears values. Guard with `if (sentMode.value) return;` in `onFormValuesChange`. Read display data from `entityData` (not `form.values`) in read-only mode
- **Reactive refresh**: Pages calling `refreshEntityData` after status transitions need `watch(data, async (newData) => { await parseAndSaveData(newData, false); await nextTick(); setOriginalSavedData(); })` in the `if (!createMode.value)` block

### Live & Async Primitives

Use the shared primitives instead of hand-rolling `setInterval` / `Date.now()` loops in a page or component:

- **`useLiveClock(active, intervalMs?)`** → `{ now }`. Reactive `now` ref that ticks only while `active` (boolean / getter) is true. Auto-stops on unmount. Use for live duration cells.
- **`usePollWhile(active, fn, intervalMs)`** — run `fn` on an interval while `active` is true. Swallows tick errors via `useGeinsLog`. Use to poll `refresh()` on a running entity detail page, or to pull new rows into a list page.
- **`useExecutionStatus()`** → `{ resolveStatusIcon }`. Single source of truth for orchestrator execution status → Lucide icon + color class. Case-insensitive; returns a fallback alert icon for unknown values.
- **`formatTimestamp(iso)`** / **`formatDuration(ms)`** from `#shared/utils/time` — fixed-format log timestamps (`YYYY-MM-DD HH:mm:ss.SSS`) and compact durations (`123ms` / `12.34s` / `1m 23s`). Use these for any execution/log/console UI. `useDate()` is still the right choice for locale-aware absolute dates elsewhere.

Rule of thumb: if a page needs to react to something changing over time (duration cells, polling a running execution, live status badges), reach for these composables before adding a local interval. They centralize start/stop/cleanup so pages stay declarative.

### Adding a New Entity (Checklist)

1. **Types** → `shared/types/{Entity}.ts` — Define `{Entity}Base`, `{Entity}Create`, `{Entity}Update`, and `{Entity}` (response type)
2. **Export types** → `shared/types/index.ts`
3. **Repository** → `app/utils/repositories/{entity}.ts`
4. **Register repo** → `app/utils/repos.ts` + `app/composables/useGeinsRepository.ts`
5. **List page** → `app/pages/{domain}/{entity}/list.vue`
6. **Detail page** → `app/pages/{domain}/{entity}/[id].vue`
7. **Navigation** → `app/lib/navigation.ts`
8. **i18n** → `i18n/locales/en.json` + `sv.json`

---

## Component Classification

Components in `app/components/` are classified as **domain** or **infrastructure**:

| Directory                                               | Classification   | Notes                                       |
| ------------------------------------------------------- | ---------------- | ------------------------------------------- |
| `ui/`                                                   | Infrastructure   | shadcn-vue primitives (CLI-installed)       |
| `content/`, `content/edit/`, `content/text/`            | Infrastructure   | Reusable edit page building blocks          |
| `table/`, `table/cell/`, `table/header/`                | Infrastructure   | Table system                                |
| `form/`, `form/input/`, `form/item/`                    | Infrastructure   | Form layout and inputs                      |
| `dialog/`                                               | Infrastructure   | Delete, unsaved changes, status transitions |
| `selector/`                                             | Infrastructure   | Reusable entity selection pattern           |
| `layout/`, `sidebar/`, `button/`, `error/`, `feedback/` | Infrastructure   | App shell and utilities                     |
| `shared/`                                               | Infrastructure   | Cross-domain reusable components (JsonCodeEditor) |
| `company/`                                              | **Customers**    | CompanyBuyerPanel                           |
| `price-list/`                                           | **Pricing**      | PriceMode, Rules, VolumePricing             |
| `quotation/`                                            | **Orders**       | Changelog, Communications, Messages         |
| `content/quotation/`                                    | **Orders**       | QuotationCustomerDisplay, WorkflowInfo      |
| `auth/`                                                 | **Account/Auth** | AuthForm                                    |

> Components are **not moved** into domain groupings because Nuxt auto-import naming depends on directory path. See `docs/domain-colocation-proposal.md` for rationale.

## Component Conventions

- **Naming**: Component filenames must include their full directory path prefix. `app/components/content/edit/CustomerPanel.vue` → auto-imported as `ContentEditCustomerPanel`.
- `ContentEditCard` — Collapsible card sections on edit pages. Has `#header-action` slot.
- `ContentEditAddressPanel` — Sheet-based address editor (props: `address: AddressUpdate`, emits: `save`, `delete`)
- `ContentEditCustomerPanel` — Sheet-based panel for changing quotation customer details. Emits address IDs not full objects. Parent must update dedicated display refs from `selectedCompany.addresses`.
- `ContentSwitch` — Toggle with animated collapsible slot content
- `FormGridWrap` / `FormGrid` — Form layout (design prop: `"1"`, `"1+1"`, `"1+1+1"`, `"2+1+1"`)
- `SelectorPanel` + `TableView` — Entity selection pattern (see `app/pages/examples/sku-selector.vue`)
- `ContentAddressDisplay` — Address display (expects `AddressUpdate` type, compatible with `Address`)
- `InputGroup` / `InputGroupAddon` / `InputGroupButton` / `InputGroupInput` / `InputGroupTextarea` — Composable input groups with `align` prop (`inline-start`, `inline-end`, `block-start`, `block-end`)
- `ButtonGroup` / `ButtonGroupSeparator` / `ButtonGroupText` — Groups buttons with shared border radius. Supports `orientation` and nesting.
- `ContentEditTabs` — Tab navigation. Accepts `string[]` or `(string | { label: string; badge?: number })[]`.
- `ContentPriceSummary` — Price summary rows. Props: `total` (`QuotationTotal`), `currency`, `editMode?`. Uses `defineModel` for two-way binding and emits `blur`.

### Shared Components

- `SharedJsonCodeEditor` — CodeMirror 6 JSON editor/viewer with app theme integration. Props: `modelValue` (v-model), `readonly` (display-only), `lineNumbers` (default `true`), `lineWrapping` (default `false`). Uses `basicSetup` when line numbers are enabled, `minimalSetup` otherwise. Themed with CSS custom properties to match light/dark mode.

### Display Patterns in Edit Pages

- **Labeled values** in read-only cards: `<p class="text-muted-foreground mb-1 text-xs font-medium">` for label, `<p class="text-sm">` for value, `'-'` fallback.
- **Two-column layouts**: `<div class="grid grid-cols-2 gap-4">`, `border-t pt-4` for separation.
- **Address display**: Always show both billing and shipping sections; use `ContentAddressDisplay` or `-` placeholder.

---

## Table Patterns

- **Table modes**: `TableMode` enum — `Advanced` (list pages), `Simple` (nested), `Minimal` (edit page inline tables). Mode via `table.options.meta.mode`. Minimal: no borders/pagination/sorting/pinning/hover, taller rows (`h-[68px]`). All overrides use scoped CSS on `.table-view--minimal`.
- **TableView**: Wraps TanStack's `useVueTable` with mode-aware features. Styling per mode via CSS classes — never modify `app/components/ui/table/` primitives.
- **TableView error state**: `error` (boolean) + `onRetry` (callback) props show inline error with retry button.
- **Inactive row dimming**: `dimInactiveRows` prop (default `false`). When `true`, cells in rows where `row.original.active === false` get `opacity-50`. Opt individual columns out via `meta: { skipInactiveDim: true }` in the column def — `useColumns` sets this automatically for `'switch'` type columns so the toggle stays full opacity.
- **TablePagination**: At `app/components/table/TablePagination.vue`. `advanced` prop controls rows-per-page selector.
- **Column type inference**: `useColumns.getColumns()` infers from field names (date → formatter, price → currency, image → thumbnail, product → product cell). Override via `columnTypes`.
- **Editable columns**: Use `columnTypes` with `'editable-number'`, `'editable-string'`, `'editable-currency'`, `'editable-percentage'`.
- **Custom columns**: Use `useColumns` (`getColumns` + `orderAndFilterColumns` + `extendColumns`), not manual column defs. Use `excludeColumns` + `extendColumns` for custom cell rendering.
- **`TableCellActions`**: Default `availableActions`: `['edit', 'copy', 'delete']`. `disabledActions` accepts static array or per-row callback.
- **useSkeleton**: Use `:loading="loading && rows.length === 0"` to avoid duplicate key warnings when re-fetching.

---

## Routes ↔ Domain Capabilities

Routes are entry points; domains are the capabilities they expose.

| Route                   | Domain capability                                                           |
| ----------------------- | --------------------------------------------------------------------------- |
| `/pricing/price-list/*` | CRUD price lists; assign to companies                                       |
| `/customers/company/*`  | CRUD companies; assign buyers, salesreps, price lists, addresses            |
| `/orders/quotation/*`   | Full quotation lifecycle: draft → send → accept/reject → confirm → finalize |
| `/account/profile`      | Edit own user profile and preferences                                       |
| `/auth/*`               | Session management (login, logout, password reset)                          |

Cross-domain links: the quotation edit page links to company and price-list entities via `useEntityUrl()` / `getEntityUrlFor()`.

---

## Decision Log

**2024-05-27: Two-layout system (default + auth)**
Authenticated pages get the full sidebar/header layout; auth pages get a minimal centered card. Keeps auth flows visually distinct and avoids loading sidebar state before login.

**2024-05-30: File-based routing with `{domain}/{entity}/list.vue` and `[id].vue` convention**
Consistent URL structure across all domains. The `new` param on `[id].vue` activates create mode, avoiding separate create pages.

**2025-02-01: `useEntityEdit` as the universal detail/edit page composable**
Centralizes form state, unsaved-changes tracking, CRUD operations, and navigation for all entity pages. Prevents each page from reimplementing the same boilerplate.

**2026-03-19: APP.md as composition + patterns reference**
APP.md serves dual role: 1,000ft composition/routing doc AND detailed pattern reference (entity edit boilerplate, component conventions, table patterns). Moved here from CLAUDE.md to keep CLAUDE.md slim (≤150 lines) while preserving patterns in a single authoritative location.
