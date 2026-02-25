## Workflow Rules

These MUST be followed for every task. Rules are grouped by when they apply.

### Before writing code

1. **Linear issues**: When starting work on a Linear issue, set its status to "In Progress" before writing any code.

### While writing code

2. **Best practices**: Follow all established patterns and conventions in this file and from the frameworks used. If you need to break a pattern, add a note about it here and explain the reasoning.
3. **Think about performance**: Consider performance implications of code changes, especially data fetching, state management, and rendering. If you find a potential bottleneck or optimization opportunity, ask if you should address it.

### Immediately after completing each task (before moving to the next)

4. **Update CLAUDE.md**: Add any new learnings about the codebase, patterns, or conventions discovered during the task to the relevant section of this file. Also remove any outdated or incorrect information. This is a living document — update it continuously, not just at session end.
5. **Documentation**: Keep `/docs` up to date with any architectural changes, new patterns, or important onboarding information. Ask before adding new entries.

### When the user says "task done"

6. **Organize CLAUDE.md**: Scan the entire file for opportunities to improve organization (group related patterns, add sections, improve formatting, remove duplicates). Make those changes.
7. **Linear issues**: If working on a Linear issue, set its status to "Done".

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

## Path Aliases

| Alias           | Maps To            |
| --------------- | ------------------ |
| `#shared/types` | `shared/types/`    |
| `#shared/utils` | `shared/utils/`    |
| `@/components`  | `app/components/`  |
| `@/composables` | `app/composables/` |
| `@/utils`       | `app/utils/index`  |

## Code Conventions

- **Logging**: Never use `console.log` (ESLint enforces). Use `useGeinsLog('scope')` scoped loggers
- **Composables**: File `use{Name}.ts`, must export named function, return type interface ending in `ReturnType`
- **Props**: `defineProps<{}>()` with `withDefaults()` — no `vue/require-default-prop`
- **Imports**: Nuxt auto-imports composables, utils, and components — don't import them manually. Types: `import type { X } from '#shared/types'`
- **Stores**: Use `storeToRefs(store)` for reactive state properties
- **Forms**: Use `<FormField v-slot="{ componentField }">` pattern. Never implement custom unsaved-changes tracking — `useEntityEdit` handles this
- **Entity URLs**: Use `useEntityUrl()` for constructing entity navigation links. `getEntityUrl(id)` uses current route context; `getEntityUrlFor(entityName, parentPath, id)` generates URLs for any entity (e.g. `getEntityUrlFor('price-list', 'pricing', id)` → `/pricing/price-list/{id}`). Prefer these over hardcoded route strings.
- **Full name display**: Use `fullName(entity)` (auto-imported from `app/utils/index.ts`) where `entity` is any object with optional `firstName`/`lastName` fields (or `null`/`undefined`). Never use inline template literals — it handles missing parts via `.trim()`.
- **Date formatting**: Use `useDate()` composable for consistent date display. `formatDate(value, options?)` wraps reka-ui's `useDateFormatter` with the app's locale. Defaults to `dateStyle: 'long'` (e.g. "February 23, 2026") — the same format used in table columns and the calendar picker.
- **Vue gotcha**: `<KeepAlive>` cannot contain HTML comments — they count as children and cause "expects exactly one child" errors
- **Toasts**: Use `useToast` from `@/components/ui/toast/use-toast` (explicit import required — not auto-imported). Init: `const { toast } = useToast()`. For errors, get `showErrorToast` from `usePageError`. Success: `toast({ title: t('entity_copied', { entityName }), variant: 'positive' })`. Error: `showErrorToast(t('error_copying_entity', { entityName }))`. `useEntityEdit` already handles toasts for create/update/delete — only add toasts in pages for additional actions (status transitions, send, copy, etc.). Import order: `@/components` imports must come after `#shared/types` type imports but before `@tanstack` type imports.

## API & Repositories

All API calls flow through typed repository factories → `$geinsApi` → Nitro proxy → Geins Management API.

Access via `useGeinsRepository()`:

- `orderApi.quotation` — Quotation CRUD + `query()` endpoint
- `customerApi.company` — Companies with `list({ fields: ['buyers', 'salesreps'] })` or single `get(id, { fields: ['buyers', 'salesreps', 'addresses', 'pricelists'] })`
- `productApi` — Products with `list({ fields: ['media', 'skus'] })`
- `globalApi` — Account, channels, currencies, languages

