## Workflow Rules

These MUST be followed at the start and end of every task:

1. **Linear issues**: When starting work on a Linear issue, **always** set its status to "In Progress" before writing any code.
2. **Update CLAUDE.md**: At the end of every task or chat session, add any new learnings about the codebase, patterns, or conventions discovered during the task to the relevant section of this file.

---

# Geins Studio

Admin interface for Geins Commerce Backend. **Client-side SPA** (`ssr: false`) that communicates with Geins Management API through a Nitro server proxy.

## Stack

- **Framework**: Nuxt 4 + Vue 3 (Composition API, `<script setup>`)
- **Language**: TypeScript
- **Forms**: VeeValidate + Zod schemas (`toTypedSchema`)
- **Styling**: Tailwind CSS 4 with CSS custom properties theming
- **UI Components**: shadcn-vue (`app/components/ui/`) — install via `npx shadcn-vue@latest add`, never create manually
- **Icons**: Lucide (auto-imported via `nuxt-lucide-icons`)
- **i18n**: `@nuxtjs/i18n` — always update both `i18n/locales/en.json` and `sv.json`
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

## API & Repositories

All API calls flow through typed repository factories → `$geinsApi` → Nitro proxy → Geins Management API.

Access via `useGeinsRepository()`:

- `orderApi.quotation` — Quotation CRUD + `query()` endpoint
- `customerApi.company` — Companies with `list({ fields: ['buyers', 'salesreps'] })` or single `get(id, { fields: ['buyers', 'salesreps', 'addresses'] })`
- `productApi` — Products with `list({ fields: ['media', 'skus'] })`
- `globalApi` — Account, channels, currencies, languages

Repository factory chain: `entityGetRepo` → `entityListRepo` → `entityBaseRepo` → `entityRepo` (full CRUD). Domain repos extend these with domain-specific logic.

The Nitro server proxy (`server/api/[...].ts`) is a transparent passthrough — it adds auth headers but performs no response transformation. API responses arrive unchanged from the backend.

## Entity Edit Page Pattern

Entity pages use a single `[id].vue` that handles both create and edit mode:

- Route param `new` → create mode, actual ID → edit mode
- Core composable: `useEntityEdit` from `app/composables/useEntityEdit.ts`
- Key callbacks: `parseEntityData` (API response → form), `prepareCreateData` (form → POST body), `prepareUpdateData` (form → PATCH body), `onFormValuesChange` (reactive sync)
- After creation, `useEntityEdit` auto-navigates to the edit URL via `router.replace()`. Nuxt re-mounts the component (dynamic param changes), so the edit-mode data loading block then executes automatically.
- Provides: `form`, `entityData`, `createMode`, `createEntity()`, `updateEntity()`, `deleteEntity()`, `hasUnsavedChanges`, `confirmLeave`, `currentTab`, `showSidebar`

### Edit Mode Data Loading (required boilerplate)

Every `[id].vue` page **must** include this block at the bottom of `<script setup>` to load entity data in edit mode. Without it, navigating to an existing entity or returning after creation will show an empty form.

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

- `useAsyncData` runs at setup time (before mount) — works with Nuxt's data fetching system
- `handleFetchResult` validates data and throws a page error on 404/500
- `parseAndSaveData` calls `reshapeEntityData` → sets `entityDataUpdate` → calls `parseEntityData` → sets form values
- If `parseEntityData` depends on other data (e.g. company/user lists), fetch those first inside `onMounted` before calling `parseAndSaveData`
- `createMode` is a `ref` (not computed), set once from `route.params.id` at component creation

## List Page Pattern

Pattern: `pages/{domain}/{entity}/list.vue` with `definePageMeta({ pageType: 'list' })`.
Uses: `useGeinsRepository()` → `useAsyncData()` → `useColumns<T>()` → `useTable<T>()` → `usePageError()`.

## Component Conventions

- **Naming**: Component filenames must include their full directory path prefix. A file at `app/components/content/edit/CustomerPanel.vue` is auto-imported as `ContentEditCustomerPanel`. The filename IS the component name (Nuxt does not auto-prefix from directory structure in this project).
- `ContentEditCard` — Collapsible card sections on edit pages. Has `#header-action` slot for buttons next to the title.
- `ContentEditAddressPanel` — Sheet-based address editor (props: `address: AddressUpdate`, emits: `save`, `delete`)
- `ContentEditCustomerPanel` — Sheet-based panel for changing quotation customer details (owner, buyer, addresses). Emits address IDs (`billingAddressId`, `shippingAddressId`) not full address objects. **Important**: When handling the `save` event, the parent must also patch the full address objects into `entityDataUpdate` (looked up from `selectedCompany.addresses`) so the Customer card reflects changes immediately without an API round-trip.
- `ContentSwitch` — Toggle with animated collapsible slot content
- `FormGridWrap` / `FormGrid` — Form layout (design prop: `"1"`, `"1+1"`, `"1+1+1"`, `"2+1+1"`)
- `SelectorPanel` + `TableView` — Entity selection pattern (see `app/pages/examples/sku-selector.vue`)
- `ContentAddressDisplay` — Address display (expects `AddressUpdate` type). Also compatible with `QuotationAddress` since both share the same field names (`addressLine1`, `firstName`, etc.)

