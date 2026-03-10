<!--
This file (CLAUDE.md) is the canonical reference for how we work + how this codebase works.
For step-by-step, task-focused runbooks, use the files in /skills.
When adding or changing a workflow, update CLAUDE.md first, then update/create the relevant skill.
-->

## Skills Index

- Skills overview: `skills/README.md`
- Start dev & fast checks: `skills/dev-loop.md` (see also “Geins Studio - Commands”)
- CI preflight (run before PR): `skills/ci-preflight.md` (see also “Geins Studio - Commands”)
- Add a new entity (end-to-end): `skills/add-new-entity.md` (see also “Page Patterns - Adding a New Entity Checklist”)
- Entity edit page: required edit-mode loading: `skills/entity-edit-page-edit-mode-loading.md` (see also “Entity Edit Page - Edit Mode Data Loading required boilerplate”)
- i18n updates: `skills/i18n-update.md` (see also i18n rules in “Stack” / “Project Structure”)
- Add/extend API repository: `skills/api-repository-add-or-extend.md` (see also “API Repositories”)
- UI component conventions: `skills/ui-component-conventions.md` (see also “Component UI Patterns - Component Conventions”)
- Table patterns: `skills/table-patterns.md` (see also “Component UI Patterns - Table Patterns”)

## Token Efficiency Rules

- Minimize token usage in all responses and tool calls.
- Prefer referencing existing docs/code (file path + section/heading) over repeating content.
- Only quote code/file content when necessary; quote the smallest snippet that supports the decision.
- Read narrowly first: search for keywords and open only the specific files/sections needed.
- Keep outputs diff-shaped: list intended changes + exact file paths; avoid pasting unchanged code.
- Batch work: propose a short plan, then execute related edits together (avoid back-and-forth refactors).
- If the request is ambiguous (scope, acceptance criteria, target files, expected behavior), ask clarifying questions before doing large reads or broad changes.
- If a task would require broad context, ask for approval before pulling lots of files/logs.

## Workflow Rules

These MUST be followed for every task. Rules are grouped by when they apply.

### Before writing code

1. **Linear issues**: When starting work on a Linear issue, set its status to "In Progress" before writing any code.
2. **Branching**: Always ask if you should create a new branch or keep working in the current one. If a new branch is needed, create it with the naming convention `feat/{linear-issue-number}-{short-description}` (e.g. `123-fix-quotation-preview-bug`). Always use the `next` branch as the base for new branches, if not explicitly instructed otherwise. This keeps the commit history clean and Linear integration accurate. If the issue is a bug, include "fix" instead of "feat" in the branch name.

### While writing code

3. **Best practices**: Follow all established patterns and conventions in this file and from the frameworks used. If you need to break a pattern, add a note about it here and explain the reasoning.
4. **Think about performance**: Consider performance implications of code changes, especially data fetching, state management, and rendering. If you find a potential bottleneck or optimization opportunity, ask if you should address it.

### When the user says "task done"