Repository factory chain: `entityGetRepo` → `entityListRepo` → `entityBaseRepo` → `entityRepo` (full CRUD). Domain repos extend these with domain-specific logic.

The Nitro server proxy (`server/api/[...].ts`) is a transparent passthrough — it adds auth headers but performs no response transformation. API responses arrive unchanged from the backend.

---

## Page Patterns

### Entity Edit Page

Entity pages use a single `[id].vue` that handles both create and edit mode:

- Route param `new` → create mode, actual ID → edit mode
- Core composable: `useEntityEdit` from `app/composables/useEntityEdit.ts`
- Key callbacks: `parseEntityData` (API response → form), `prepareCreateData` (form → POST body), `prepareUpdateData` (form → PATCH body), `onFormValuesChange` (reactive sync)
- After creation, `useEntityEdit` auto-navigates to the edit URL via `router.replace()`. Nuxt re-mounts the component (dynamic param changes), so the edit-mode data loading block then executes automatically.
- Provides: `form`, `entityData`, `createMode`, `createEntity()`, `updateEntity()`, `deleteEntity()`, `hasUnsavedChanges`, `confirmLeave`, `currentTab`, `showSidebar`
- **Display-only response data**: For response-only fields (e.g. nested objects from the API that aren't part of the update type), store them in dedicated `ref`s populated in `parseEntityData`. Do not cast `entityDataUpdate` to the response type or patch response-only fields into it.

#### Edit Mode Data Loading (required boilerplate)

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
- **Unsaved changes during loading**: `useUnsavedChanges` automatically suppresses `hasUnsavedChanges` while `originalData` is empty (no snapshot set yet). This means the indicator won't flicker during async data loading. No page-specific handling needed for this.
- **Unsaved changes snapshot timing**: When `parseEntityData` triggers side effects that mutate `entityDataUpdate` (via `form.setValues()` → `onFormValuesChange`, reactive watchers, or async fetches like `fetchProducts()`), the default `parseAndSaveData(entity)` snapshot will be stale. Fix: call `parseAndSaveData(entity, false)` to skip the automatic snapshot, `await` all async work that affects entity data, then `await nextTick(); setOriginalSavedData();` to capture the final settled state. See `price-list/[id].vue` and `quotation/[id].vue` for examples. **This also applies to save handlers**: `updateEntity` internally calls `parseAndSaveData`, so pages with the same side-effect pattern need a custom save handler: `await updateEntity(undefined, undefined, false)` → `await nextTick()` → `setOriginalSavedData()`. See `quotation/[id].vue` `handleSave` for an example.
- **`onFormValuesChange` completeness**: The edit-mode branch of `onFormValuesChange` must map ALL update-relevant form fields into `entityDataUpdate`, otherwise changes to missing fields won't trigger `hasUnsavedChanges` (and the save button stays disabled). If a field is in `prepareUpdateData` but not in `onFormValuesChange`, it will save correctly when triggered by _other_ changes but won't enable the save button on its own.
- **Non-form refs that affect `entityDataUpdate`**: When standalone `ref`s (e.g. `selectedBillingAddressId`) contribute to `entityDataUpdate` but aren't form fields, add a dedicated `watch()` to sync them — `onFormValuesChange` only fires on form value changes. See the address watcher in `quotation/[id].vue` for an example.
- **VeeValidate clears values on field unmount**: When an entity page switches between form-mode and read-only mode (e.g. draft → sent), VeeValidate unregisters fields as they leave the DOM and clears their values from `form.values`. The debounced `onFormValuesChange` then fires with empty values and overwrites `entityDataUpdate`. Fix: add `if (sentMode.value) return;` (or equivalent mode guard) at the top of the edit-mode branch in `onFormValuesChange`. Additionally, sent-mode read-only templates must read display data from `entityData` (populated by `reshapeEntityData`) rather than `form.values.details`, since the latter is unreliable after field unmount. See `quotation/[id].vue` for the pattern.
- `createMode` is a `ref` (not computed), set once from `route.params.id` at component creation
- **Reactive refresh after status transitions**: `refresh()` from `useAsyncData` updates `data.value` reactively, but `parseAndSaveData` is only called explicitly inside `onMounted`. Pages that call `refreshEntityData` after status transitions (e.g. quotation send/accept) must add `watch(data, async (newData) => { await parseAndSaveData(newData, false); await nextTick(); setOriginalSavedData(); })` inside the `if (!createMode.value)` block so that refreshed data is re-parsed. The watch fires only on subsequent changes (not the initial value), so it doesn't interfere with the `onMounted` flow.

### List Page

Pattern: `pages/{domain}/{entity}/list.vue` with `definePageMeta({ pageType: 'list' })`.
Uses: `useGeinsRepository()` → `useAsyncData()` → `useColumns<T>()` → `useTable<T>()` → `usePageError()`.

### Adding a New Entity (Checklist)

1. **Types** → `shared/types/{Entity}.ts` — Define `{Entity}Base`, `{Entity}Response`, `{Entity}Create`, `{Entity}Update`
2. **Repository** → `app/utils/repositories/{entity}.ts` — Create factory using `entityRepo`
3. **Register repo** → `app/utils/repos.ts` + `app/composables/useGeinsRepository.ts`
4. **List page** → `app/pages/{domain}/{entity}/list.vue`
5. **Detail page** → `app/pages/{domain}/{entity}/[id].vue`
6. **Navigation** → `app/lib/navigation.ts`
7. **i18n** → `i18n/locales/en.json` + `sv.json`

---

## Component & UI Patterns

### Component Conventions

- **Naming**: Component filenames must include their full directory path prefix. A file at `app/components/content/edit/CustomerPanel.vue` is auto-imported as `ContentEditCustomerPanel`. The filename IS the component name (Nuxt does not auto-prefix from directory structure in this project).
- `ContentEditCard` — Collapsible card sections on edit pages. Has `#header-action` slot for buttons next to the title.
- `ContentEditAddressPanel` — Sheet-based address editor (props: `address: AddressUpdate`, emits: `save`, `delete`)
- `ContentEditCustomerPanel` — Sheet-based panel for changing quotation customer details (owner, buyer, addresses). Emits address IDs (`billingAddressId`, `shippingAddressId`) not full address objects. **Important**: When handling the `save` event, the parent must update dedicated display refs (e.g. `billingAddress`, `shippingAddress`) looked up from `selectedCompany.addresses` so the Customer card reflects changes immediately without an API round-trip. Do not patch response-only fields into `entityDataUpdate`.
- `ContentSwitch` — Toggle with animated collapsible slot content
- `FormGridWrap` / `FormGrid` — Form layout (design prop: `"1"`, `"1+1"`, `"1+1+1"`, `"2+1+1"`)
- `SelectorPanel` + `TableView` — Entity selection pattern (see `app/pages/examples/sku-selector.vue`)
- `ContentAddressDisplay` — Address display (expects `AddressUpdate` type). Also compatible with `QuotationAddress` since both share the same field names (`addressLine1`, `firstName`, etc.)
- `InputGroup` / `InputGroupAddon` / `InputGroupButton` / `InputGroupInput` / `InputGroupTextarea` — Composable input groups with addons (icons, buttons, text) positioned via `align` prop (`inline-start`, `inline-end`, `block-start`, `block-end`). Use `InputGroupInput` instead of `Input` inside groups.
- `ButtonGroup` / `ButtonGroupSeparator` / `ButtonGroupText` — Groups related buttons with shared border radius. Supports `orientation` (`horizontal` | `vertical`) and nesting.

### Display Patterns in Edit Pages

- **Labeled value sections** in read-only cards (e.g. Customer card) use a consistent pattern: `<p class="text-muted-foreground mb-1 text-xs font-medium">` for the label, `<p class="text-sm">` for the value, with `'-'` as fallback when empty.
- **Two-column layouts** in cards use `<div class="grid grid-cols-2 gap-4">`, with `border-t pt-4` for visual separation between sections.
- **Address display** in cards: always show both billing and shipping address sections (with labels); use `ContentAddressDisplay` when address data exists, otherwise show a `-` placeholder.

### Table Patterns

- **Table modes**: `TableMode` enum in `shared/types/Table.ts` defines `Advanced` (full-featured list pages), `Simple` (lightweight nested tables), and `Minimal` (de-cluttered, no borders/pagination/sorting — for edit page inline tables like quotation items). Mode is passed via `table.options.meta.mode` and accessible in render functions. Minimal mode differences: no outer border/card wrapper, no vertical cell borders, no pagination, no sorting (plain text headers with `font-medium normal-case`), no column pinning, no row hover, taller rows (`h-[68px]`). All minimal overrides use scoped CSS on `.table-view--minimal` in `TableView.vue` — UI primitives are never modified for mode-specific styling.
- **Minimal mode columns**: Prefer using `useColumns.getColumns()` with `sortable: false`, `includeColumns`, and `columnTypes` so that minimal mode header styling (plain text, no sort buttons) is applied automatically. Pass custom cell behavior (e.g. `onChange`, `onBlur`, `placeholder`) via `columnCellProps`.
- **TableView architecture**: `app/components/table/TableView.vue` is the main component. It wraps TanStack's `useVueTable` with mode-aware features (pagination, pinning, sorting, column toggle, maximize). Styling overrides per mode are applied via CSS classes on the `.table-view` wrapper — UI primitives in `app/components/ui/table/` provide base styles and should not be modified for mode-specific styling.
- **TablePagination**: Located at `app/components/table/TablePagination.vue` (not in `ui/table/`). Receives `advanced` boolean prop to show/hide rows-per-page selector.
- **Custom columns with render functions**: When using generic components (`TableCellEditable`, `TableHeaderSort`) in `h()` render functions inside `.vue` SFCs, pass the generic type parameter directly: `h(TableCellEditable<RowType>, {...})`. This matches the pattern in `useColumns.ts`.
- **`TableCellProduct`** — Reusable table cell component at `app/components/table/cell/TableCellProduct.vue` that displays a product image, name, and article number. Props: `name`, `articleNumber?`, `imageUrl?`. Prefer using the `'product'` column type in `useColumns` (which renders this component automatically) instead of manual `h()` calls. The row data must have `articleNumber` and `image`/`imageUrl` fields alongside the accessor field.
- **Editable columns** — Use `columnTypes` in `useColumns` options with `'editable-number'`, `'editable-string'`, `'editable-currency'`, or `'editable-percentage'`. For custom inline-editable columns, render `TableCellEditable<T>` directly via `h()` with `onChange`/`onBlur` handlers.
- **Column type inference**: `useColumns.getColumns()` infers column types from field names (e.g. "date" → date formatter, "price"/"amount" → currency, "image" → thumbnail, "product" with `articleNumber` in data → product cell). Override via `columnTypes` option. Header/cell base styles come from `getBasicHeaderStyle(table)` and `getBasicCellStyle(table)` which branch on the table mode.
- **useSkeleton**: Composable at `app/composables/useSkeleton.ts` generates placeholder rows and columns with `<Skeleton>` components when `TableView` has `loading={true}`.

---

## Domain-Specific Knowledge

### Quotations

**Items:**

- `QuotationUpdate.items` accepts `QuotationItemCreate[]` (same shape as create: `{ skuId, quantity, customPrice? }`).
- The Products tab uses a `Map<string, SkuItemData>` to track per-SKU quantity, custom price, and response prices (`ordPrice`, `listPrice`), separate from the selector selection state.
- `QuotationProductRow` is the table display type that maps `selectedSkus` + `skuItemData` into flat rows with columns: Product, SKU ID, Quantity, Price, Price list price, Quotation price.
- Price fields in the row type use `{ price: string, currency: string }` objects (matching the `'currency'`/`'editable-currency'` column types). The currency value comes from `form.values.details.currency`.
- In edit mode, prices are populated from `QuotationItemBase` response fields (`ordPrice`, `listPrice`, `unitPrice`). In create mode, prices are empty strings (displayed as `---` by `TableCellCurrency`).
- When loading existing quotation items in edit mode, initialize both `skuItemData` (from response items) and `skuSelection.ids` (from item SKU IDs) after products are fetched.

**Snapshot convention (entity sub-objects in responses):**

- `QuotationOwner`, `QuotationCustomer`, `QuotationCompany`, and `QuotationAddress` are snapshots — point-in-time captures stored with the quotation.
- Each snapshot extends `EntitySnapshot` (`shared/types/Api.ts`), which provides `_id: string`, `_type: string`, `_snapshotAt?: string | null` (leading underscores, matching the top-level entity shape).
- `QuotationOwner` and `QuotationCustomer` use `firstName`/`lastName` (no combined `name` or `email`). Use `fullName(x.firstName, x.lastName)` for display.
- To read IDs from snapshots: `company._id`, `owner._id`, `customer._id`, `billingAddress._id` (not `companyId`/`ownerId`/`customerId`/`addressId`).
- `toQuotationAddress()` in `[id].vue` maps a company `Address` → `QuotationAddress`, setting `_type: 'geins.wholesale_account_address'`.

**API shape differences:**

- **`validPaymentMethods`**: Response returns `{ paymentId: number, name: string }`, but requests expect `{ paymentId: string }` (string, no `name`).
- **`prepareUpdateData` must NOT spread the entity** — `entityDataUpdate` contains response-only fields (`billingAddress`, `shippingAddress`, `total`, `company`, `owner`, `customer`, `communication`, `changelog`, etc.) that the PATCH endpoint does not accept. Only include fields from the swagger update schema: `name`, `validTo`, `companyId`, `ownerId`, `customerId`, `validPaymentMethods`, `validShippingMethods`, `suggestedShippingFee`, `terms`, `billingAddressId`, `shippingAddressId`, `items`.
- **`quotationNumber`**: Read-only, auto-generated by the backend. Not accepted on the PATCH endpoint — render as a disabled input in the UI.
- **Swagger spec URL**: `https://geins-func-quotation-mgmtapi-dev.azurewebsites.net/api/swagger.json`

**Sent mode (non-draft statuses):**

- Three mutually exclusive modes: `createMode` (route param `new`), edit/draft mode (`!createMode && !sentMode`), sent mode (`quotation.status !== 'draft'`).
- `sentMode` is a `ref<boolean>` set in `parseEntityData` — since status transitions are one-way, it never reverts to draft.
- In sent mode, the General tab renders read-only display cards instead of form inputs, plus an "Items & Summary" card with a non-editable `TableMode.Minimal` table. The Products tab is replaced by a Communications tab.
- Tabs are a `computed` that switches between `[General, Products]` (draft) and `[General, Communications]` (sent).
- Status transition actions use a two-step pattern: `POST /quotation/{id}/{action}` (returns void) → `refreshEntityData()` re-fetches → `parseEntityData` updates all UI state including `sentMode`, `communications`, and the sidebar status badge.
- `StatusTransitionRequest` type: `{ authorId, authorName, message?: { type: QuotationMessageType, message } }`. Author info comes from `useUserStore`.
- `DialogConfirmSend` handles the initial draft→pending transition with an optional `toCustomer` message. `DialogStatusTransition` is reusable for all other transitions (accept, reject, confirm, cancel, expire, finalize).
- "Copy as new draft" calls `orderApi.quotation.copy(id)` (`POST /quotation/{id}/copy`) → shows success toast → navigates to the new draft.
- Delete is only available on terminal statuses (`rejected`, `expired`, `canceled`, `finalized`).
- The sidebar `StatusBadge` is reactive: `useEntityEditSummary` accepts `status` as a `Ref` and `unref`s it in the computed.

### Companies

- **`CustomerCompany.priceLists`**: Array of `CustomerPriceList` objects (response type). Each has `_id`, `name`, `channel`, `currency`, `active`, `exVat`, `productCount` (extends `ProductPriceList` minus products/rules/query/forced/dateCreated).
- **`CustomerCompanyCreate/Update.priceLists`**: Array of `string` (just IDs).
- **Price list edit route**: `/pricing/price-list/[id]` — use `getEntityUrlFor('price-list', 'pricing', id)` to generate links.

### Products

- **`ProductApiOptions`** extends `ApiOptions` with `defaultChannel`, `defaultCurrency`, `defaultCountry`, `defaultLocale`. These are forwarded as query params by `buildQueryObject` (which passes through any extra string properties beyond `fields`/`pageSize`).
- **Product swagger spec URL**: `https://geins-func-product-mgmtapi-dev.azurewebsites.net/api/swagger.json`