## Code Conventions

- **Logging**: Never use `console.log` (ESLint enforces). Use `useGeinsLog('scope')` scoped loggers
- **Composables**: File `use{Name}.ts`, must export named function, return type interface ending in `ReturnType`
- **Props**: `defineProps<{}>()` with `withDefaults()` — no `vue/require-default-prop`
- **Imports**: Nuxt auto-imports composables, utils, and components — don't import them manually. Types: `import type { X } from '#shared/types'`
- **Stores**: Use `storeToRefs(store)` for reactive state properties
- **Forms**: Use `<FormField v-slot="{ componentField }">` pattern. Never implement custom unsaved-changes tracking — `useEntityEdit` handles this

## Path Aliases

| Alias           | Maps To            |
| --------------- | ------------------ |
| `#shared/types` | `shared/types/`    |
| `#shared/utils` | `shared/utils/`    |
| `@/components`  | `app/components/`  |
| `@/composables` | `app/composables/` |
| `@/utils`       | `app/utils/index`  |

## Adding a New Entity (Checklist)

1. **Types** → `shared/types/{Entity}.ts` — Define `{Entity}Base`, `{Entity}Response`, `{Entity}Create`, `{Entity}Update`
2. **Repository** → `app/utils/repositories/{entity}.ts` — Create factory using `entityRepo`
3. **Register repo** → `app/utils/repos.ts` + `app/composables/useGeinsRepository.ts`
4. **List page** → `app/pages/{domain}/{entity}/list.vue`
5. **Detail page** → `app/pages/{domain}/{entity}/[id].vue`
6. **Navigation** → `app/lib/navigation.ts`
7. **i18n** → `i18n/locales/en.json` + `sv.json`

## Display Patterns in Edit Pages

- **Labeled value sections** in read-only cards (e.g. Customer card) use a consistent pattern: `<p class="text-muted-foreground mb-1 text-xs font-medium">` for the label, `<p class="text-sm">` for the value, with `'-'` as fallback when empty.
- **Two-column layouts** in cards use `<div class="grid grid-cols-2 gap-4">`, with `border-t pt-4` for visual separation between sections.
- **Address display** in cards: always show both billing and shipping address sections (with labels); use `ContentAddressDisplay` when address data exists, otherwise show a `-` placeholder.

## Vue Gotchas

- `<KeepAlive>` cannot contain HTML comments — they count as children and cause "expects exactly one child" errors

## Table Patterns

- **Custom columns with render functions**: When using generic components (`TableCellEditable`, `TableHeaderSort`) in `h()` render functions inside `.vue` SFCs, pass the generic type parameter directly: `h(TableCellEditable<RowType>, {...})`. This matches the pattern in `useColumns.ts`.
- **`TableCellProduct`** — Reusable table cell component at `app/components/table/cell/TableCellProduct.vue` that displays a product image, name, and article number. Props: `name`, `articleNumber?`, `imageUrl?`.
- **Editable columns** — Use `columnTypes` in `useColumns` options with `'editable-number'`, `'editable-string'`, `'editable-currency'`, or `'editable-percentage'`. For custom inline-editable columns, render `TableCellEditable<T>` directly via `h()` with `onChange`/`onBlur` handlers.

## Quotation Items

- `QuotationUpdate.items` accepts `QuotationItemCreate[]` (same shape as create: `{ skuId, quantity, customPrice? }`).
- The Products tab uses a `Map<string, SkuItemData>` to track per-SKU quantity and custom price, separate from the selector selection state.
- When loading existing quotation items in edit mode, initialize both `skuItemData` (from response items) and `skuSelection.ids` (from item SKU IDs) after products are fetched.

## Quotation API Shape Differences

- **`terms`**: Response returns `{ text: string }` (object), but CREATE and UPDATE expect a plain `string`. Map `quotation.terms?.text` to form, send string back.
- **`validPaymentMethods`**: Response returns `{ paymentId: number, name: string }`, but requests expect `{ paymentId: string }` (string, no `name`).
- **`prepareUpdateData` must NOT spread the entity** — `entityDataUpdate` contains response-only fields (`billingAddress`, `shippingAddress`, `total`, `company`, `owner`, `customer`, `communication`, `changelog`, etc.) that the PATCH endpoint does not accept. Only include fields from the swagger update schema: `name`, `validTo`, `companyId`, `ownerId`, `customerId`, `validPaymentMethods`, `validShippingMethods`, `suggestedShippingFee`, `terms`, `billingAddressId`, `shippingAddressId`, `items`.
- **Swagger spec URL**: `https://geins-func-quotation-mgmtapi-dev.azurewebsites.net/api/swagger.json`