5. **Documentation**: Keep `/docs` up to date with any architectural changes, new patterns, or important onboarding information. Ask before adding new entries.
6. **Update CLAUDE.md**: Add any new learnings about the codebase, patterns, or conventions discovered during the task to the relevant section of this file. Also remove any outdated or incorrect information. This is a living document — update it continuously, not just at session end.
7. **Organize CLAUDE.md**: Scan the entire file for opportunities to improve organization (group related patterns, add sections, improve formatting, remove duplicates). Make those changes.
8. **Linear issues**: If working on a Linear issue, set its status to "Done".

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
- **i18n**: `@nuxtjs/i18n` — always update both `i18n/locales/en.json` and `sv.json`. Global entity action keys (top-level, outside any namespace): `save_entity`, `delete_entity`, `send_entity`, `accept_entity`, `reject_entity`, `confirm_entity`, `cancel_entity` — all use `@.lower:{entityName}` interpolation and serve as both button labels and dialog titles. Quotation-specific description text lives in the `orders` namespace (e.g. `orders.accept_quotation_description`).
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
- **`v-auto-animate` gotcha**: Avoid using `v-auto-animate` on elements that swap small icon-sized children via `v-if/v-else` — it briefly renders both elements simultaneously, causing a layout shift. Fix: render both icons absolutely positioned inside a fixed-size `relative` wrapper and use CSS `opacity`/`scale` transitions instead.
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
- `ContentAddressDisplay` — Address display (expects `AddressUpdate` type). Also compatible with `Address` since both share the same field names (`addressLine1`, `firstName`, etc.)
- `InputGroup` / `InputGroupAddon` / `InputGroupButton` / `InputGroupInput` / `InputGroupTextarea` — Composable input groups with addons (icons, buttons, text) positioned via `align` prop (`inline-start`, `inline-end`, `block-start`, `block-end`). Use `InputGroupInput` instead of `Input` inside groups.
- `ButtonGroup` / `ButtonGroupSeparator` / `ButtonGroupText` — Groups related buttons with shared border radius. Supports `orientation` (`horizontal` | `vertical`) and nesting.
- `ContentEditTabs` — Tab navigation bar for edit pages. `tabs` prop accepts `string[]` or `(string | { label: string; badge?: number })[]` — pass an object to show a numeric badge pill on the trigger. Badge hides when `0` or `undefined`. Used in quotation `[id].vue` to show total message count on the Communications tab.
- `ContentPriceSummary` — Price summary rows (subtotal, discount, shipping, VAT, grand total). Props: `total` (`QuotationTotal`), `currency`, `editMode?`. When `editMode=true`: discount row becomes a shadcn `Input` (with `#valueDescriptor` slot containing a `Select` dropdown for switching between `%` and currency) plus a calculated discount amount display (e.g. "-100.00 SEK"); shipping row becomes an `Input` with currency in `#valueDescriptor`. Uses `defineModel` for `discountType`, `discountValue`, `shippingFee` (two-way binding) and emits `blur` when an editable field loses focus (parent triggers preview).

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
- **`TableCellActions` actions**: Default `availableActions` is `['edit', 'copy', 'delete']`. To enable copy on a list page: add `'copy'` to the array passed to `addActionsColumn` and provide an `onCopy` handler in the props object. Handler pattern: call the copy API, show a success toast, then `navigateTo` the new entity's URL. On error: `geinsLogError` + `showErrorToast`.
- **`TableCellActions` disabled actions**: Accepts a `disabledActions` prop — either a static `TableRowAction[]` or a per-row callback `(rowData: T) => TableRowAction[]`. Disabled items remain visible but non-interactive. Pass via `addActionsColumn` props: `disabledActions: (item) => item.status !== 'draft' ? ['delete'] : []`.

---

## Domain-Specific Knowledge

### Quotations

**Items:**

- `QuotationUpdate.items` accepts `QuotationItemCreate[]` (same shape as create: `{ skuId, quantity, unitPrice? }`).
- The Products tab uses a `Map<string, SkuItemData>` to track per-SKU quantity, unit price, and response prices (`ordPrice`, `listPrice`), separate from the selector selection state.
- `QuotationProductRow` is the table display type that maps `selectedSkus` + `skuItemData` into flat rows with columns: Product, SKU ID, Quantity, Price, Price list price, Quotation price.
- Price fields in the row type use `{ price: string, currency: string }` objects (matching the `'currency'`/`'editable-currency'` column types). The currency value comes from `form.values.details.currency`.
- In edit mode, prices are populated from `QuotationItemBase` response fields (`ordPrice`, `listPrice`, `unitPrice`). In create mode, prices are empty strings (displayed as `---` by `TableCellCurrency`).
- When loading existing quotation items in edit mode, initialize both `skuItemData` (from response items) and `skuSelection.ids` (from item SKU IDs) after products are fetched.
- `fetchProducts()` filters by both `channelIds` and `currencyIds` (from `entityData`) so the product selector only returns products with prices in the quotation's currency. Uses `productApi.query()` with a `SelectorSelectionQuery` selection object.

**Currency default in create mode:**

- When a company is selected, the currency auto-defaults to the channel's **default market** currency (via `channel.defaultMarket` → market lookup → `market.currency._id`), falling back to `availableCurrencies[0]` if no default market is found. This uses `getDefaultCurrencyForCompany()` in the company-selection watcher.

**Snapshot convention (entity sub-objects in responses):**

- `QuotationOwner`, `QuotationCustomer`, and `QuotationCompany` are snapshots — point-in-time captures stored with the quotation.
- Each snapshot extends `EntitySnapshot` (`shared/types/Global.ts`), which provides `_id: string`, `_type: string`, `_snapshotAt?: string | null` (leading underscores, matching the top-level entity shape).
- `QuotationOwner` and `QuotationCustomer` use `firstName`/`lastName` (no combined `name` or `email`). Use `fullName(x.firstName, x.lastName)` for display.
- To read IDs from snapshots: `company._id`, `owner._id`, `customer._id`, `billingAddress._id` (not `companyId`/`ownerId`/`customerId`/`addressId`).
- Quotation `billingAddress` and `shippingAddress` use the standard `Address` type (`shared/types/Global.ts`) — no separate snapshot type needed since the address shape is identical.

**API shape differences:**

- **`validPaymentMethods`**: Response returns `{ paymentId: number, name: string }`, but requests expect `{ paymentId: string }` (string, no `name`).
- **`QuotationTotal` shape**: `{ subtotal, discount, shipping, margin, vat, grandTotalExVat, grandTotalIncVat }` — all `number`. Note: field is `vat` (not `tax`), and grand total is split into ex-VAT and inc-VAT variants.
- **`QuotationCompany.vatNumber`**: The company snapshot uses `vatNumber` (not `orgNr`).
- **`QuotationStatus` casing**: All status values are lowercase (`'draft'`, `'pending'`, `'accepted'`, etc.) — consistent with the API.
- **`prepareUpdateData` must NOT spread the entity** — `entityDataUpdate` contains response-only fields (`billingAddress`, `shippingAddress`, `total`, `company`, `owner`, `customer`, `communication`, `changelog`, etc.) that the PATCH endpoint does not accept. Only include fields from the openapi update schema: `name`, `validTo`, `companyId`, `ownerId`, `customerId`, `validPaymentMethods`, `validShippingMethods`, `suggestedShippingFee`, `terms`, `billingAddressId`, `shippingAddressId`, `items`.
- **`quotationNumber`**: Read-only, auto-generated by the backend. Not accepted on the PATCH endpoint — render as a disabled input in the UI.
- **`discount`**: Optional `{ type: 'fixedAmount' | 'percent', value: number }` — accepted by both the PATCH and preview endpoints. The GET response also returns the saved discount configuration. Stored in `discountType`/`discountValue` refs (not form fields) in the edit page; synced to `entityDataUpdate` via a dedicated watcher.
- **`settings`**: `{ requireConfirmation?: boolean }` — nested object on create, update, and response. Controls whether the quotation workflow requires an explicit confirmation step before finalization. Stored in a standalone `requireConfirmation` ref (same pattern as discount); synced to `entityDataUpdate` via a dedicated watcher. Shown as a `Switch` toggle with a `ContentQuotationWorkflowInfo` popover in draft mode, read-only in sent mode.
- **OpenAPI spec URL**: `https://geins-func-quotation-mgmtapi-dev.azurewebsites.net/api/openapi/v3.json`

**Message CRUD:**

- `orderApi.quotation.createMessage(quotationId, data)` — `POST /quotation/{quotationId}/message` (returns void, 201). Re-fetch quotation to get the new message.
- `orderApi.quotation.updateMessage(messageId, data)` — `PATCH /quotation/message/{messageId}` (returns void, 204).
- `orderApi.quotation.deleteMessage(messageId)` — `DELETE /quotation/message/{messageId}` (returns void, 204).
- `QuotationMessageCreate`: `{ type, authorId, authorName, message, answerRef? }`.
- `QuotationMessageUpdate`: `{ type?, message?, answerRef? }`.
- `QuotationMessage` (response): `{ _id, _type, type, authorId, authorName, message, timestamp, answerRef? }`. Same flat shape as the create request.
- After any message mutation, call `refreshEntityData()` to re-fetch — the API does not return the updated message list.
- UI: `QuotationCommunications` → `QuotationMessageThread` (display with reply/edit/delete) + `QuotationMessageCompose` (send new). Shown in sent-mode Communications tab only.

**Live preview pattern:**

- Endpoint: `POST /quotation/{id}/preview` — calculates totals without persisting. Only available in draft edit mode (requires an existing quotation ID).
- Called automatically via `debouncedCallPreview` (500 ms) whenever `quotationItems` or `discountRequest` change.
- Response: `{ items: QuotationItem[], total: QuotationTotal }`. Items are enriched with `ordPrice` / `listPrice` from the applied price lists — these update `skuItemData` reactively. `unitPrice` is never overwritten from the preview response.
- `previewTotal` ref holds the live result; `displayTotal = computed(() => previewTotal.value ?? quotationTotal.value)` is passed to `ContentPriceSummary`. Sent mode uses `quotationTotal` (from GET) because preview is disabled.
- **Infinite loop prevention**: Preview is triggered from explicit user-action handlers (`handleQuantityChange`, `handleQuotationPriceChange`, `removeSkuFromSelection`, `ContentPriceSummary` blur event) and a `watch(simpleSkuSelection)`. Do NOT watch `quotationItems` to trigger preview — the preview response updates `skuItemData` (ordPrice/listPrice), which could change `quotationItems` output (via the `unitPrice !== listPrice` condition), creating an infinite loop.
- `ContentPriceSummary` accepts `QuotationTotal` — at runtime it handles `shipping` vs `suggestedShippingFee` differences via `'suggestedShippingFee' in props.total` to distinguish preview vs saved totals.

**Sent mode (non-draft statuses):**

- Three mutually exclusive modes: `createMode` (route param `new`), edit/draft mode (`!createMode && !sentMode`), sent mode (`quotation.status !== 'draft'`).
- `sentMode` is a `ref<boolean>` set in `parseEntityData` — since status transitions are one-way, it never reverts to draft.
- In sent mode, the General tab renders read-only display cards instead of form inputs, plus an "Items & Summary" card with a non-editable `TableMode.Minimal` table. The Products tab is replaced by a Communications tab.
- Tabs are a `computed` that switches between `[General, Products]` (draft) and `[General, Communications]` (sent).
- Status transition actions use a two-step pattern: `POST /quotation/{id}/{action}` (returns void) → `refreshEntityData()` re-fetches → `parseEntityData` updates all UI state including `sentMode`, `communications`, and the sidebar status badge.
- `StatusTransitionRequest` type: `{ authorId, authorName, message?: { type: QuotationMessageType, message } }`. Author info comes from `useUserStore`.
- All status transitions (including send) go through `DialogStatusTransition`. Required props: `action` (button label), `title` (dialog heading), `description` (dialog subtext), `loading`. Optional: `defaultMessageType` (sets initial tab selection, defaults to `'internal'`), `variant`, `icon`, `blockReasons`, `showMessage`. The dialog includes a `Tabs` toggle for switching between "Message to customer" and "Internal note". It emits `confirm(message, messageType)` and `cancel`.
- `StatusAction` interface: `{ action, label, title, description, variant?, icon?, messageType?, blockReasons? }`. All actions in `statusActions` computed use global i18n keys (`accept_entity`, `reject_entity`, `confirm_entity`, `cancel_entity` with `{ entityName }`) for label+title, and quotation-specific `orders.*_quotation_description` keys for description. The send action also uses `orders.send_quotation_description` (or `send_quotation_description_require_confirmation` when `requireConfirmation` is true). The finalize/place-order action uses `orders.place_order` (label+title) and `orders.place_order_description`.
- `handleStatusTransition(action, message, messageType)` — `messageType` now comes from the dialog emit, not the action config. The confirm action defaults to `messageType: 'toCustomer'` via `defaultMessageType` prop on the dialog.
- **`expire` status**: Never triggered manually — happens automatically. No UI actions or i18n keys needed for it.
- "Copy as new draft" calls `orderApi.quotation.copy(id)` (`POST /quotation/{id}/copy`) → shows success toast → navigates to the new draft.
- **Deletable statuses**: Delete is available for `draft`, `rejected`, `expired`, and `canceled` quotations. In draft mode, delete is in the `...` dropdown. In sent mode, `canDeleteInSentMode` (computed from `currentStatus`) gates a delete option in the sent-mode dropdown. Statuses like `pending`, `accepted`, `confirmed`, and `finalized` do not allow deletion.
- The sidebar `StatusBadge` is reactive: `useEntityEditSummary` accepts `status` as a `Ref` and `unref`s it in the computed.

### Companies

- **`CustomerCompany.priceLists`**: Array of `CustomerPriceList` objects (response type). Each has `_id`, `name`, `channel`, `currency`, `active`, `exVat`, `productCount` (extends `ProductPriceList` minus products/rules/query/forced/dateCreated).
- **`CustomerCompanyCreate/Update.priceLists`**: Array of `string` (just IDs).
- **Price list edit route**: `/pricing/price-list/[id]` — use `getEntityUrlFor('price-list', 'pricing', id)` to generate links.

### Products

- **`ProductApiOptions`** extends `ApiOptions` with `defaultChannel`, `defaultCurrency`, `defaultCountry`, `defaultLocale`. These are forwarded as query params by `buildQueryObject` (which passes through any extra string properties beyond `fields`/`pageSize`).
- **Product query filters**: `SelectorSelectionQuery` supports `channelIds`, `currencyIds`, `countryIds`, `categoryIds`, `brandIds`, `productIds`, `price`, and `stock` filters. These are passed in the POST body via `productApi.query({ include: [{ selections: [...] }] })`.
- **Product OpenAPI spec URL**: `https://geins-func-product-mgmtapi-dev.azurewebsites.net/api/openapi/v3.json`

### Price Lists

- **Copy endpoint**: Uses an ID-scoped sub-object: `productApi.priceList.id(id).copy()` (returns `ProductPriceList`). Unlike quotation which is flat (`orderApi.quotation.copy(id)`), price list copy is accessed via `.id(id).copy()`.
